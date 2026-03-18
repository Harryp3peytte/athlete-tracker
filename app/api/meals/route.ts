import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';
import { nutritionSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const dateStr = request.nextUrl.searchParams.get('date');
  let query = supabaseAdmin.from('nutrition_logs').select('*').eq('athlete_id', auth.athleteId);
  if (dateStr) query = query.eq('date', dateStr);
  query = query.order('created_at', { ascending: true });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const body = await request.json();
  const validated = nutritionSchema.parse(body);

  const { data, error } = await supabaseAdmin
    .from('nutrition_logs')
    .insert({
      athlete_id: auth.athleteId,
      date: validated.date,
      meal_type: validated.meal_type,
      description: validated.description,
      calories: validated.calories,
      proteins: validated.proteins,
      carbs: validated.carbs,
      fats: validated.fats,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
