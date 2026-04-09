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

  // Accept optional ?date= parameter
  const dateParam = request.nextUrl.searchParams.get('date');
  const targetDate = dateParam || new Date().toISOString().split('T')[0];

  // Calculate 7-day range ending on targetDate
  const targetDateObj = new Date(targetDate + 'T12:00:00');
  const sevenDaysAgo = new Date(targetDateObj);
  sevenDaysAgo.setDate(targetDateObj.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  // Calculate week start (Monday) for the target date
  const dayOfWeek = targetDateObj.getDay(); // 0=Sunday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStartDate = new Date(targetDateObj);
  weekStartDate.setDate(targetDateObj.getDate() + mondayOffset);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);
  const weekStartStr = weekStartDate.toISOString().split('T')[0];
  const weekEndStr = weekEndDate.toISOString().split('T')[0];

  const [athleteRes, todayMealsRes, todayCardioRes, workoutsRes, sleepRes, weightsRes, hydrationRes, wellnessRes, weekMealsRes, weekCardioRes] = await Promise.all([
    supabaseAdmin.from('athletes').select('*').eq('id', auth.athleteId).single(),
    supabaseAdmin.from('nutrition_logs').select('*').eq('athlete_id', auth.athleteId).eq('date', targetDate),
    supabaseAdmin.from('cardio_logs').select('*').eq('athlete_id', auth.athleteId).eq('date', targetDate),
    supabaseAdmin.from('workout_sessions').select('*, workout_exercises(*)').eq('athlete_id', auth.athleteId).eq('date', targetDate),
    supabaseAdmin.from('sleep_logs').select('*').eq('athlete_id', auth.athleteId).eq('date', targetDate).maybeSingle(),
    supabaseAdmin.from('weight_logs').select('*').eq('athlete_id', auth.athleteId).gte('date', sevenDaysAgoStr).lte('date', targetDate).order('date', { ascending: true }),
    supabaseAdmin.from('hydration_logs').select('liters').eq('athlete_id', auth.athleteId).eq('date', targetDate),
    supabaseAdmin.from('wellness_logs').select('*').eq('athlete_id', auth.athleteId).eq('date', targetDate).maybeSingle(),
    // Week calorie data (for the week containing the target date)
    supabaseAdmin.from('nutrition_logs').select('date, calories').eq('athlete_id', auth.athleteId).gte('date', weekStartStr).lte('date', weekEndStr),
    supabaseAdmin.from('cardio_logs').select('date, calories_burned').eq('athlete_id', auth.athleteId).gte('date', weekStartStr).lte('date', weekEndStr),
  ]);

  const athlete = athleteRes.data;
  if (!athlete) return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });

  const todayMeals = todayMealsRes.data || [];
  const todayCardio = todayCardioRes.data || [];
  const workouts = workoutsRes.data || [];
  const weights = weightsRes.data || [];

  const caloriesConsumed = todayMeals.reduce((s: number, m: { calories: number }) => s + (m.calories || 0), 0);
  const metabolism = athlete.base_metabolism || 1800;
  const activitiesBurned = todayCardio.reduce((s: number, c: { calories_burned: number }) => s + (c.calories_burned || 0), 0);
  const caloriesBurned = metabolism + activitiesBurned;
  const totalProteins = todayMeals.reduce((s: number, m: { proteins: number }) => s + (m.proteins || 0), 0);
  const totalCarbs = todayMeals.reduce((s: number, m: { carbs: number }) => s + (m.carbs || 0), 0);
  const totalFats = todayMeals.reduce((s: number, m: { fats: number }) => s + (m.fats || 0), 0);
  const totalHydration = (hydrationRes.data || []).reduce((s: number, h: { liters: number }) => s + (h.liters || 0), 0);

  // Build 7-day calorie trend for the week
  const consumedByDate: Record<string, number> = {};
  const burnedByDate: Record<string, number> = {};
  (weekMealsRes.data || []).forEach((m: { date: string; calories: number }) => {
    consumedByDate[m.date] = (consumedByDate[m.date] || 0) + (m.calories || 0);
  });
  (weekCardioRes.data || []).forEach((c: { date: string; calories_burned: number }) => {
    burnedByDate[c.date] = (burnedByDate[c.date] || 0) + (c.calories_burned || 0);
  });

  // Generate all 7 days of the week (Mon-Sun)
  const calorieTrend: Array<{ date: string; consumed: number; burned: number }> = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStartDate);
    d.setDate(weekStartDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    calorieTrend.push({
      date: dateStr,
      consumed: consumedByDate[dateStr] || 0,
      burned: metabolism + (burnedByDate[dateStr] || 0),
    });
  }

  const healthScore = await calculateHealthScore(auth.athleteId, targetDate, athlete.daily_calorie_target, athlete.goal_type);

  return NextResponse.json({
    athlete,
    healthScore,
    calories: {
      consumed: caloriesConsumed,
      burned: caloriesBurned,
      target: athlete.daily_calorie_target || 2000,
      net: caloriesConsumed - caloriesBurned,
      metabolism,
      activities: activitiesBurned,
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
