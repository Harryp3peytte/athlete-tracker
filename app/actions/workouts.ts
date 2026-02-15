'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'

async function getAthleteId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Non authentifié')

  const { data } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!data) throw new Error('Profil athlète non trouvé')
  return data.id
}

export async function listWorkoutTemplates() {
  const supabase = await createClient()
  const athleteId = await getAthleteId()

  const { data, error } = await supabase
    .from('workout_templates')
    .select('*, workout_template_exercises(*)')
    .eq('athlete_id', athleteId)
    .order('weekday', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createWorkoutTemplate(formData: FormData) {
  const supabase = await createClient()
  const athleteId = await getAthleteId()

  const name = (formData.get('name') as string)?.trim()
  const weekday = parseInt(formData.get('weekday') as string)
  const notes = (formData.get('notes') as string) || null
  const exercisesJson = formData.get('exercises') as string
  const exercises: Array<{ name: string; sets: number; reps: number }> = exercisesJson
    ? JSON.parse(exercisesJson)
    : []

  if (!name) throw new Error('Nom manquant')
  if (Number.isNaN(weekday)) throw new Error('Jour manquant')
  if (!exercises.length) throw new Error('Ajoute au moins 1 exercice')

  // Vérifier si les tables existent
  const { error: checkError } = await supabase
    .from('workout_templates')
    .select('id')
    .limit(0)

  if (checkError) {
    if (checkError.code === '42501' || checkError.code === '42P01') {
      throw new Error('Les tables workout_templates et workout_template_exercises doivent être créées dans Supabase. Voir le message d\'aide sur le dashboard.')
    }
    throw checkError
  }

  const { data: template, error: templateError } = await supabase
    .from('workout_templates')
    .insert({
      athlete_id: athleteId,
      name,
      weekday,
      notes,
    })
    .select()
    .single()

  if (templateError) {
    // Améliorer le message d'erreur pour les problèmes RLS
    if (templateError.code === '42501') {
      throw new Error(
        `Erreur RLS: ${templateError.message}. Vérifie que les policies RLS sont correctement configurées dans Supabase. Voir le fichier supabase-setup.sql pour le SQL complet.`
      )
    }
    throw templateError
  }

  const rows = exercises.map((ex, idx) => ({
    template_id: template.id,
    exercise_name: ex.name,
    sets: ex.sets,
    reps: ex.reps,
    sort_order: idx,
  }))

  const { error: exError } = await supabase
    .from('workout_template_exercises')
    .insert(rows)

  if (exError) throw exError

  revalidatePath('/dashboard')
}

export async function startWorkoutFromTemplate(templateId: string) {
  const supabase = await createClient()
  const athleteId = await getAthleteId()
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: tpl, error: tplErr } = await supabase
    .from('workout_templates')
    .select('*, workout_template_exercises(*)')
    .eq('id', templateId)
    .eq('athlete_id', athleteId)
    .single()

  if (tplErr) {
    if (tplErr.code === '42501' || tplErr.code === '42P01') {
      throw new Error('Les tables workout_templates et workout_template_exercises doivent être créées dans Supabase.')
    }
    throw tplErr
  }
  if (!tpl) throw new Error('Template introuvable')

  // Dernière séance du même nom (pour reprendre les charges)
  const { data: prevSession } = await supabase
    .from('workout_sessions')
    .select('id, date')
    .eq('athlete_id', athleteId)
    .eq('name', tpl.name)
    .lt('date', today)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const previousWeightsByExercise = new Map<string, number | null>()
  if (prevSession?.id) {
    const { data: prevExercises } = await supabase
      .from('workout_exercises')
      .select('exercise_name, weight_kg')
      .eq('session_id', prevSession.id)

    prevExercises?.forEach((e) =>
      previousWeightsByExercise.set(e.exercise_name, e.weight_kg)
    )
  }

  const { data: session, error: sessionErr } = await supabase
    .from('workout_sessions')
    .insert({
      athlete_id: athleteId,
      date: today,
      name: tpl.name,
      notes: `template:${tpl.id}${tpl.notes ? ` | ${tpl.notes}` : ''}`,
    })
    .select()
    .single()

  if (sessionErr) throw sessionErr

  const ordered = (tpl.workout_template_exercises ?? []).sort(
    (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )

  const exRows = ordered
    .map((ex: any) => ({
      session_id: session.id,
      exercise_name: ex.exercise_name,
      sets: ex.sets || 0,
      reps: ex.reps || 0,
      weight_kg: previousWeightsByExercise.get(ex.exercise_name) ?? null,
      notes: null,
    }))
    .filter((row: any) => row.exercise_name && row.exercise_name.trim() !== '')

  if (exRows.length) {
    const { error: exErr } = await supabase
      .from('workout_exercises')
      .insert(exRows)
    if (exErr) {
      // Si l'erreur est due à weight_kg NOT NULL, essayer sans weight_kg pour les valeurs null
      if (exErr.code === '23502' && exErr.message?.includes('weight_kg')) {
        const exRowsWithoutNullWeight = exRows.map((row: any) => {
          const { weight_kg, ...rest } = row
          return weight_kg !== null ? row : rest
        })
        const { error: retryErr } = await supabase
          .from('workout_exercises')
          .insert(exRowsWithoutNullWeight)
        if (retryErr) throw retryErr
      } else {
        throw exErr
      }
    }
  }

  revalidatePath('/dashboard')
  redirect(`/workouts/session/${session.id}`)
}

export async function getWorkoutSession(sessionId: string) {
  const supabase = await createClient()
  const athleteId = await getAthleteId()

  const { data: session, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('athlete_id', athleteId)
    .single()

  if (error) throw error

  const { data: exercises } = await supabase
    .from('workout_exercises')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  return { session, exercises: exercises ?? [] }
}

export async function updateWorkoutExercise(formData: FormData) {
  const supabase = await createClient()
  await getAthleteId() // auth guard

  const id = formData.get('id') as string
  const sets = parseInt(formData.get('sets') as string)
  const reps = parseInt(formData.get('reps') as string)
  const weightRaw = formData.get('weight_kg') as string
  const weight_kg = weightRaw === '' ? null : parseFloat(weightRaw)
  const notes = (formData.get('notes') as string) || null

  const { error } = await supabase
    .from('workout_exercises')
    .update({ sets, reps, weight_kg, notes })
    .eq('id', id)

  if (error) throw error
}

