'use client'

import dynamic from 'next/dynamic'

// Import dynamique pour éviter les erreurs si les tables n'existent pas
const WorkoutTemplatesWrapper = dynamic(
  () =>
    import('@/components/dashboard/WorkoutTemplatesWrapper').catch(() => {
      // Si le module ne peut pas être chargé, retourner un composant de fallback
      return {
        default: () => (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 backdrop-blur dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              ⚠️ Séances modèles non disponibles
            </div>
            <div className="mt-2 text-xs text-amber-800 dark:text-amber-300">
              Les tables doivent être créées dans Supabase. Voir le README pour les instructions SQL.
            </div>
          </div>
        ),
      }
    }),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-white/15 bg-white/60 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <div className="text-sm text-gray-600 dark:text-gray-400">Chargement des séances modèles...</div>
      </div>
    ),
  }
)

export default function WorkoutTemplatesClient({ athleteId }: { athleteId: string }) {
  return <WorkoutTemplatesWrapper athleteId={athleteId} />
}
