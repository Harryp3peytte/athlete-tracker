'use client'

import { useState } from 'react'
import AthleteEditDialog from './AthleteEditDialog'

export default function AthleteProfileBar({ athlete }: { athlete: any }) {
    const [isEditing, setIsEditing] = useState(false)

    return (
        <>
            <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-3 shadow-lg shadow-slate-200/50 backdrop-blur-2xl transition-all">
                {/* Glow effect */}
                <div className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_0_40px_rgba(255,255,255,0.8)]" />

                <div className="flex items-center justify-between px-8">
                    <div className="flex flex-1 items-center justify-around">
                        {/* Taille */}
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 text-slate-400">
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Taille</p>
                                <p className="text-2xl font-black text-slate-800 tracking-tight">
                                    {athlete.height_cm} <span className="text-base font-semibold text-slate-400">cm</span>
                                </p>
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="h-10 w-px bg-slate-200" />

                        {/* Age */}
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 text-slate-400">
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Âge</p>
                                <p className="text-2xl font-black text-slate-800 tracking-tight">
                                    {athlete.age} <span className="text-base font-semibold text-slate-400">ans</span>
                                </p>
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="h-10 w-px bg-slate-200" />

                        {/* Objectif */}
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 text-slate-400">
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Objectif</p>
                                <p className="text-2xl font-black text-slate-800 tracking-tight">
                                    {athlete.daily_calorie_target} <span className="text-base font-semibold text-slate-400">kcal</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="ml-8 border-l border-slate-200 pl-8">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-white to-slate-50 shadow-[0_4px_12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,1),inset_0_1px_0_rgba(255,255,255,1)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,1),inset_0_1px_0_rgba(255,255,255,1)] active:translate-y-0 active:shadow-sm"
                            aria-label="Modifier le profil"
                        >
                            <svg
                                className="h-6 w-6 text-slate-400 transition-colors group-hover:text-purple-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {isEditing && (
                <AthleteEditDialog athlete={athlete} onClose={() => setIsEditing(false)} />
            )}
        </>
    )
}
