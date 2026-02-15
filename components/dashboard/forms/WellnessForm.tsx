'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { addWellnessLog } from '@/app/actions/logs'
import { format } from 'date-fns'

export default function WellnessForm({ onSuccess }: { onSuccess?: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = e.currentTarget
        setIsSubmitting(true)

        try {
            const formData = new FormData(form)
            await addWellnessLog(formData)
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
                    <Label htmlFor="date-wellness" className="text-gray-300">
                        Date
                    </Label>
                    <Input
                        id="date-wellness"
                        name="date"
                        type="date"
                        defaultValue={format(new Date(), 'yyyy-MM-dd')}
                        required
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>
                <div>
                    <Label htmlFor="form_score" className="text-gray-300">
                        Score (1-10)
                    </Label>
                    <Input
                        id="form_score"
                        name="form_score"
                        type="number"
                        required
                        min="1"
                        max="10"
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>
            </div>
            <div>
                <Label htmlFor="notes-wellness" className="text-gray-300">
                    Notes
                </Label>
                <Textarea
                    id="notes-wellness"
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
