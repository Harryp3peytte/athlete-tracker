'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import {
  addWeightLog,
  addSleepLog,
  addHydrationLog,
  addWellnessLog,
  addNutritionLog,
  addCardioLog,
} from '@/app/actions/logs'
import { format } from 'date-fns'

export default function LogForms() {
  const [activeTab, setActiveTab] = useState('nutrition')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData, action: (fd: FormData) => Promise<void>) {
    setIsSubmitting(true)
    try {
      await action(formData)
      // Reset form
      const form = document.getElementById(`form-${activeTab}`) as HTMLFormElement
      form?.reset()
      alert('Données enregistrées avec succès!')
    } catch (error) {
      alert('Erreur lors de l\'enregistrement')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabs = [
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'cardio', label: 'Cardio' },
    { id: 'sleep', label: 'Sommeil' },
    { id: 'hydration', label: 'Hydratation' },
    { id: 'wellness', label: 'Forme' },
    { id: 'weight', label: 'Poids' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter des données</CardTitle>
        <div className="flex flex-wrap gap-2 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-foreground text-background'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {/* Nutrition Form */}
        {activeTab === 'nutrition' && (
          <form
            id="form-nutrition"
            action={(fd) => handleSubmit(fd, addNutritionLog)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-nutrition">Date</Label>
                <Input
                  id="date-nutrition"
                  name="date"
                  type="date"
                  defaultValue={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="meal_type">Type de repas</Label>
                <Select id="meal_type" name="meal_type" required>
                  <option value="petit_dejeuner">Petit-déjeuner</option>
                  <option value="dejeuner">Déjeuner</option>
                  <option value="gouter">Goûter</option>
                  <option value="diner">Dîner</option>
                  <option value="collation">Collation</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" required />
            </div>
            <div>
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                name="calories"
                type="number"
                required
                min="0"
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Ajouter'}
            </Button>
          </form>
        )}

        {/* Cardio Form */}
        {activeTab === 'cardio' && (
          <form
            id="form-cardio"
            action={(fd) => handleSubmit(fd, addCardioLog)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-cardio">Date</Label>
                <Input
                  id="date-cardio"
                  name="date"
                  type="date"
                  defaultValue={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="activity_type">Type d'activité</Label>
                <Select id="activity_type" name="activity_type" required>
                  <option value="walking">Marche</option>
                  <option value="running">Course</option>
                  <option value="cycling">Vélo</option>
                  <option value="other">Autre</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="duration_minutes">Durée (min)</Label>
                <Input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  required
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="calories_burned">Calories brûlées</Label>
                <Input
                  id="calories_burned"
                  name="calories_burned"
                  type="number"
                  required
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="distance_km">Distance (km)</Label>
                <Input
                  id="distance_km"
                  name="distance_km"
                  type="number"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes-cardio">Notes</Label>
              <Textarea id="notes-cardio" name="notes" />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Ajouter'}
            </Button>
          </form>
        )}

        {/* Sleep Form */}
        {activeTab === 'sleep' && (
          <form
            id="form-sleep"
            action={(fd) => handleSubmit(fd, addSleepLog)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-sleep">Date</Label>
                <Input
                  id="date-sleep"
                  name="date"
                  type="date"
                  defaultValue={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="hours">Heures de sommeil</Label>
                <Input
                  id="hours"
                  name="hours"
                  type="number"
                  step="0.5"
                  required
                  min="0"
                  max="24"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="quality">Qualité (1-10)</Label>
              <Input
                id="quality"
                name="quality"
                type="number"
                required
                min="1"
                max="10"
              />
            </div>
            <div>
              <Label htmlFor="notes-sleep">Notes</Label>
              <Textarea id="notes-sleep" name="notes" />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Ajouter'}
            </Button>
          </form>
        )}

        {/* Hydration Form */}
        {activeTab === 'hydration' && (
          <form
            id="form-hydration"
            action={(fd) => handleSubmit(fd, addHydrationLog)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-hydration">Date</Label>
                <Input
                  id="date-hydration"
                  name="date"
                  type="date"
                  defaultValue={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="liters">Litres</Label>
                <Input
                  id="liters"
                  name="liters"
                  type="number"
                  step="0.1"
                  required
                  min="0"
                />
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Ajouter'}
            </Button>
          </form>
        )}

        {/* Wellness Form */}
        {activeTab === 'wellness' && (
          <form
            id="form-wellness"
            action={(fd) => handleSubmit(fd, addWellnessLog)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-wellness">Date</Label>
                <Input
                  id="date-wellness"
                  name="date"
                  type="date"
                  defaultValue={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="form_score">Score de forme (1-10)</Label>
                <Input
                  id="form_score"
                  name="form_score"
                  type="number"
                  required
                  min="1"
                  max="10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes-wellness">Notes</Label>
              <Textarea id="notes-wellness" name="notes" />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Ajouter'}
            </Button>
          </form>
        )}

        {/* Weight Form */}
        {activeTab === 'weight' && (
          <form
            id="form-weight"
            action={(fd) => handleSubmit(fd, addWeightLog)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-weight">Date</Label>
                <Input
                  id="date-weight"
                  name="date"
                  type="date"
                  defaultValue={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="weight_kg">Poids (kg)</Label>
                <Input
                  id="weight_kg"
                  name="weight_kg"
                  type="number"
                  step="0.1"
                  required
                  min="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes-weight">Notes</Label>
              <Textarea id="notes-weight" name="notes" />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Ajouter'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
