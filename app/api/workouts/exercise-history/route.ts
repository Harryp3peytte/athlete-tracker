import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const exerciseName = request.nextUrl.searchParams.get('name');
  if (!exerciseName) {
    return NextResponse.json({ error: 'name parameter required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('workout_exercises')
    .select('exercise_name, sets, reps, weight_kg, workout_sessions!inner(date, athlete_id)')
    .eq('workout_sessions.athlete_id', auth.athleteId)
    .eq('exercise_name', exerciseName)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Exercise history error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten the response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const history = (data || []).map((row: any) => {
    const session = row.workout_sessions;
    return {
      date: session.date as string,
      exercise_name: row.exercise_name as string,
      sets: row.sets as number,
      reps: row.reps as number,
      weight_kg: row.weight_kg as number | null,
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json(history);
}
