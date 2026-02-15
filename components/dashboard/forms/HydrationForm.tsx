'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { addHydrationLog } from '@/app/actions/logs'
import { format } from 'date-fns'

export default function HydrationForm({ onSuccess }: { onSuccess?: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = e.currentTarget
        setIsSubmitting(true)

        try {
            const formData = new FormData(form)
            await addHydrationLog(formData)
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
                    <Label htmlFor="date-hydration" className="text-gray-300">
                        Date
                    </Label>
                    <Input
                        id="date-hydration"
                        name="date"
                        type="date"
                        defaultValue={format(new Date(), 'yyyy-MM-dd')}
                        required
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>
                <div>
                    <Label htmlFor="liters" className="text-gray-300">
                        Litres
                    </Label>
                    <Input
                        id="liters"
                        name="liters"
                        type="number"
                        step="0.1"
                        required
                        min="0"
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>
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
