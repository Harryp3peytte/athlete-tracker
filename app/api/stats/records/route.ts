import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';

export async function GET() {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [longestRes, mostCalRes, longestDistRes] = await Promise.all([
    supabaseAdmin.from('cardio_logs').select('*').eq('athlete_id', auth.athleteId).order('duration_minutes', { ascending: false }).limit(1),
    supabaseAdmin.from('cardio_logs').select('*').eq('athlete_id', auth.athleteId).order('calories_burned', { ascending: false }).limit(1),
    supabaseAdmin.from('cardio_logs').select('*').eq('athlete_id', auth.athleteId).not('distance_km', 'is', null).order('distance_km', { ascending: false }).limit(1),
  ]);

  const longest = (longestRes.data || [])[0] || null;
  const mostCal = (mostCalRes.data || [])[0] || null;
  const longestDist = (longestDistRes.data || [])[0] || null;

  return NextResponse.json({
    longestActivity: longest ? { activity_type: longest.activity_type, duration_minutes: longest.duration_minutes, date: longest.date } : null,
    mostCaloriesBurned: mostCal ? { activity_type: mostCal.activity_type, calories_burned: mostCal.calories_burned, date: mostCal.date } : null,
    longestDistance: longestDist ? { activity_type: longestDist.activity_type, distance_km: longestDist.distance_km, date: longestDist.date } : null,
  });
}
