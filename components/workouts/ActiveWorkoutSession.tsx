'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { updateWorkoutExercise } from '@/app/actions/workouts'

type Exercise = {
  id: string
  exercise_name: string
  sets: number
  reps: number
  weight_kg: number | null
  notes: string | null
}

export default function ActiveWorkoutSession({
  sessionId,
  initialExercises,
}: {
  sessionId: string
  initialExercises: Exercise[]
}) {
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises)
  const [isPending, startTransition] = useTransition()
  const [savingId, setSavingId] = useState<string | null>(null)

  function updateLocal(id: string, patch: Partial<Exercise>) {
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  function saveRow(e: Exercise) {
    setSavingId(e.id)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('id', e.id)
      fd.append('sets', String(e.sets))
      fd.append('reps', String(e.reps))
      fd.append('weight_kg', e.weight_kg === null ? '' : String(e.weight_kg))
      fd.append('notes', e.notes ?? '')
      await updateWorkoutExercise(fd)
      setSavingId(null)
    })
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight">
          Exercices (charges pré-remplies depuis la dernière séance)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              className="rounded-2xl border border-white/15 bg-white/40 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {ex.exercise_name}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Ajuste tes valeurs puis sauvegarde ligne par ligne.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => saveRow(ex)}
                    disabled={isPending}
                  >
                    {savingId === ex.id ? 'Sauvegarde…' : 'Sauvegarder'}
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <div className="mb-1 text-[11px] text-gray-500 dark:text-gray-400">
                    Séries
                  </div>
                  <Input
                    type="number"
                    value={ex.sets}
                    min={0}
                    onChange={(ev) =>
                      updateLocal(ex.id, { sets: parseInt(ev.target.value || '0') })
                    }
                  />
                </div>
                <div>
                  <div className="mb-1 text-[11px] text-gray-500 dark:text-gray-400">
                    Reps
                  </div>
                  <Input
                    type="number"
                    value={ex.reps}
                    min={0}
                    onChange={(ev) =>
                      updateLocal(ex.id, { reps: parseInt(ev.target.value || '0') })
                    }
                  />
                </div>
                <div>
                  <div className="mb-1 text-[11px] text-gray-500 dark:text-gray-400">
                    Poids (kg)
                  </div>
                  <Input
                    type="number"
                    step="0.5"
                    value={ex.weight_kg ?? ''}
                    onChange={(ev) =>
                      updateLocal(ex.id, {
                        weight_kg: ev.target.value === '' ? null : parseFloat(ev.target.value),
                      })
                    }
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="mb-1 text-[11px] text-gray-500 dark:text-gray-400">
                    Notes
                  </div>
                  <Input
                    value={ex.notes ?? ''}
                    onChange={(ev) => updateLocal(ex.id, { notes: ev.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

