import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function getAuthAndAthlete(): Promise<{ athleteId: string; userId: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const supabaseAdmin = getSupabaseAdmin();
  const { data: athlete } = await supabaseAdmin
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!athlete) return null;
  return { athleteId: athlete.id, userId: user.id };
}

export async function getAthleteId(supabase: { auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> } }): Promise<{ athleteId: string; userId: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const supabaseAdmin = getSupabaseAdmin();
  const { data: athlete } = await supabaseAdmin
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!athlete) return null;
  return { athleteId: athlete.id, userId: user.id };
}
