import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const period = request.nextUrl.searchParams.get('period') || '7d';
  const days = period === '30d' ? 30 : 7;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabaseAdmin
    .from('nutrition_logs')
    .select('date, calories')
    .eq('athlete_id', auth.athleteId)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: true });

  const byDate: Record<string, number> = {};
  (data || []).forEach((m: { date: string; calories: number }) => {
    byDate[m.date] = (byDate[m.date] || 0) + (m.calories || 0);
  });

  return NextResponse.json(Object.entries(byDate).map(([date, calories]) => ({ date, calories })));
}
