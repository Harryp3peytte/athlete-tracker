import { getSupabaseAdmin } from '@/lib/supabase/admin';

export type GoalType = 'LOSE_WEIGHT' | 'MAINTAIN' | 'GAIN_MUSCLE';

interface HealthScoreResult {
  total: number;
  breakdown: {
    sleep: number;
    calories: number;
    activity: number;
    hydration: number;
    wellness: number;
    regularity: number;
  };
}

export async function calculateHealthScore(
  athleteId: string,
  date: string,
  dailyCalorieTarget: number | null,
  goalType: GoalType | string | null
): Promise<HealthScoreResult> {
  const supabaseAdmin = getSupabaseAdmin();
  const [sleepRes, mealsRes, cardioRes, workoutsRes, hydrationRes, wellnessRes] = await Promise.all([
    supabaseAdmin.from('sleep_logs').select('hours').eq('athlete_id', athleteId).eq('date', date),
    supabaseAdmin.from('nutrition_logs').select('calories').eq('athlete_id', athleteId).eq('date', date),
    supabaseAdmin.from('cardio_logs').select('duration_minutes').eq('athlete_id', athleteId).eq('date', date),
    supabaseAdmin.from('workout_sessions').select('id').eq('athlete_id', athleteId).eq('date', date),
    supabaseAdmin.from('hydration_logs').select('liters').eq('athlete_id', athleteId).eq('date', date),
    supabaseAdmin.from('wellness_logs').select('form_score').eq('athlete_id', athleteId).eq('date', date).maybeSingle(),
  ]);

  // ── 1. SOMMEIL (/20) ──
  const sleepEntries = sleepRes.data || [];
  const totalSleepHours = sleepEntries.reduce((s: number, e: { hours: number }) => s + (e.hours || 0), 0);
  let sleepScore = 0;
  if (sleepEntries.length > 0) {
    if (totalSleepHours >= 7) sleepScore = 20;
    else if (totalSleepHours >= 6) sleepScore = 15;
    else if (totalSleepHours >= 5) sleepScore = 8;
    else sleepScore = 3;
  }

  // ── 2. CALORIES (/20) ──
  let calorieScore = 0;
  const totalCalories = (mealsRes.data || []).reduce((s: number, m: { calories: number }) => s + (m.calories || 0), 0);
  if (totalCalories > 0 && dailyCalorieTarget && dailyCalorieTarget > 0) {
    const ratio = totalCalories / dailyCalorieTarget;

    // Determine ideal range based on goal
    let lowerBound: number;
    let upperBound: number;
    switch (goalType) {
      case 'LOSE_WEIGHT':
        lowerBound = 0.80;
        upperBound = 1.00;
        break;
      case 'GAIN_MUSCLE':
        lowerBound = 1.00;
        upperBound = 1.20;
        break;
      default: // MAINTAIN or null
        lowerBound = 0.90;
        upperBound = 1.10;
        break;
    }

    if (ratio >= lowerBound && ratio <= upperBound) {
      calorieScore = 20;
    } else {
      // Distance from nearest edge of the ideal range
      const distanceFromRange = ratio < lowerBound
        ? lowerBound - ratio
        : ratio - upperBound;

      if (distanceFromRange <= 0.05) calorieScore = 16;
      else if (distanceFromRange <= 0.10) calorieScore = 12;
      else if (distanceFromRange <= 0.15) calorieScore = 8;
      else if (distanceFromRange <= 0.20) calorieScore = 4;
      else calorieScore = 2;
    }
  }

  // ── 3. ACTIVITÉ (/20) ──
  const cardioMinutes = (cardioRes.data || []).reduce((s: number, c: { duration_minutes: number }) => s + (c.duration_minutes || 0), 0);
  const hasCardio30 = cardioMinutes >= 30;
  const hasCardioShort = cardioMinutes > 0 && cardioMinutes < 30;
  const hasWorkout = ((workoutsRes.data || []).length > 0);
  let activityScore = 0;
  if (hasCardio30 && hasWorkout) activityScore = 20;
  else if (hasCardio30 || hasWorkout) activityScore = 10;
  else if (hasCardioShort) activityScore = 5;

  // ── 4. HYDRATATION (/15) ──
  const totalLiters = (hydrationRes.data || []).reduce((s: number, h: { liters: number }) => s + (h.liters || 0), 0);
  const hydrationScore = Math.min(15, Math.round((totalLiters / 2.0) * 15));

  // ── 5. BIEN-ÊTRE (/15) ──
  let wellnessScore = 0;
  if (wellnessRes.data) {
    const fs = wellnessRes.data.form_score;
    wellnessScore = Math.round((fs / 10) * 15);
  }

  // ── 6. RÉGULARITÉ BONUS (/10) ──
  let categoriesLogged = 0;
  if (sleepEntries.length > 0) categoriesLogged++;
  if ((mealsRes.data || []).length > 0) categoriesLogged++;
  if ((cardioRes.data || []).length > 0 || hasWorkout) categoriesLogged++;
  if ((hydrationRes.data || []).length > 0) categoriesLogged++;
  if (wellnessRes.data) categoriesLogged++;

  let regularityScore = 0;
  if (categoriesLogged === 5) regularityScore = 10;
  else if (categoriesLogged === 4) regularityScore = 8;
  else if (categoriesLogged === 3) regularityScore = 5;
  else if (categoriesLogged === 2) regularityScore = 3;
  else if (categoriesLogged === 1) regularityScore = 1;

  return {
    total: sleepScore + calorieScore + activityScore + hydrationScore + wellnessScore + regularityScore,
    breakdown: {
      sleep: sleepScore,
      calories: calorieScore,
      activity: activityScore,
      hydration: hydrationScore,
      wellness: wellnessScore,
      regularity: regularityScore,
    },
  };
}
