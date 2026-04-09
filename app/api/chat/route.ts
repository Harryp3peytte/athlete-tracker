import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';
import { chatMessageSchema } from '@/lib/validations';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const body = await request.json();
  const { content } = chatMessageSchema.parse(body);
  const today = new Date().toISOString().split('T')[0];

  // Save user message
  await supabaseAdmin.from('chat_messages').insert({ athlete_id: auth.athleteId, role: 'user', content });

  // Gather context - today + weekly trends
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const [athleteRes, weightRes, mealsRes, cardioRes, sleepRes, hydrationRes, wellnessRes, weekMealsRes, weekWorkoutsRes, weekSleepRes] = await Promise.all([
    supabaseAdmin.from('athletes').select('*').eq('id', auth.athleteId).single(),
    supabaseAdmin.from('weight_logs').select('weight_kg, date').eq('athlete_id', auth.athleteId).order('date', { ascending: false }).limit(5),
    supabaseAdmin.from('nutrition_logs').select('*').eq('athlete_id', auth.athleteId).eq('date', today),
    supabaseAdmin.from('cardio_logs').select('*').eq('athlete_id', auth.athleteId).eq('date', today),
    supabaseAdmin.from('sleep_logs').select('*').eq('athlete_id', auth.athleteId).order('date', { ascending: false }).limit(1),
    supabaseAdmin.from('hydration_logs').select('liters').eq('athlete_id', auth.athleteId).eq('date', today),
    supabaseAdmin.from('wellness_logs').select('*').eq('athlete_id', auth.athleteId).eq('date', today).maybeSingle(),
    supabaseAdmin.from('nutrition_logs').select('date, calories').eq('athlete_id', auth.athleteId).gte('date', sevenDaysAgoStr),
    supabaseAdmin.from('workout_sessions').select('date, name, workout_exercises(exercise_name, sets, reps, weight_kg)').eq('athlete_id', auth.athleteId).gte('date', sevenDaysAgoStr),
    supabaseAdmin.from('sleep_logs').select('date, hours, quality').eq('athlete_id', auth.athleteId).gte('date', sevenDaysAgoStr),
  ]);

  const a = athleteRes.data;
  const meals = mealsRes.data || [];
  const cardio = cardioRes.data || [];
  const totalCal = meals.reduce((s: number, m: { calories: number }) => s + (m.calories || 0), 0);
  const totalP = meals.reduce((s: number, m: { proteins: number }) => s + (m.proteins || 0), 0);
  const totalC = meals.reduce((s: number, m: { carbs: number }) => s + (m.carbs || 0), 0);
  const totalF = meals.reduce((s: number, m: { fats: number }) => s + (m.fats || 0), 0);
  const totalHydration = (hydrationRes.data || []).reduce((s: number, h: { liters: number }) => s + (h.liters || 0), 0);
  const lastWeight = (weightRes.data || [])[0]?.weight_kg ?? '?';
  const sleep = (sleepRes.data || [])[0];

  // Weekly trends
  const weekCalByDate: Record<string, number> = {};
  (weekMealsRes.data || []).forEach((m: { date: string; calories: number }) => {
    weekCalByDate[m.date] = (weekCalByDate[m.date] || 0) + (m.calories || 0);
  });
  const weekCalAvg = Object.keys(weekCalByDate).length > 0
    ? Math.round(Object.values(weekCalByDate).reduce((a, b) => a + b, 0) / Object.keys(weekCalByDate).length)
    : 0;

  const weekSleepData = (weekSleepRes.data || []) as Array<{ date: string; hours: number; quality: number | null }>;
  const weekSleepAvg = weekSleepData.length > 0
    ? +(weekSleepData.reduce((s, e) => s + e.hours, 0) / weekSleepData.length).toFixed(1)
    : 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weekWorkouts = (weekWorkoutsRes.data || []) as any[];
  const workoutSummary = weekWorkouts.map(w =>
    `${w.date} ${w.name}: ${(w.workout_exercises || []).map((e: { exercise_name: string; sets: number; reps: number; weight_kg: number | null }) => `${e.exercise_name} ${e.sets}x${e.reps}${e.weight_kg ? ` @${e.weight_kg}kg` : ''}`).join(', ')}`
  ).join('\n') || 'Aucune';

  const weightTrend = (weightRes.data || []).map((w: { weight_kg: number; date: string }) => `${w.date}: ${w.weight_kg}kg`).join(', ');

  const goalLabel = a?.goal_type === 'LOSE_WEIGHT' ? 'Perte de poids' : a?.goal_type === 'GAIN_MUSCLE' ? 'Prise de muscle' : 'Maintien';

  const systemPrompt = `Tu es FitCoach, un assistant nutrition et sport intégré à l'app FitTrack.
Profil : ${a?.name || '?'}, ${a?.age || '?'} ans, ${a?.gender || '?'}, ${a?.height_cm || '?'}cm, ${lastWeight}kg
Objectif : ${goalLabel}${a?.target_weight ? ` → ${a.target_weight}kg` : ''}
Objectif calorique : ${a?.daily_calorie_target || '?'} kcal/jour, métabolisme de base : ${a?.base_metabolism || '?'}

Données du jour :
- Calories consommées : ${totalCal} kcal (P:${totalP}g G:${totalC}g L:${totalF}g)
- Activités cardio : ${cardio.map((c: { activity_type: string; duration_minutes: number; calories_burned: number }) => `${c.activity_type} ${c.duration_minutes}min ${c.calories_burned}kcal`).join(', ') || 'Aucune'}
- Sommeil dernière nuit : ${sleep ? `${sleep.hours}h, qualité ${sleep.quality}/10` : 'Non renseigné'}
- Hydratation : ${totalHydration}L
- Bien-être : ${wellnessRes.data ? `${wellnessRes.data.form_score}/10` : 'Non renseigné'}

Tendances 7 jours :
- Calories moyennes : ${weekCalAvg} kcal/jour
- Sommeil moyen : ${weekSleepAvg}h/nuit
- Poids récent : ${weightTrend || 'Pas de données'}
- Séances muscu cette semaine :
${workoutSummary}

Réponds en français. Sois motivant, concret et donne des conseils actionnables.
Propose des recettes avec les quantités exactes quand on te le demande.
Utilise les tendances hebdo pour des conseils personnalisés et pertinents.`;

  // Get chat history
  const { data: history } = await supabaseAdmin
    .from('chat_messages')
    .select('role, content')
    .eq('athlete_id', auth.athleteId)
    .order('created_at', { ascending: true })
    .limit(20);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: systemPrompt,
    messages: (history || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content,
    })),
  });

  const assistantContent = response.content[0].type === 'text' ? response.content[0].text : '';

  const { data: saved } = await supabaseAdmin
    .from('chat_messages')
    .insert({ athlete_id: auth.athleteId, role: 'assistant', content: assistantContent })
    .select()
    .single();

  return NextResponse.json({ message: saved });
}
