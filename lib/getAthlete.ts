import { SupabaseClient } from '@supabase/supabase-js';

export async function getAthleteId(
  supabase: SupabaseClient
): Promise<{ athleteId: string; userId: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: athlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!athlete) return null;

  return { athleteId: athlete.id, userId: user.id };
}
