import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';

export async function GET() {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from('weekly_program')
    .select(`
      *,
      template:workout_templates (
        *,
        workout_template_exercises (*)
      )
    `)
    .eq('athlete_id', auth.athleteId)
    .order('weekday', { ascending: true });

  if (error) {
    console.error('Program GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build a full 7-day array (0=Lundi..6=Dimanche)
  const program = Array.from({ length: 7 }, (_, i) => {
    const entry = (data || []).find((d: { weekday: number }) => d.weekday === i);
    return {
      weekday: i,
      template_id: entry?.template_id || null,
      template: entry?.template || null,
      id: entry?.id || null,
    };
  });

  return NextResponse.json(program);
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Body: { assignments: [{ weekday: number, template_id: string | null }] }
  const assignments: Array<{ weekday: number; template_id: string | null }> = body.assignments;

  if (!Array.isArray(assignments)) {
    return NextResponse.json({ error: 'assignments array required' }, { status: 400 });
  }

  for (const a of assignments) {
    if (a.template_id === null) {
      // Remove assignment for this day
      await supabaseAdmin
        .from('weekly_program')
        .delete()
        .eq('athlete_id', auth.athleteId)
        .eq('weekday', a.weekday);
    } else {
      // Upsert assignment
      const { error } = await supabaseAdmin
        .from('weekly_program')
        .upsert(
          {
            athlete_id: auth.athleteId,
            weekday: a.weekday,
            template_id: a.template_id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'athlete_id,weekday' }
        );
      if (error) {
        console.error('Program upsert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  // Return updated program
  const { data, error } = await supabaseAdmin
    .from('weekly_program')
    .select(`
      *,
      template:workout_templates (
        *,
        workout_template_exercises (*)
      )
    `)
    .eq('athlete_id', auth.athleteId)
    .order('weekday', { ascending: true });

  if (error) {
    console.error('Program GET after update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const program = Array.from({ length: 7 }, (_, i) => {
    const entry = (data || []).find((d: { weekday: number }) => d.weekday === i);
    return {
      weekday: i,
      template_id: entry?.template_id || null,
      template: entry?.template || null,
      id: entry?.id || null,
    };
  });

  return NextResponse.json(program);
}
