'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import QuickAddDialog from './QuickAddDialog'
import HydrationForm from './forms/HydrationForm'

export default function HydrationCard({ liters }: { liters: number | null }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-blue-900/20 via-black/40 to-black/40 backdrop-blur-xl">
                {/* Glow effect */}
                <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]" />

                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-blue-200">
                        Hydratation
                    </CardTitle>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="rounded-full bg-white/5 p-1.5 transition-all hover:bg-white/10 hover:scale-110"
                        aria-label="Ajouter hydratation"
                    >
                        <svg
                            className="h-4 w-4 text-blue-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v12m6-6H6"
                            />
                        </svg>
                    </button>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">
                        {liters ? `${liters}L` : '—'}
                    </div>
                </CardContent>
            </Card>

            {isOpen && (
                <QuickAddDialog
                    title="Ajouter hydratation"
                    onClose={() => setIsOpen(false)}
                >
                    <HydrationForm onSuccess={() => setIsOpen(false)} />
                </QuickAddDialog>
            )}
        </>
    )
}
