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
  const sinceStr = since.toISOString().split('T')[0];

  const [athleteRes, mealsRes, cardioRes] = await Promise.all([
    supabaseAdmin.from('athletes').select('daily_calorie_target, base_metabolism').eq('id', auth.athleteId).single(),
    supabaseAdmin.from('nutrition_logs').select('date, calories').eq('athlete_id', auth.athleteId).gte('date', sinceStr),
    supabaseAdmin.from('cardio_logs').select('date, calories_burned').eq('athlete_id', auth.athleteId).gte('date', sinceStr),
  ]);

  const target = athleteRes.data?.daily_calorie_target || 2000;
  const metabolism = athleteRes.data?.base_metabolism || 1800;
  const mealsByDate: Record<string, number> = {};
  const burnedByDate: Record<string, number> = {};

  (mealsRes.data || []).forEach((m: { date: string; calories: number }) => { mealsByDate[m.date] = (mealsByDate[m.date] || 0) + (m.calories || 0); });
  (cardioRes.data || []).forEach((c: { date: string; calories_burned: number }) => { burnedByDate[c.date] = (burnedByDate[c.date] || 0) + (c.calories_burned || 0); });

  const allDates = new Set([...Object.keys(mealsByDate), ...Object.keys(burnedByDate)]);
  const result = Array.from(allDates).sort().map(date => {
    const totalBurned = metabolism + (burnedByDate[date] || 0);
    return {
      date,
      consumed: mealsByDate[date] || 0,
      burned: totalBurned,
      net: (mealsByDate[date] || 0) - totalBurned,
      target,
    };
  });

  return NextResponse.json(result);
}
