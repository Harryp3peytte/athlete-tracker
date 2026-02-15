'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAthlete() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('athletes')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data
}

export async function createAthlete(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Non authentifié')

  const data = {
    user_id: user.id,
    name: formData.get('name') as string,
    age: parseInt(formData.get('age') as string),
    height_cm: parseInt(formData.get('height_cm') as string),
    gender: formData.get('gender') as string,
    base_metabolism: parseInt(formData.get('base_metabolism') as string),
    daily_calorie_target: parseInt(formData.get('daily_calorie_target') as string),
  }

  const { error } = await supabase.from('athletes').insert(data)

  if (error) throw error

  revalidatePath('/dashboard')
}

export async function updateAthlete(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Non authentifié')

  const data = {
    age: parseInt(formData.get('age') as string),
    height_cm: parseInt(formData.get('height_cm') as string),
    daily_calorie_target: parseInt(formData.get('daily_calorie_target') as string),
  }

  const { error } = await supabase
    .from('athletes')
    .update(data)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath('/dashboard')
}
