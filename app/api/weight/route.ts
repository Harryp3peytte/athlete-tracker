import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';
import { weightSchema } from '@/lib/validations';
import { periodToDays } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const period = request.nextUrl.searchParams.get('period') || '30d';
  const since = new Date();
  since.setDate(since.getDate() - periodToDays(period));

  const { data, error } = await supabaseAdmin
    .from('weight_logs')
    .select('*')
    .eq('athlete_id', auth.athleteId)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) {
    console.error('Weight GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const entries = data || [];
  const current = entries.length > 0 ? entries[entries.length - 1].weight_kg : null;
  const previous = entries.length > 1 ? entries[entries.length - 2].weight_kg : null;
  const trend = current && previous ? (current > previous ? 'up' : current < previous ? 'down' : 'stable') : 'stable';

  return NextResponse.json({ entries, current, trend });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  let validated;
  try {
    const body = await request.json();
    validated = weightSchema.parse(body);
  } catch (err) {
    console.error('Weight validation error:', err);
    return NextResponse.json({ error: 'Données invalides', details: String(err) }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('weight_logs')
    .upsert(
      { athlete_id: auth.athleteId, weight_kg: validated.weight_kg, date: validated.date, notes: validated.notes ?? null },
      { onConflict: 'athlete_id,date' }
    )
    .select()
    .single();

  if (error) {
    console.error('Weight insert error:', error);
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('weight_logs')
    .delete()
    .eq('id', id)
    .eq('athlete_id', auth.athleteId);

  if (error) {
    console.error('Weight delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: 'Supprimé' });
}
