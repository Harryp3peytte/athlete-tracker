import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';

export interface NotificationPreference {
  id: string;
  athlete_id: string;
  reminder_type: string;
  enabled: boolean;
  time: string | null;
  interval_minutes: number | null;
}

const DEFAULTS: Array<{ reminder_type: string; time: string | null; interval_minutes: number | null }> = [
  { reminder_type: 'wake', time: '08:00', interval_minutes: null },
  { reminder_type: 'sleep', time: '22:00', interval_minutes: null },
  { reminder_type: 'hydration', time: null, interval_minutes: 120 },
  { reminder_type: 'breakfast', time: '08:30', interval_minutes: null },
  { reminder_type: 'lunch', time: '12:30', interval_minutes: null },
  { reminder_type: 'dinner', time: '19:30', interval_minutes: null },
  { reminder_type: 'workout', time: '18:00', interval_minutes: null },
];

export async function GET() {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabaseAdmin
    .from('notification_preferences')
    .select('*')
    .eq('athlete_id', auth.athleteId);

  // Return existing prefs merged with defaults
  const existing = data || [];
  const result = DEFAULTS.map(def => {
    const found = existing.find((e: NotificationPreference) => e.reminder_type === def.reminder_type);
    return found || { ...def, enabled: false, athlete_id: auth.athleteId, id: null };
  });

  return NextResponse.json(result);
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { reminder_type, enabled, time, interval_minutes } = body;

  const { data, error } = await supabaseAdmin
    .from('notification_preferences')
    .upsert(
      {
        athlete_id: auth.athleteId,
        reminder_type,
        enabled,
        time: time || null,
        interval_minutes: interval_minutes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'athlete_id,reminder_type' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
