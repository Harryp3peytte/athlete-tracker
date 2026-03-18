import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAthleteId } from '@/lib/getAthlete';
import { workoutSessionSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period');

  let query = supabase
    .from('workout_sessions')
    .select(`
      *,
      workout_exercises (*)
    `)
    .eq('athlete_id', auth.athleteId)
    .order('date', { ascending: false });

  if (period) {
    const now = new Date();
    let fromDate: Date;

    if (period === '7d') {
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30d') {
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      return NextResponse.json({ error: 'Invalid period. Use 7d or 30d.' }, { status: 400 });
    }

    query = query.gte('date', fromDate.toISOString().split('T')[0]);
  }

  const { data, error } = await query;

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
  const data = workoutSessionSchema.parse(body);

  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .insert({
      athlete_id: auth.athleteId,
      date: data.date,
      name: data.name,
      notes: data.notes ?? null,
    })
    .select()
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: sessionError?.message ?? 'Failed to create session' }, { status: 500 });
  }

  if (data.exercises && data.exercises.length > 0) {
    const exercises = data.exercises.map((ex) => ({
      session_id: session.id,
      exercise_name: ex.exercise_name,
      sets: ex.sets,
      reps: ex.reps,
      weight_kg: ex.weight_kg ?? null,
      notes: ex.notes ?? null,
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
