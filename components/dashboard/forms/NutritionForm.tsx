'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { addNutritionLog } from '@/app/actions/logs'
import { format } from 'date-fns'

export default function NutritionForm({ onSuccess }: { onSuccess?: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = e.currentTarget
        setIsSubmitting(true)

        try {
            const formData = new FormData(form)
            await addNutritionLog(formData)
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
                    <Label htmlFor="nutrition-date" className="text-gray-300">
                        Date
                    </Label>
                    <Input
                        id="nutrition-date"
                        name="date"
                        type="date"
                        defaultValue={format(new Date(), 'yyyy-MM-dd')}
                        required
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>
                <div>
                    <Label htmlFor="meal_type" className="text-gray-300">
                        Type de repas
                    </Label>
                    <Select
                        id="meal_type"
                        name="meal_type"
                        required
                        className="bg-white/5 border-white/10 text-white"
                    >
                        <option value="petit_dejeuner" className="text-black">Petit-déjeuner</option>
                        <option value="dejeuner" className="text-black">Déjeuner</option>
                        <option value="gouter" className="text-black">Goûter</option>
                        <option value="diner" className="text-black">Dîner</option>
                        <option value="collation" className="text-black">Collation</option>
                    </Select>
                </div>
            </div>
            <div>
                <Label htmlFor="description" className="text-gray-300">
                    Description
                </Label>
                <Input
                    id="description"
                    name="description"
                    required
                    className="bg-white/5 border-white/10 text-white"
                />
            </div>
            <div>
                <Label htmlFor="calories" className="text-gray-300">
                    Calories
                </Label>
                <Input
                    id="calories"
                    name="calories"
                    type="number"
                    required
                    min="0"
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
