import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';
import { workoutTemplateSchema } from '@/lib/validations';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const { id } = await params;

  const { error } = await supabaseAdmin
    .from('workout_templates')
    .delete()
    .eq('id', id)
    .eq('athlete_id', auth.athleteId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const { id } = await params;

  let data;
  try {
    const body = await request.json();
    data = workoutTemplateSchema.parse(body);
  } catch (err) {
    console.error('Template validation error:', err);
    return NextResponse.json({ error: 'Données invalides', details: String(err) }, { status: 400 });
  }

  // Update the template
  const { error: updateError } = await supabaseAdmin
    .from('workout_templates')
    .update({ name: data.name, notes: data.notes ?? null })
    .eq('id', id)
    .eq('athlete_id', auth.athleteId);

  if (updateError) {
    console.error('Template update error:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Replace exercises: delete old, insert new
  if (data.exercises) {
    const { error: deleteError } = await supabaseAdmin
      .from('workout_template_exercises')
      .delete()
      .eq('template_id', id);

    if (deleteError) {
      console.error('Template exercises delete error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (data.exercises.length > 0) {
      const exercises = data.exercises.map((ex) => ({
        template_id: id,
        exercise_name: ex.exercise_name,
        sets: ex.sets,
        reps: ex.reps,
        sort_order: ex.sort_order,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('workout_template_exercises')
        .insert(exercises);

      if (insertError) {
        console.error('Template exercises insert error:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }
  }

  // Return updated template
  const { data: fullTemplate, error: fetchError } = await supabaseAdmin
    .from('workout_templates')
    .select(`
      *,
      workout_template_exercises (*)
    `)
    .eq('id', id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json(fullTemplate);
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const { id } = await params;

  // Fetch the template and its exercises, scoped to this athlete
  const { data: template, error: templateError } = await supabaseAdmin
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
  const { data: session, error: sessionError } = await supabaseAdmin
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

    const { error: exercisesError } = await supabaseAdmin
      .from('workout_exercises')
      .insert(exercises);

    if (exercisesError) {
      return NextResponse.json({ error: exercisesError.message }, { status: 500 });
    }
  }

  const { data: fullSession, error: fetchError } = await supabaseAdmin
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
