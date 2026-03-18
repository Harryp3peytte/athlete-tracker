import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAthleteId } from '@/lib/getAthlete';
import { hydrationSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const period = request.nextUrl.searchParams.get('period') || '7d';
  const days = period === '30d' ? 30 : 7;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('hydration_logs')
    .select('*')
    .eq('athlete_id', auth.athleteId)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate by date
  const byDate: Record<string, number> = {};
  (data || []).forEach((h: { date: string; liters: number }) => {
    byDate[h.date] = (byDate[h.date] || 0) + h.liters;
  });

  const today = new Date().toISOString().split('T')[0];
  const todayTotal = byDate[today] || 0;

  return NextResponse.json({ entries: data || [], byDate, todayTotal });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const validated = hydrationSchema.parse(body);

  const { data, error } = await supabase
    .from('hydration_logs')
    .insert({ athlete_id: auth.athleteId, date: validated.date, liters: validated.liters })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
