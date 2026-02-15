import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAthlete } from '@/app/actions/athlete'

export default async function Home() {
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

  redirect('/dashboard')
}
