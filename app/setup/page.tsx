import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAthlete } from '@/app/actions/athlete'
import SetupForm from '@/components/setup/SetupForm'

export default async function SetupPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const athlete = await getAthlete()

  if (athlete) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-2xl">
        <SetupForm />
      </div>
    </div>
  )
}
