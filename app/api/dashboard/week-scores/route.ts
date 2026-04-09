import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';
import { calculateHealthScore } from '@/lib/healthScore';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const weekStart = request.nextUrl.searchParams.get('weekStart');
  if (!weekStart) {
    return NextResponse.json({ error: 'weekStart parameter required (YYYY-MM-DD)' }, { status: 400 });
  }

  // Get athlete for calorie target and goal type
  const { data: athlete } = await supabaseAdmin
    .from('athletes')
    .select('daily_calorie_target, goal_type')
    .eq('id', auth.athleteId)
    .single();

  if (!athlete) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
  }

  const today = new Date().toISOString().split('T')[0];
  const startDate = new Date(weekStart + 'T12:00:00');

  // Generate 7 days
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isFuture = dateStr > today;

    if (isFuture) {
      days.push({ date: dateStr, score: null, dayOfWeek: i });
    } else {
      const result = await calculateHealthScore(
        auth.athleteId,
        dateStr,
        athlete.daily_calorie_target,
        athlete.goal_type
      );
      days.push({ date: dateStr, score: result.total, dayOfWeek: i });
    }
  }

  return NextResponse.json(days);
}
