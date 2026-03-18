import { SupabaseClient } from '@supabase/supabase-js';

interface HealthScoreResult {
  total: number;
  breakdown: {
    sleep: number;
    calories: number;
    activity: number;
    hydration: number;
    wellness: number;
  };
}

export async function calculateHealthScore(
  supabase: SupabaseClient,
  athleteId: string,
  date: string,
  dailyCalorieTarget: number | null
): Promise<HealthScoreResult> {
  const [sleepRes, mealsRes, cardioRes, workoutsRes, hydrationRes, wellnessRes] = await Promise.all([
    supabase.from('sleep_logs').select('hours').eq('athlete_id', athleteId).eq('date', date).maybeSingle(),
    supabase.from('nutrition_logs').select('calories').eq('athlete_id', athleteId).eq('date', date),
    supabase.from('cardio_logs').select('id').eq('athlete_id', athleteId).eq('date', date),
    supabase.from('workout_sessions').select('id').eq('athlete_id', athleteId).eq('date', date),
    supabase.from('hydration_logs').select('liters').eq('athlete_id', athleteId).eq('date', date),
    supabase.from('wellness_logs').select('form_score').eq('athlete_id', athleteId).eq('date', date).maybeSingle(),
  ]);

  // Sleep: 7-9h = 20pts
  let sleepScore = 0;
  if (sleepRes.data) {
    const h = sleepRes.data.hours;
    if (h >= 7 && h <= 9) sleepScore = 20;
    else if (h >= 6 && h <= 10) sleepScore = 12;
    else if (h > 0) sleepScore = 5;
  }

  // Calories within ±10% of target = 20pts
  let calorieScore = 0;
  const totalCalories = (mealsRes.data || []).reduce((s: number, m: { calories: number }) => s + (m.calories || 0), 0);
  if (totalCalories > 0 && dailyCalorieTarget && dailyCalorieTarget > 0) {
    const ratio = totalCalories / dailyCalorieTarget;
    if (ratio >= 0.9 && ratio <= 1.1) calorieScore = 20;
    else if (ratio >= 0.75 && ratio <= 1.25) calorieScore = 12;
    else calorieScore = 5;
  }

  // At least 1 activity (cardio OR workout) = 20pts
  const hasActivity = ((cardioRes.data || []).length > 0) || ((workoutsRes.data || []).length > 0);
  const activityScore = hasActivity ? 20 : 0;

  // Hydration >= 2L = 20pts
  let hydrationScore = 0;
  const totalLiters = (hydrationRes.data || []).reduce((s: number, h: { liters: number }) => s + (h.liters || 0), 0);
  if (totalLiters >= 2) hydrationScore = 20;
  else if (totalLiters >= 1.5) hydrationScore = 12;
  else if (totalLiters > 0) hydrationScore = 5;

  // Wellness score >= 7 = 20pts
  let wellnessScore = 0;
  if (wellnessRes.data) {
    const fs = wellnessRes.data.form_score;
    if (fs >= 7) wellnessScore = 20;
    else if (fs >= 5) wellnessScore = 12;
    else if (fs > 0) wellnessScore = 5;
  }

  return {
    total: sleepScore + calorieScore + activityScore + hydrationScore + wellnessScore,
    breakdown: {
      sleep: sleepScore,
      calories: calorieScore,
      activity: activityScore,
      hydration: hydrationScore,
      wellness: wellnessScore,
    },
  };
}
