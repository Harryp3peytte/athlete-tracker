'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { addWorkoutSession } from '@/app/actions/logs'
import { format } from 'date-fns'

interface WorkoutSession {
  id: string
  date: string
  name: string
  notes: string | null
  exercises: {
    id: string
    exercise_name: string
    sets: number
    reps: number
    weight_kg: number | null
    notes: string | null
  }[]
}

export default function WorkoutHistory({ athleteId }: { athleteId: string }) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [showForm, setShowForm] = useState(false)
  const [exercises, setExercises] = useState([
    { name: '', sets: '', reps: '', weight_kg: '', notes: '' },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function fetchSessions() {
      const supabase = createClient()
      const { data: sessionsData } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('date', { ascending: false })
        .limit(10)

      if (sessionsData) {
        const sessionsWithExercises = await Promise.all(
          sessionsData.map(async (session) => {
            const { data: exercisesData } = await supabase
              .from('workout_exercises')
              .select('*')
              .eq('session_id', session.id)
              .order('created_at', { ascending: true })

            return {
              ...session,
              exercises: exercisesData || [],
            }
          })
        )
        setSessions(sessionsWithExercises)
      }
    }

    fetchSessions()
  }, [athleteId])

  function addExercise() {
    setExercises([...exercises, { name: '', sets: '', reps: '', weight_kg: '', notes: '' }])
  }

  function removeExercise(index: number) {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  function updateExercise(index: number, field: string, value: string) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: value }
    setExercises(updated)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const formData = new FormData(e.currentTarget)
      const exercisesData = exercises
        .filter((ex) => ex.name.trim() !== '')
        .map((ex) => ({
          name: ex.name,
          sets: parseInt(ex.sets) || 0,
          reps: parseInt(ex.reps) || 0,
          weight_kg: ex.weight_kg ? parseFloat(ex.weight_kg) : null,
          notes: ex.notes || null,
        }))

      formData.append('exercises', JSON.stringify(exercisesData))
      await addWorkoutSession(formData)
      
      // Reset form
      e.currentTarget.reset()
      setExercises([{ name: '', sets: '', reps: '', weight_kg: '', notes: '' }])
      setShowForm(false)
      
      // Refresh sessions
      const supabase = createClient()
      const { data: sessionsData } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('date', { ascending: false })
        .limit(10)

      if (sessionsData) {
        const sessionsWithExercises = await Promise.all(
          sessionsData.map(async (session) => {
            const { data: exercisesData } = await supabase
              .from('workout_exercises')
              .select('*')
              .eq('session_id', session.id)
              .order('created_at', { ascending: true })

            return {
              ...session,
              exercises: exercisesData || [],
            }
          })
        )
        setSessions(sessionsWithExercises)
      }

      alert('Séance enregistrée avec succès!')
    } catch (error) {
      alert('Erreur lors de l\'enregistrement')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Historique des séances de musculation</CardTitle>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : 'Nouvelle séance'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-workout">Date</Label>
                <Input
                  id="date-workout"
                  name="date"
                  type="date"
                  defaultValue={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name-workout">Nom de la séance</Label>
                <Input id="name-workout" name="name" required />
              </div>
            </div>
            <div>
              <Label htmlFor="notes-workout">Notes</Label>
              <Textarea id="notes-workout" name="notes" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Exercices</Label>
                <Button type="button" onClick={addExercise} variant="outline" size="sm">
                  + Ajouter exercice
                </Button>
              </div>
              {exercises.map((exercise, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 border rounded">
                  <Input
                    placeholder="Nom"
                    value={exercise.name}
                    onChange={(e) => updateExercise(index, 'name', e.target.value)}
                    required={index === 0}
                  />
                  <Input
                    placeholder="Séries"
                    type="number"
                    value={exercise.sets}
                    onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                  />
                  <Input
                    placeholder="Reps"
                    type="number"
                    value={exercise.reps}
                    onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                  />
                  <Input
                    placeholder="Poids (kg)"
                    type="number"
                    step="0.5"
                    value={exercise.weight_kg}
                    onChange={(e) => updateExercise(index, 'weight_kg', e.target.value)}
                  />
                  <Input
                    placeholder="Notes"
                    value={exercise.notes}
                    onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                  />
                  {exercises.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeExercise(index)}
                      variant="ghost"
                      size="sm"
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer la séance'}
            </Button>
          </form>
        )}

        <div className="space-y-4">
          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucune séance enregistrée
            </p>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{session.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(session.date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                {session.notes && (
                  <p className="text-sm text-muted-foreground mb-3">{session.notes}</p>
                )}
                <div className="space-y-2">
                  {session.exercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <div>
                        <span className="font-medium">{exercise.exercise_name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {exercise.sets} séries × {exercise.reps} reps
                          {exercise.weight_kg && ` @ ${exercise.weight_kg}kg`}
                        </span>
                      </div>
                      {exercise.notes && (
                        <span className="text-xs text-muted-foreground">
                          {exercise.notes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
