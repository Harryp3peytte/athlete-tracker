import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const period = request.nextUrl.searchParams.get('period') || '90d';
  const days = { '30d': 30, '90d': 90, '6m': 180, '1y': 365 }[period] || 90;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabaseAdmin
    .from('body_measurements')
    .select('*')
    .eq('athlete_id', auth.athleteId)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from('body_measurements')
    .insert({ athlete_id: auth.athleteId, ...body })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
    .from('body_measurements')
    .delete()
    .eq('id', id)
    .eq('athlete_id', auth.athleteId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: 'Supprimé' });
}
