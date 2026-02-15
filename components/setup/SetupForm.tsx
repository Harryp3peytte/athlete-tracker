'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAthlete } from '@/app/actions/athlete'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

export default function SetupForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const formData = new FormData(e.currentTarget)
      await createAthlete(formData)
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      alert('Erreur lors de la création du profil')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Configuration du profil
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Âge</Label>
              <Input
                id="age"
                name="age"
                type="number"
                required
                min="1"
                max="120"
              />
            </div>
            <div>
              <Label htmlFor="height_cm">Taille (cm)</Label>
              <Input
                id="height_cm"
                name="height_cm"
                type="number"
                required
                min="50"
                max="250"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="gender">Genre</Label>
            <Select id="gender" name="gender" required>
              <option value="">Sélectionner...</option>
              <option value="male">Homme</option>
              <option value="female">Femme</option>
              <option value="other">Autre</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="base_metabolism">Métabolisme de base (kcal)</Label>
              <Input
                id="base_metabolism"
                name="base_metabolism"
                type="number"
                required
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="daily_calorie_target">
                Objectif calories quotidien (kcal)
              </Label>
              <Input
                id="daily_calorie_target"
                name="daily_calorie_target"
                type="number"
                required
                min="0"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Création...' : 'Créer le profil'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
