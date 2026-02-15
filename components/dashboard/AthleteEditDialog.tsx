'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateAthlete } from '@/app/actions/athlete'
import QuickAddDialog from './QuickAddDialog'

export default function AthleteEditDialog({
    athlete,
    onClose,
}: {
    athlete: any
    onClose: () => void
}) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        try {
            await updateAthlete(formData)
            onClose()
        } catch (error) {
            console.error(error)
            alert('Erreur lors de la mise à jour')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <QuickAddDialog title="Modifier mon profil" onClose={onClose}>
            <form action={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="height_cm" className="text-gray-300">
                            Taille (cm)
                        </Label>
                        <Input
                            id="height_cm"
                            name="height_cm"
                            type="number"
                            defaultValue={athlete.height_cm}
                            required
                            min="100"
                            max="250"
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                    <div>
                        <Label htmlFor="age" className="text-gray-300">
                            Âge
                        </Label>
                        <Input
                            id="age"
                            name="age"
                            type="number"
                            defaultValue={athlete.age}
                            required
                            min="10"
                            max="100"
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                </div>
                <div>
                    <Label htmlFor="daily_calorie_target" className="text-gray-300">
                        Objectif Calorique Journalier
                    </Label>
                    <Input
                        id="daily_calorie_target"
                        name="daily_calorie_target"
                        type="number"
                        defaultValue={athlete.daily_calorie_target}
                        required
                        min="1000"
                        max="10000"
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-white/20 hover:bg-white/30 text-white"
                >
                    {isSubmitting ? 'Enregistrement...' : 'Mettre à jour'}
                </Button>
            </form>
        </QuickAddDialog>
    )
}
