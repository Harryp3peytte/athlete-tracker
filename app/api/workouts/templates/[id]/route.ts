import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAthleteId } from '@/lib/getAthlete';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { error } = await supabase
    .from('workout_templates')
    .delete()
    .eq('id', id)
    .eq('athlete_id', auth.athleteId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Fetch the template and its exercises, scoped to this athlete
  const { data: template, error: templateError } = await supabase
    .from('workout_templates')
    .select(`
      *,
      workout_template_exercises (*)
    `)
    .eq('id', id)
    .eq('athlete_id', auth.athleteId)
    .single();

  if (templateError || !template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const today = new Date().toISOString().split('T')[0];

  // Create a new workout session from the template
  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .insert({
      athlete_id: auth.athleteId,
      date: today,
      name: template.name,
      notes: template.notes ?? null,
    })
    .select()
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: sessionError?.message ?? 'Failed to create session' }, { status: 500 });
  }

  const templateExercises: Array<{
    exercise_name: string;
    sets: number;
    reps: number;
    sort_order: number;
  }> = template.workout_template_exercises ?? [];

  if (templateExercises.length > 0) {
    const exercises = templateExercises.map((ex) => ({
      session_id: session.id,
      exercise_name: ex.exercise_name,
      sets: ex.sets,
      reps: ex.reps,
      weight_kg: null,
      notes: null,
    }));

    const { error: exercisesError } = await supabase
      .from('workout_exercises')
      .insert(exercises);

    if (exercisesError) {
      return NextResponse.json({ error: exercisesError.message }, { status: 500 });
    }
  }

  const { data: fullSession, error: fetchError } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      workout_exercises (*)
    `)
    .eq('id', session.id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json(fullSession, { status: 201 });
}
