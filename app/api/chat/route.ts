import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';
import { chatMessageSchema } from '@/lib/validations';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { content } = chatMessageSchema.parse(body);
  const today = new Date().toISOString().split('T')[0];

  // Save user message
  await supabaseAdmin.from('chat_messages').insert({ athlete_id: auth.athleteId, role: 'user', content });

  // Gather context
  const [athleteRes, weightRes, mealsRes, cardioRes, sleepRes, hydrationRes, wellnessRes] = await Promise.all([
    supabaseAdmin.from('athletes').select('*').eq('id', auth.athleteId).single(),
    supabaseAdmin.from('weight_logs').select('weight_kg').eq('athlete_id', auth.athleteId).order('date', { ascending: false }).limit(1),
    supabaseAdmin.from('nutrition_logs').select('*').eq('athlete_id', auth.athleteId).eq('date', today),
    supabaseAdmin.from('cardio_logs').select('*').eq('athlete_id', auth.athleteId).eq('date', today),
    supabaseAdmin.from('sleep_logs').select('*').eq('athlete_id', auth.athleteId).order('date', { ascending: false }).limit(1),
    supabaseAdmin.from('hydration_logs').select('liters').eq('athlete_id', auth.athleteId).eq('date', today),
    supabaseAdmin.from('wellness_logs').select('*').eq('athlete_id', auth.athleteId).eq('date', today).maybeSingle(),
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

  const systemPrompt = `Tu es FitCoach, un assistant nutrition et sport intégré à l'app FitTrack.
Profil : ${a?.name || '?'}, ${a?.age || '?'} ans, ${a?.gender || '?'}, ${a?.height_cm || '?'}cm, ${lastWeight}kg
Objectif calorique : ${a?.daily_calorie_target || '?'} kcal/jour, métabolisme de base : ${a?.base_metabolism || '?'}

Données du jour :
- Calories consommées : ${totalCal} kcal (P:${totalP}g G:${totalC}g L:${totalF}g)
- Activités cardio : ${cardio.map((c: { activity_type: string; duration_minutes: number; calories_burned: number }) => `${c.activity_type} ${c.duration_minutes}min ${c.calories_burned}kcal`).join(', ') || 'Aucune'}
- Sommeil dernière nuit : ${sleep ? `${sleep.hours}h, qualité ${sleep.quality}/10` : 'Non renseigné'}
- Hydratation : ${totalHydration}L
- Bien-être : ${wellnessRes.data ? `${wellnessRes.data.form_score}/10` : 'Non renseigné'}

Réponds en français. Sois motivant, concret et donne des conseils actionnables.
Propose des recettes avec les quantités exactes quand on te le demande.`;

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
