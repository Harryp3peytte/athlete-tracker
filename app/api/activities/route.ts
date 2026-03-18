import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';
import { cardioSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const period = request.nextUrl.searchParams.get('period') || '30d';
  const days = period === '7d' ? 7 : 30;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const type = request.nextUrl.searchParams.get('type');

  let query = supabaseAdmin
    .from('cardio_logs')
    .select('*')
    .eq('athlete_id', auth.athleteId)
    .gte('date', since.toISOString().split('T')[0]);

  if (type) query = query.eq('activity_type', type);
  query = query.order('date', { ascending: false });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const validated = cardioSchema.parse(body);

  const { data, error } = await supabaseAdmin
    .from('cardio_logs')
    .insert({
      athlete_id: auth.athleteId,
      date: validated.date,
      activity_type: validated.activity_type,
      duration_minutes: validated.duration_minutes,
      calories_burned: validated.calories_burned,
      distance_km: validated.distance_km,
      notes: validated.notes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
