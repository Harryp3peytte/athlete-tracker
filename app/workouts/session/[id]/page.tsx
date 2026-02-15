import { getWorkoutSession } from '@/app/actions/workouts'
import ActiveWorkoutSession from '@/components/workouts/ActiveWorkoutSession'

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getWorkoutSession(id)

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-white/15 bg-white/60 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_16px_45px_rgba(0,0,0,0.45)]">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Séance du {data.session.date}
          </div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {data.session.name}
          </div>
          {data.session.notes && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {data.session.notes}
            </div>
          )}
        </div>

        <ActiveWorkoutSession sessionId={id} initialExercises={data.exercises} />
      </div>
    </div>
  )
}

