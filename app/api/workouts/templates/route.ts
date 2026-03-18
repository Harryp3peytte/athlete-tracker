import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';
import { workoutTemplateSchema } from '@/lib/validations';

export async function GET() {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('workout_templates')
    .select(`
      *,
      workout_template_exercises (*)
    `)
    .eq('athlete_id', auth.athleteId)
    .order('weekday', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const data = workoutTemplateSchema.parse(body);

  const { data: template, error: templateError } = await supabaseAdmin
    .from('workout_templates')
    .insert({
      athlete_id: auth.athleteId,
      name: data.name,
      weekday: data.weekday,
      notes: data.notes ?? null,
    })
    .select()
    .single();

  if (templateError || !template) {
    return NextResponse.json({ error: templateError?.message ?? 'Failed to create template' }, { status: 500 });
  }

  if (data.exercises && data.exercises.length > 0) {
    const exercises = data.exercises.map((ex) => ({
      template_id: template.id,
      exercise_name: ex.exercise_name,
      sets: ex.sets,
      reps: ex.reps,
      sort_order: ex.sort_order,
    }));

    const { error: exercisesError } = await supabaseAdmin
      .from('workout_template_exercises')
      .insert(exercises);

    if (exercisesError) {
      return NextResponse.json({ error: exercisesError.message }, { status: 500 });
    }
  }

  const { data: fullTemplate, error: fetchError } = await supabaseAdmin
    .from('workout_templates')
    .select(`
      *,
      workout_template_exercises (*)
    `)
    .eq('id', template.id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json(fullTemplate, { status: 201 });
}
