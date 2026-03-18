import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAthleteId } from '@/lib/getAthlete';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const monthParam = request.nextUrl.searchParams.get('month'); // format YYYY-MM
  const now = new Date();
  const year = monthParam ? parseInt(monthParam.split('-')[0]) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam.split('-')[1]) - 1 : now.getMonth();

  const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
  const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const [workoutsRes, cardioRes] = await Promise.all([
    supabase
      .from('workout_sessions')
      .select('date, name')
      .eq('athlete_id', auth.athleteId)
      .gte('date', firstDay)
      .lte('date', lastDay),
    supabase
      .from('cardio_logs')
      .select('date, activity_type')
      .eq('athlete_id', auth.athleteId)
      .gte('date', firstDay)
      .lte('date', lastDay),
  ]);

  // Group by date
  const dayMap: Record<string, { workouts: string[]; cardio: string[] }> = {};

  (workoutsRes.data || []).forEach((w: { date: string; name: string | null }) => {
    if (!dayMap[w.date]) dayMap[w.date] = { workouts: [], cardio: [] };
    dayMap[w.date].workouts.push(w.name || 'Séance');
  });

  (cardioRes.data || []).forEach((c: { date: string; activity_type: string }) => {
    if (!dayMap[c.date]) dayMap[c.date] = { workouts: [], cardio: [] };
    dayMap[c.date].cardio.push(c.activity_type);
  });

  const days = Object.entries(dayMap).map(([date, data]) => ({
    date,
    type: data.workouts.length > 0 && data.cardio.length > 0 ? 'both'
      : data.workouts.length > 0 ? 'workout' : 'cardio',
    workout: data.workouts.join(', ') || null,
    cardio: data.cardio.join(', ') || null,
  }));

  return NextResponse.json({ days, year, month: month + 1 });
}
