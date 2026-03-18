import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';
import { calculateHealthScore } from '@/lib/healthScore';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const metric = request.nextUrl.searchParams.get('metric') || 'health';

  const { data: members } = await supabaseAdmin
    .from('group_members')
    .select('role, athlete_id, athletes(id, name, daily_calorie_target)')
    .eq('group_id', id);

  if (!members) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const leaderboard = await Promise.all(
    members.map(async (member: Record<string, unknown>) => {
      const athleteData = member.athletes as { id: string; name: string; daily_calorie_target: number | null } | { id: string; name: string; daily_calorie_target: number | null }[] | null;
      const athlete = Array.isArray(athleteData) ? athleteData[0] : athleteData;
      if (!athlete) return null;
      const athleteId = member.athlete_id as string;
      const role = member.role as string;

      if (metric === 'health') {
        const scores: number[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const score = await calculateHealthScore(athleteId, d.toISOString().split('T')[0], athlete.daily_calorie_target);
          scores.push(score.total);
        }
        const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
        return { athlete: { id: athlete.id, name: athlete.name }, role: role, value: Math.round(avg) };
      }

      if (metric === 'calories') {
        const { data } = await supabaseAdmin
          .from('cardio_logs')
          .select('calories_burned')
          .eq('athlete_id', athleteId)
          .gte('date', weekAgoStr);
        const total = (data || []).reduce((s: number, a: { calories_burned: number }) => s + (a.calories_burned || 0), 0);
        return { athlete: { id: athlete.id, name: athlete.name }, role: role, value: total };
      }

      if (metric === 'time') {
        const { data } = await supabaseAdmin
          .from('cardio_logs')
          .select('duration_minutes')
          .eq('athlete_id', athleteId)
          .gte('date', weekAgoStr);
        const total = (data || []).reduce((s: number, a: { duration_minutes: number }) => s + (a.duration_minutes || 0), 0);
        return { athlete: { id: athlete.id, name: athlete.name }, role: role, value: total };
      }

      // sleep regularity
      const { data: sleeps } = await supabaseAdmin
        .from('sleep_logs')
        .select('hours')
        .eq('athlete_id', athleteId)
        .gte('date', weekAgoStr);
      if (!sleeps || sleeps.length === 0) return { athlete: { id: athlete.id, name: athlete.name }, role: role, value: 999 };
      const avg = sleeps.reduce((s: number, e: { hours: number }) => s + e.hours, 0) / sleeps.length;
      const variance = sleeps.reduce((s: number, e: { hours: number }) => s + Math.pow(e.hours - avg, 2), 0) / sleeps.length;
      return { athlete: { id: athlete.id, name: athlete.name }, role: role, value: Math.round(Math.sqrt(variance) * 100) / 100 };
    })
  );

  const filtered = leaderboard.filter(Boolean);
  filtered.sort((a, b) => metric === 'sleep' ? a!.value - b!.value : b!.value - a!.value);
  return NextResponse.json(filtered);
}
