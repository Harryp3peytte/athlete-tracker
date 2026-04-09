import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  progress?: number; // 0-100
  progressLabel?: string;
}

export async function GET() {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();
  const id = auth.athleteId;

  // Fetch all the data we need in parallel
  const [
    workoutsRes, mealsRes, sleepRes, cardioRes, hydrationRes, wellnessRes, weightRes,
  ] = await Promise.all([
    supabaseAdmin.from('workout_sessions').select('id, date').eq('athlete_id', id),
    supabaseAdmin.from('nutrition_logs').select('id, date').eq('athlete_id', id),
    supabaseAdmin.from('sleep_logs').select('id, date, hours').eq('athlete_id', id),
    supabaseAdmin.from('cardio_logs').select('id, date, duration_minutes, calories_burned').eq('athlete_id', id),
    supabaseAdmin.from('hydration_logs').select('date, liters').eq('athlete_id', id),
    supabaseAdmin.from('wellness_logs').select('id, date, form_score').eq('athlete_id', id),
    supabaseAdmin.from('weight_logs').select('id, date').eq('athlete_id', id),
  ]);

  const workouts = workoutsRes.data || [];
  const meals = mealsRes.data || [];
  const sleepLogs = sleepRes.data || [];
  const cardioLogs = cardioRes.data || [];
  const hydrationLogs = hydrationRes.data || [];
  const wellnessLogs = wellnessRes.data || [];
  const weightLogs = weightRes.data || [];

  // Compute streak (consecutive days with any log)
  const allDates = new Set<string>();
  [workouts, meals, sleepLogs, cardioLogs, hydrationLogs, wellnessLogs, weightLogs].forEach(arr => {
    arr.forEach((r: { date: string }) => allDates.add(r.date));
  });

  let streak = 0;
  const today = new Date();
  const check = new Date(today);
  while (true) {
    if (allDates.has(check.toISOString().split('T')[0])) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else break;
  }

  // Hydration consecutive days >= 2L
  const hydrationByDate: Record<string, number> = {};
  hydrationLogs.forEach((h: { date: string; liters: number }) => {
    hydrationByDate[h.date] = (hydrationByDate[h.date] || 0) + h.liters;
  });
  let hydrationStreak = 0;
  const hCheck = new Date(today);
  while (true) {
    const ds = hCheck.toISOString().split('T')[0];
    if ((hydrationByDate[ds] || 0) >= 2) {
      hydrationStreak++;
      hCheck.setDate(hCheck.getDate() - 1);
    } else break;
  }

  // Sleep 8h+ streak
  const sleepByDate: Record<string, number> = {};
  sleepLogs.forEach((s: { date: string; hours: number }) => {
    sleepByDate[s.date] = (sleepByDate[s.date] || 0) + s.hours;
  });
  let sleepStreak = 0;
  const sCheck = new Date(today);
  while (true) {
    const ds = sCheck.toISOString().split('T')[0];
    if ((sleepByDate[ds] || 0) >= 7) {
      sleepStreak++;
      sCheck.setDate(sCheck.getDate() - 1);
    } else break;
  }

  // Total cardio calories
  const totalCardioCal = cardioLogs.reduce((s: number, c: { calories_burned: number }) => s + (c.calories_burned || 0), 0);
  // Total cardio minutes
  const totalCardioMin = cardioLogs.reduce((s: number, c: { duration_minutes: number }) => s + (c.duration_minutes || 0), 0);

  // Perfect wellness (10/10)
  const perfectWellness = wellnessLogs.some((w: { form_score: number }) => w.form_score === 10);

  // Define all badges
  const badges: Badge[] = [
    // ── PREMIERS PAS ──
    {
      id: 'first_workout',
      name: 'Première séance',
      description: 'Complète ta première séance de musculation',
      icon: '💪',
      color: '#BF5AF2',
      unlocked: workouts.length >= 1,
    },
    {
      id: 'first_meal',
      name: 'Premier repas',
      description: 'Enregistre ton premier repas',
      icon: '🍽',
      color: '#FF9500',
      unlocked: meals.length >= 1,
    },
    {
      id: 'first_cardio',
      name: 'Premier cardio',
      description: 'Enregistre ta première activité cardio',
      icon: '🏃',
      color: '#FF2D55',
      unlocked: cardioLogs.length >= 1,
    },
    {
      id: 'first_weight',
      name: 'Première pesée',
      description: 'Enregistre ton premier poids',
      icon: '⚖️',
      color: '#30D158',
      unlocked: weightLogs.length >= 1,
    },

    // ── RÉGULARITÉ ──
    {
      id: 'streak_7',
      name: 'Semaine parfaite',
      description: '7 jours de suite avec du tracking',
      icon: '🔥',
      color: '#FF9500',
      unlocked: streak >= 7,
      progress: Math.min(100, (streak / 7) * 100),
      progressLabel: `${Math.min(streak, 7)}/7 jours`,
    },
    {
      id: 'streak_30',
      name: 'Mois de fer',
      description: '30 jours consécutifs de tracking',
      icon: '🔥',
      color: '#FF2D55',
      unlocked: streak >= 30,
      progress: Math.min(100, (streak / 30) * 100),
      progressLabel: `${Math.min(streak, 30)}/30 jours`,
    },
    {
      id: 'streak_100',
      name: 'Centurion',
      description: '100 jours de suite !',
      icon: '💯',
      color: '#FFD700',
      unlocked: streak >= 100,
      progress: Math.min(100, (streak / 100) * 100),
      progressLabel: `${Math.min(streak, 100)}/100 jours`,
    },

    // ── MUSCULATION ──
    {
      id: 'workouts_10',
      name: 'Habitué',
      description: '10 séances de musculation complétées',
      icon: '🏋️',
      color: '#BF5AF2',
      unlocked: workouts.length >= 10,
      progress: Math.min(100, (workouts.length / 10) * 100),
      progressLabel: `${Math.min(workouts.length, 10)}/10`,
    },
    {
      id: 'workouts_50',
      name: 'Machine',
      description: '50 séances de musculation',
      icon: '🤖',
      color: '#BF5AF2',
      unlocked: workouts.length >= 50,
      progress: Math.min(100, (workouts.length / 50) * 100),
      progressLabel: `${Math.min(workouts.length, 50)}/50`,
    },
    {
      id: 'workouts_100',
      name: 'Légende',
      description: '100 séances de musculation',
      icon: '👑',
      color: '#FFD700',
      unlocked: workouts.length >= 100,
      progress: Math.min(100, (workouts.length / 100) * 100),
      progressLabel: `${Math.min(workouts.length, 100)}/100`,
    },

    // ── CARDIO ──
    {
      id: 'cardio_1000cal',
      name: 'Brûleur',
      description: '1 000 kcal brûlées en cardio au total',
      icon: '🔥',
      color: '#FF2D55',
      unlocked: totalCardioCal >= 1000,
      progress: Math.min(100, (totalCardioCal / 1000) * 100),
      progressLabel: `${Math.min(totalCardioCal, 1000)}/1 000 kcal`,
    },
    {
      id: 'cardio_10000cal',
      name: 'Fournaise',
      description: '10 000 kcal brûlées en cardio',
      icon: '🌋',
      color: '#FF2D55',
      unlocked: totalCardioCal >= 10000,
      progress: Math.min(100, (totalCardioCal / 10000) * 100),
      progressLabel: `${Math.round(totalCardioCal)}/10 000 kcal`,
    },
    {
      id: 'cardio_marathon',
      name: 'Marathonien',
      description: '500 minutes de cardio au total',
      icon: '🏅',
      color: '#FF9500',
      unlocked: totalCardioMin >= 500,
      progress: Math.min(100, (totalCardioMin / 500) * 100),
      progressLabel: `${Math.min(totalCardioMin, 500)}/500 min`,
    },

    // ── HYDRATATION ──
    {
      id: 'hydration_7',
      name: 'Hydraté',
      description: '7 jours de suite avec 2L+ d\'eau',
      icon: '💧',
      color: '#32ADE6',
      unlocked: hydrationStreak >= 7,
      progress: Math.min(100, (hydrationStreak / 7) * 100),
      progressLabel: `${Math.min(hydrationStreak, 7)}/7 jours`,
    },
    {
      id: 'hydration_30',
      name: 'Aquaman',
      description: '30 jours consécutifs avec 2L+',
      icon: '🌊',
      color: '#32ADE6',
      unlocked: hydrationStreak >= 30,
      progress: Math.min(100, (hydrationStreak / 30) * 100),
      progressLabel: `${Math.min(hydrationStreak, 30)}/30 jours`,
    },

    // ── SOMMEIL ──
    {
      id: 'sleep_7',
      name: 'Dormeur régulier',
      description: '7 jours de suite avec 7h+ de sommeil',
      icon: '😴',
      color: '#5E5CE6',
      unlocked: sleepStreak >= 7,
      progress: Math.min(100, (sleepStreak / 7) * 100),
      progressLabel: `${Math.min(sleepStreak, 7)}/7 jours`,
    },

    // ── BIEN-ÊTRE ──
    {
      id: 'wellness_perfect',
      name: 'Pleine forme',
      description: 'Atteins un score bien-être de 10/10',
      icon: '✨',
      color: '#2AC956',
      unlocked: perfectWellness,
    },

    // ── NUTRITION ──
    {
      id: 'meals_100',
      name: 'Gourmet',
      description: '100 repas enregistrés',
      icon: '👨‍🍳',
      color: '#FF9500',
      unlocked: meals.length >= 100,
      progress: Math.min(100, (meals.length / 100) * 100),
      progressLabel: `${Math.min(meals.length, 100)}/100`,
    },
    {
      id: 'meals_500',
      name: 'Chef étoilé',
      description: '500 repas enregistrés',
      icon: '⭐',
      color: '#FFD700',
      unlocked: meals.length >= 500,
      progress: Math.min(100, (meals.length / 500) * 100),
      progressLabel: `${Math.min(meals.length, 500)}/500`,
    },
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;
  return NextResponse.json({ badges, unlockedCount, totalCount: badges.length });
}
