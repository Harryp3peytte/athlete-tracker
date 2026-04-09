import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';

export async function GET() {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // ── STREAK: count consecutive days with at least one log ──
  // Check last 90 days to find the current streak
  const dates: Set<string> = new Set();
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(today.getDate() - 90);
  const sinceStr = ninetyDaysAgo.toISOString().split('T')[0];

  const [meals, cardio, workouts, sleep, hydration, wellness] = await Promise.all([
    supabaseAdmin.from('nutrition_logs').select('date').eq('athlete_id', auth.athleteId).gte('date', sinceStr),
    supabaseAdmin.from('cardio_logs').select('date').eq('athlete_id', auth.athleteId).gte('date', sinceStr),
    supabaseAdmin.from('workout_sessions').select('date').eq('athlete_id', auth.athleteId).gte('date', sinceStr),
    supabaseAdmin.from('sleep_logs').select('date').eq('athlete_id', auth.athleteId).gte('date', sinceStr),
    supabaseAdmin.from('hydration_logs').select('date').eq('athlete_id', auth.athleteId).gte('date', sinceStr),
    supabaseAdmin.from('wellness_logs').select('date').eq('athlete_id', auth.athleteId).gte('date', sinceStr),
  ]);

  [meals, cardio, workouts, sleep, hydration, wellness].forEach(res => {
    (res.data || []).forEach((row: { date: string }) => dates.add(row.date));
  });

  // Count streak from today backwards
  let streak = 0;
  const checkDate = new Date(today);
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (dates.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // ── WEEKLY SUMMARY ──
  // Current week (Mon-Sun)
  const dow = today.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() + mondayOffset);
  const thisMondayStr = thisMonday.toISOString().split('T')[0];

  // Previous week
  const prevMonday = new Date(thisMonday);
  prevMonday.setDate(thisMonday.getDate() - 7);
  const prevMondayStr = prevMonday.toISOString().split('T')[0];
  const prevSunday = new Date(thisMonday);
  prevSunday.setDate(thisMonday.getDate() - 1);
  const prevSundayStr = prevSunday.toISOString().split('T')[0];

  const [thisWeekMeals, prevWeekMeals, thisWeekSleep, prevWeekSleep, thisWeekHydration, prevWeekHydration, thisWeekWorkouts, prevWeekWorkouts, thisWeekCardio, prevWeekCardio] = await Promise.all([
    supabaseAdmin.from('nutrition_logs').select('calories').eq('athlete_id', auth.athleteId).gte('date', thisMondayStr).lte('date', todayStr),
    supabaseAdmin.from('nutrition_logs').select('calories').eq('athlete_id', auth.athleteId).gte('date', prevMondayStr).lte('date', prevSundayStr),
    supabaseAdmin.from('sleep_logs').select('hours').eq('athlete_id', auth.athleteId).gte('date', thisMondayStr).lte('date', todayStr),
    supabaseAdmin.from('sleep_logs').select('hours').eq('athlete_id', auth.athleteId).gte('date', prevMondayStr).lte('date', prevSundayStr),
    supabaseAdmin.from('hydration_logs').select('liters').eq('athlete_id', auth.athleteId).gte('date', thisMondayStr).lte('date', todayStr),
    supabaseAdmin.from('hydration_logs').select('liters').eq('athlete_id', auth.athleteId).gte('date', prevMondayStr).lte('date', prevSundayStr),
    supabaseAdmin.from('workout_sessions').select('id').eq('athlete_id', auth.athleteId).gte('date', thisMondayStr).lte('date', todayStr),
    supabaseAdmin.from('workout_sessions').select('id').eq('athlete_id', auth.athleteId).gte('date', prevMondayStr).lte('date', prevSundayStr),
    supabaseAdmin.from('cardio_logs').select('duration_minutes').eq('athlete_id', auth.athleteId).gte('date', thisMondayStr).lte('date', todayStr),
    supabaseAdmin.from('cardio_logs').select('duration_minutes').eq('athlete_id', auth.athleteId).gte('date', prevMondayStr).lte('date', prevSundayStr),
  ]);

  // Days elapsed this week (for averaging)
  const daysThisWeek = Math.max(1, Math.min(7, Math.floor((today.getTime() - thisMonday.getTime()) / (1000 * 60 * 60 * 24)) + 1));

  const sum = (arr: { [k: string]: number }[] | null, key: string) =>
    (arr || []).reduce((s, r) => s + (r[key] || 0), 0);

  const weekly = {
    avgCalories: Math.round(sum(thisWeekMeals.data, 'calories') / daysThisWeek),
    prevAvgCalories: Math.round(sum(prevWeekMeals.data, 'calories') / 7),
    avgSleep: +(sum(thisWeekSleep.data, 'hours') / daysThisWeek).toFixed(1),
    prevAvgSleep: +(sum(prevWeekSleep.data, 'hours') / 7).toFixed(1),
    totalHydration: +sum(thisWeekHydration.data, 'liters').toFixed(1),
    prevTotalHydration: +sum(prevWeekHydration.data, 'liters').toFixed(1),
    workoutCount: (thisWeekWorkouts.data || []).length,
    prevWorkoutCount: (prevWeekWorkouts.data || []).length,
    cardioMinutes: sum(thisWeekCardio.data, 'duration_minutes'),
    prevCardioMinutes: sum(prevWeekCardio.data, 'duration_minutes'),
  };

  return NextResponse.json({ streak, weekly });
}
