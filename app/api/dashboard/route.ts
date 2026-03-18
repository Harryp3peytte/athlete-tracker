import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';
import { calculateHealthScore } from '@/lib/healthScore';

export async function GET() {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const [athleteRes, todayMealsRes, todayCardioRes, workoutsRes, sleepRes, weightsRes, hydrationRes, wellnessRes, weekMealsRes, weekCardioRes] = await Promise.all([
    supabaseAdmin.from('athletes').select('*').eq('id', auth.athleteId).single(),
    supabaseAdmin.from('nutrition_logs').select('*').eq('athlete_id', auth.athleteId).eq('date', today),
    supabaseAdmin.from('cardio_logs').select('*').eq('athlete_id', auth.athleteId).eq('date', today),
    supabaseAdmin.from('workout_sessions').select('*, workout_exercises(*)').eq('athlete_id', auth.athleteId).eq('date', today),
    supabaseAdmin.from('sleep_logs').select('*').eq('athlete_id', auth.athleteId).eq('date', today).maybeSingle(),
    supabaseAdmin.from('weight_logs').select('*').eq('athlete_id', auth.athleteId).gte('date', sevenDaysAgoStr).order('date', { ascending: true }),
    supabaseAdmin.from('hydration_logs').select('liters').eq('athlete_id', auth.athleteId).eq('date', today),
    supabaseAdmin.from('wellness_logs').select('*').eq('athlete_id', auth.athleteId).eq('date', today).maybeSingle(),
    // 7-day calorie data
    supabaseAdmin.from('nutrition_logs').select('date, calories').eq('athlete_id', auth.athleteId).gte('date', sevenDaysAgoStr),
    supabaseAdmin.from('cardio_logs').select('date, calories_burned').eq('athlete_id', auth.athleteId).gte('date', sevenDaysAgoStr),
  ]);

  const athlete = athleteRes.data;
  if (!athlete) return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });

  const todayMeals = todayMealsRes.data || [];
  const todayCardio = todayCardioRes.data || [];
  const workouts = workoutsRes.data || [];
  const weights = weightsRes.data || [];

  const caloriesConsumed = todayMeals.reduce((s: number, m: { calories: number }) => s + (m.calories || 0), 0);
  const caloriesBurned = todayCardio.reduce((s: number, c: { calories_burned: number }) => s + (c.calories_burned || 0), 0);
  const totalProteins = todayMeals.reduce((s: number, m: { proteins: number }) => s + (m.proteins || 0), 0);
  const totalCarbs = todayMeals.reduce((s: number, m: { carbs: number }) => s + (m.carbs || 0), 0);
  const totalFats = todayMeals.reduce((s: number, m: { fats: number }) => s + (m.fats || 0), 0);
  const totalHydration = (hydrationRes.data || []).reduce((s: number, h: { liters: number }) => s + (h.liters || 0), 0);

  // Build 7-day calorie trend
  const consumedByDate: Record<string, number> = {};
  const burnedByDate: Record<string, number> = {};
  (weekMealsRes.data || []).forEach((m: { date: string; calories: number }) => {
    consumedByDate[m.date] = (consumedByDate[m.date] || 0) + (m.calories || 0);
  });
  (weekCardioRes.data || []).forEach((c: { date: string; calories_burned: number }) => {
    burnedByDate[c.date] = (burnedByDate[c.date] || 0) + (c.calories_burned || 0);
  });

  // Generate all 7 days (including days with no data)
  const calorieTrend: Array<{ date: string; consumed: number; burned: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    calorieTrend.push({
      date: dateStr,
      consumed: consumedByDate[dateStr] || 0,
      burned: burnedByDate[dateStr] || 0,
    });
  }

  const healthScore = await calculateHealthScore(auth.athleteId, today, athlete.daily_calorie_target);

  return NextResponse.json({
    athlete,
    healthScore,
    calories: {
      consumed: caloriesConsumed,
      burned: caloriesBurned,
      target: athlete.daily_calorie_target || 2000,
      net: caloriesConsumed - caloriesBurned,
    },
    calorieTrend,
    macros: { proteins: totalProteins, carbs: totalCarbs, fats: totalFats },
    weight: {
      current: weights.length > 0 ? weights[weights.length - 1].weight_kg : null,
      trend: weights,
    },
    sleep: sleepRes.data,
    cardioActivities: todayCardio,
    workoutSessions: workouts,
    hydration: totalHydration,
    wellness: wellnessRes.data,
  });
}
