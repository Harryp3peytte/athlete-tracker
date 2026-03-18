import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';
import { sleepSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const period = request.nextUrl.searchParams.get('period') || '7d';
  const days = period === '30d' ? 30 : 7;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabaseAdmin
    .from('sleep_logs')
    .select('*')
    .eq('athlete_id', auth.athleteId)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entries = data || [];
  const avgHours = entries.length > 0
    ? entries.reduce((s, e) => s + (e.hours || 0), 0) / entries.length
    : 0;

  return NextResponse.json({ entries, avgHours });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const body = await request.json();
  const validated = sleepSchema.parse(body);

  const { data, error } = await supabaseAdmin
    .from('sleep_logs')
    .upsert(
      { athlete_id: auth.athleteId, date: validated.date, hours: validated.hours, quality: validated.quality, notes: validated.notes },
      { onConflict: 'athlete_id,date' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
