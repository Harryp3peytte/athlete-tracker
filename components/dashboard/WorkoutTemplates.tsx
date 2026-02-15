'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { createWorkoutTemplate, startWorkoutFromTemplate } from '@/app/actions/workouts'

type TemplateExercise = {
  id: string
  exercise_name: string
  sets: number
  reps: number
  sort_order: number
}

type WorkoutTemplate = {
  id: string
  name: string
  weekday: number
  notes: string | null
  workout_template_exercises?: TemplateExercise[]
}

const weekdayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export default function WorkoutTemplates({ athleteId }: { athleteId: string }) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [name, setName] = useState('')
  const [weekday, setWeekday] = useState(String(new Date().getDay()))
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState([
    { name: '', sets: '4', reps: '8' },
  ])

  const todayWeekday = new Date().getDay()

  const scheduledToday = useMemo(
    () => templates.filter((t) => t.weekday === todayWeekday),
    [templates, todayWeekday]
  )

  useEffect(() => {
    async function fetchTemplates() {
      setIsLoading(true)
      setError(null)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('workout_templates')
          .select('*, workout_template_exercises(*)')
          .eq('athlete_id', athleteId)
          .order('weekday', { ascending: true })

        if (error) {
          // Erreur 42501 = permissions insuffisantes (tables probablement inexistantes)
          if (error.code === '42501' || error.code === '42P01') {
            setError('tables_missing')
          } else {
            setError(error.message)
          }
          setTemplates([])
        } else {
          setTemplates((data as any) ?? [])
        }
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement')
        setTemplates([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchTemplates()
  }, [athleteId])

  function addExercise() {
    setExercises((p) => [...p, { name: '', sets: '4', reps: '8' }])
  }

  function removeExercise(index: number) {
    setExercises((p) => p.filter((_, i) => i !== index))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append('name', name)
        fd.append('weekday', weekday)
        fd.append('notes', notes)
        fd.append(
          'exercises',
          JSON.stringify(
            exercises
              .filter((x) => x.name.trim() !== '')
              .map((x, idx) => ({
                name: x.name.trim(),
                sets: parseInt(x.sets || '0'),
                reps: parseInt(x.reps || '0'),
                sort_order: idx,
              }))
          )
        )
        await createWorkoutTemplate(fd)

        // refresh client list
        const supabase = createClient()
        const { data } = await supabase
          .from('workout_templates')
          .select('*, workout_template_exercises(*)')
          .eq('athlete_id', athleteId)
          .order('weekday', { ascending: true })
        setTemplates((data as any) ?? [])

        setName('')
        setNotes('')
        setExercises([{ name: '', sets: '4', reps: '8' }])
        setShowCreate(false)
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la création')
      }
    })
  }

  function handleStart(templateId: string) {
    startTransition(async () => {
      try {
        // server action redirige vers la séance active
        await startWorkoutFromTemplate(templateId)
      } catch (err: any) {
        setError(err.message || 'Erreur lors du démarrage de la séance')
      }
    })
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              Séances modèles (récurrentes)
            </CardTitle>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Exemple: “Dos” le mercredi → 1 clic pour démarrer et reprendre tes charges.
            </div>
          </div>
          <Button type="button" onClick={() => setShowCreate((s) => !s)}>
            {showCreate ? 'Fermer' : 'Créer une séance'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error === 'tables_missing' && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 backdrop-blur dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              ⚠️ Tables manquantes dans Supabase
            </div>
            <div className="mt-2 text-xs text-amber-800 dark:text-amber-300">
              Pour activer les séances modèles, exécute ce SQL dans Supabase :
            </div>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-amber-200 bg-white/50 p-3 text-[10px] dark:border-amber-500/30 dark:bg-black/20">
{`create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  name text not null,
  weekday int not null check (weekday between 0 and 6),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_name text not null,
  sets int not null default 0,
  reps int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- RLS Policies (ajuste selon tes besoins)
alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;

create policy "Users can view their own templates"
  on public.workout_templates for select
  using (athlete_id in (select id from public.athletes where user_id = auth.uid()));

create policy "Users can insert their own templates"
  on public.workout_templates for insert
  with check (athlete_id in (select id from public.athletes where user_id = auth.uid()));

create policy "Users can view their own template exercises"
  on public.workout_template_exercises for select
  using (template_id in (
    select id from public.workout_templates 
    where athlete_id in (select id from public.athletes where user_id = auth.uid())
  ));

create policy "Users can insert their own template exercises"
  on public.workout_template_exercises for insert
  with check (template_id in (
    select id from public.workout_templates 
    where athlete_id in (select id from public.athletes where user_id = auth.uid())
  ));`}
            </pre>
            <div className="mt-3 text-xs text-amber-800 dark:text-amber-300">
              Après avoir exécuté le SQL, recharge la page.
            </div>
          </div>
        )}
        {error && error !== 'tables_missing' && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/70 p-4 backdrop-blur dark:border-red-500/30 dark:bg-red-500/10">
            <div className="text-sm font-semibold text-red-900 dark:text-red-200">
              ⚠️ Erreur lors de la création
            </div>
            <div className="mt-2 text-xs text-red-800 dark:text-red-300">
              {error.includes('row-level security') ? (
                <>
                  <p className="mb-2">Erreur RLS (Row Level Security). Les policies doivent être correctement configurées.</p>
                  <p className="mb-2">Vérifie que tu as exécuté le SQL complet dans Supabase (voir le fichier <code className="rounded bg-red-100 px-1 dark:bg-red-500/20">supabase-setup.sql</code> à la racine du projet).</p>
                  <p className="text-xs">Détails : {error}</p>
                </>
              ) : (
                error
              )}
            </div>
          </div>
        )}
        {isLoading && (
          <div className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Chargement...
          </div>
        )}
        {scheduledToday.length > 0 && (
          <div className="mb-5 rounded-2xl border border-white/15 bg-white/35 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Aujourd’hui ({weekdayLabels[todayWeekday]}), à faire:
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {scheduledToday.map((t) => (
                <Button key={t.id} type="button" onClick={() => handleStart(t.id)}>
                  Démarrer {t.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="mb-6 rounded-2xl border border-white/15 bg-white/35 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom de la séance</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Jour</Label>
                <Select value={weekday} onChange={(e) => setWeekday(e.target.value)} required>
                  {weekdayLabels.map((w, idx) => (
                    <option key={idx} value={String(idx)}>
                      {w}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Exercices</Label>
                <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                  + Ajouter
                </Button>
              </div>
              {exercises.map((ex, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-2 rounded-2xl border border-white/15 bg-white/35 p-3 backdrop-blur dark:border-white/10 dark:bg-white/5 sm:grid-cols-6"
                >
                  <Input
                    className="sm:col-span-3"
                    placeholder="Nom (ex: Rowing barre)"
                    value={ex.name}
                    onChange={(e) =>
                      setExercises((p) => p.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))
                    }
                    required={i === 0}
                  />
                  <Input
                    className="sm:col-span-1"
                    type="number"
                    placeholder="Séries"
                    value={ex.sets}
                    onChange={(e) =>
                      setExercises((p) => p.map((x, idx) => (idx === i ? { ...x, sets: e.target.value } : x)))
                    }
                  />
                  <Input
                    className="sm:col-span-1"
                    type="number"
                    placeholder="Reps"
                    value={ex.reps}
                    onChange={(e) =>
                      setExercises((p) => p.map((x, idx) => (idx === i ? { ...x, reps: e.target.value } : x)))
                    }
                  />
                  <div className="sm:col-span-1 flex items-center justify-end">
                    {exercises.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeExercise(i)}>
                        Suppr.
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Création…' : 'Créer la séance'}
              </Button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-white/15 bg-white/35 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {t.name}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {weekdayLabels[t.weekday]}
                  </div>
                </div>
                <Button type="button" onClick={() => handleStart(t.id)} disabled={isPending}>
                  Démarrer
                </Button>
              </div>
              {t.workout_template_exercises?.length ? (
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                  {t.workout_template_exercises
                    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                    .slice(0, 4)
                    .map((e) => e.exercise_name)
                    .join(' • ')}
                  {t.workout_template_exercises.length > 4 ? ' …' : ''}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

