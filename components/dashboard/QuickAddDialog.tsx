'use client'

import { ReactNode, useEffect } from 'react'

export default function QuickAddDialog({
    children,
    onClose,
    title,
}: {
    children: ReactNode
    onClose: () => void
    title: string
}) {
    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-black/50 via-black/30 to-black/50 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_40px_rgba(59,130,246,0.15)] backdrop-blur-2xl">
                {/* Glow effect */}
                <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.03)]" />

                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Fermer"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div>{children}</div>
            </div>
        </div>
    )
}
