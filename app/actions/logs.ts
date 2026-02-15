'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

export async function addWeightLog(formData: FormData) {
  const supabase = await createClient()
  const athleteId = await getAthleteId()

  const { error } = await supabase.from('weight_logs').insert({
    athlete_id: athleteId,
    date: formData.get('date') as string,
    weight_kg: parseFloat(formData.get('weight_kg') as string),
    notes: formData.get('notes') as string || null,
  })

  if (error) throw error
  revalidatePath('/dashboard')
}

export async function addSleepLog(formData: FormData) {
  const supabase = await createClient()
  const athleteId = await getAthleteId()

  const { error } = await supabase.from('sleep_logs').insert({
    athlete_id: athleteId,
    date: formData.get('date') as string,
    hours: parseFloat(formData.get('hours') as string),
    quality: parseInt(formData.get('quality') as string),
    notes: formData.get('notes') as string || null,
  })

  if (error) throw error
  revalidatePath('/dashboard')
}

export async function addHydrationLog(formData: FormData) {
  const supabase = await createClient()
  const athleteId = await getAthleteId()

  const { error } = await supabase.from('hydration_logs').insert({
    athlete_id: athleteId,
    date: formData.get('date') as string,
    liters: parseFloat(formData.get('liters') as string),
  })

  if (error) throw error
  revalidatePath('/dashboard')
}

export async function addWellnessLog(formData: FormData) {
  const supabase = await createClient()
  const athleteId = await getAthleteId()

  const { error } = await supabase.from('wellness_logs').insert({
    athlete_id: athleteId,
    date: formData.get('date') as string,
    form_score: parseInt(formData.get('form_score') as string),
    notes: formData.get('notes') as string || null,
  })

  if (error) throw error
  revalidatePath('/dashboard')
}

export async function addNutritionLog(formData: FormData) {
  const supabase = await createClient()
  const athleteId = await getAthleteId()

  const { error } = await supabase.from('nutrition_logs').insert({
    athlete_id: athleteId,
    date: formData.get('date') as string,
    meal_type: formData.get('meal_type') as string,
    description: formData.get('description') as string,
    calories: parseInt(formData.get('calories') as string),
  })

  if (error) throw error
  revalidatePath('/dashboard')
}

export async function addCardioLog(formData: FormData) {
  const supabase = await createClient()
  const athleteId = await getAthleteId()

  const { error } = await supabase.from('cardio_logs').insert({
    athlete_id: athleteId,
    date: formData.get('date') as string,
    activity_type: formData.get('activity_type') as string,
    duration_minutes: parseInt(formData.get('duration_minutes') as string),
    calories_burned: parseInt(formData.get('calories_burned') as string),
    distance_km: formData.get('distance_km') ? parseFloat(formData.get('distance_km') as string) : null,
    notes: formData.get('notes') as string || null,
  })

  if (error) throw error
  revalidatePath('/dashboard')
}

export async function addWorkoutSession(formData: FormData) {
  const supabase = await createClient()
  const athleteId = await getAthleteId()

  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      athlete_id: athleteId,
      date: formData.get('date') as string,
      name: formData.get('name') as string,
      notes: formData.get('notes') as string || null,
    })
    .select()
    .single()

  if (error) throw error

  // Add exercises
  const exercisesJson = formData.get('exercises') as string
  if (exercisesJson) {
    const exercises = JSON.parse(exercisesJson)
    const exerciseRows = exercises
      .filter((ex: any) => ex.name && ex.name.trim() !== '')
      .map((ex: any) => ({
        session_id: data.id,
        exercise_name: ex.name.trim(),
        sets: parseInt(ex.sets) || 0,
        reps: parseInt(ex.reps) || 0,
        weight_kg: ex.weight_kg && ex.weight_kg !== '' ? parseFloat(ex.weight_kg) : null,
        notes: ex.notes && ex.notes.trim() !== '' ? ex.notes.trim() : null,
      }))
    
    if (exerciseRows.length > 0) {
      const { error: exError } = await supabase
        .from('workout_exercises')
        .insert(exerciseRows)
      
      if (exError) throw exError
    }
  }

  revalidatePath('/dashboard')
}
