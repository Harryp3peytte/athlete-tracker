'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { addSleepLog } from '@/app/actions/logs'
import { format } from 'date-fns'

export default function SleepForm({ onSuccess }: { onSuccess?: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = e.currentTarget
        setIsSubmitting(true)

        try {
            const formData = new FormData(form)
            await addSleepLog(formData)
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
                    <Label htmlFor="sleep-date" className="text-gray-300">
                        Date
                    </Label>
                    <Input
                        id="sleep-date"
                        name="date"
                        type="date"
                        defaultValue={format(new Date(), 'yyyy-MM-dd')}
                        required
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>
                <div>
                    <Label htmlFor="hours" className="text-gray-300">
                        Heures de sommeil
                    </Label>
                    <Input
                        id="hours"
                        name="hours"
                        type="number"
                        step="0.5"
                        required
                        min="0"
                        max="24"
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>
            </div>
            <div>
                <Label htmlFor="quality" className="text-gray-300">
                    Qualité (1-10)
                </Label>
                <Input
                    id="quality"
                    name="quality"
                    type="number"
                    required
                    min="1"
                    max="10"
                    className="bg-white/5 border-white/10 text-white"
                />
            </div>
            <div>
                <Label htmlFor="sleep-notes" className="text-gray-300">
                    Notes
                </Label>
                <Textarea
                    id="sleep-notes"
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
