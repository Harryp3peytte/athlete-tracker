'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { addCardioLog } from '@/app/actions/logs'
import { format } from 'date-fns'

export default function CardioForm({ onSuccess }: { onSuccess?: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = e.currentTarget
        setIsSubmitting(true)

        try {
            const formData = new FormData(form)
            await addCardioLog(formData)
            form.reset()
            onSuccess?.()
        } catch (error) {
            console.error(error)
            alert('Erreur lors de l\'enregistrement')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="cardio-date" className="text-gray-300">
                        Date
                    </Label>
                    <Input
                        id="cardio-date"
                        name="date"
                        type="date"
                        defaultValue={format(new Date(), 'yyyy-MM-dd')}
                        required
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>
                <div>
                    <Label htmlFor="activity_type" className="text-gray-300">
                        Type d'activité
                    </Label>
                    <Select
                        id="activity_type"
                        name="activity_type"
                        required
                        className="bg-white/5 border-white/10 text-white"
                    >
                        <option value="walking" className="text-black">Marche</option>
                        <option value="running" className="text-black">Course</option>
                        <option value="cycling" className="text-black">Vélo</option>
                        <option value="other" className="text-black">Autre</option>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="duration_minutes" className="text-gray-300">
                        Durée (min)
                    </Label>
                    <Input
                        id="duration_minutes"
                        name="duration_minutes"
                        type="number"
                        required
                        min="0"
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>
                <div>
                    <Label htmlFor="calories_burned" className="text-gray-300">
                        Calories
                    </Label>
                    <Input
                        id="calories_burned"
                        name="calories_burned"
                        type="number"
                        required
                        min="0"
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>
                <div>
                    <Label htmlFor="distance_km" className="text-gray-300">
                        Distance (km)
                    </Label>
                    <Input
                        id="distance_km"
                        name="distance_km"
                        type="number"
                        step="0.1"
                        min="0"
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>
            </div>
            <div>
                <Label htmlFor="cardio-notes" className="text-gray-300">
                    Notes
                </Label>
                <Textarea
                    id="cardio-notes"
                    name="notes"
                    className="bg-white/5 border-white/10 text-white"
                />
            </div>
            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white/20 hover:bg-white/30 text-white"
            >
                {isSubmitting ? 'Enregistrement...' : 'Ajouter'}
            </Button>
        </form>
    )
}
