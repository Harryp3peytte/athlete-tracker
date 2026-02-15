import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAthlete } from '@/app/actions/athlete'
import DashboardOverview from '@/components/dashboard/DashboardOverview'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import AthleteProfileBar from '@/components/dashboard/AthleteProfileBar'
import LogForms from '@/components/dashboard/LogForms'
import WorkoutHistory from '@/components/dashboard/WorkoutHistory'
import WorkoutTemplatesClient from '@/components/dashboard/WorkoutTemplatesClient'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const athlete = await getAthlete()

  if (!athlete) {
    redirect('/setup')
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/15 bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white sm:text-xl">
              Suivi Athlète
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tableau de bord
            </p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Déconnexion
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 sm:py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Bonjour, {athlete.name}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Ta journée en un coup d’œil, puis lance ta séance en 1 clic.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <AthleteProfileBar athlete={athlete} />
          <DashboardOverview athleteId={athlete.id} />
          <DashboardCharts athleteId={athlete.id} />
          <LogForms />
          <WorkoutTemplatesClient athleteId={athlete.id} />
          <WorkoutHistory athleteId={athlete.id} />
        </div>
      </main>
    </div>
  )
}
