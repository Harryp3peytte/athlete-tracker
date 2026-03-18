import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAthleteId } from '@/lib/getAthlete';
import { joinGroupSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { inviteCode } = joinGroupSchema.parse(body);

  const { data: group } = await supabase
    .from('groups')
    .select('id, name')
    .eq('invite_code', inviteCode)
    .single();

  if (!group) return NextResponse.json({ error: 'Code invalide' }, { status: 404 });

  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('athlete_id', auth.athleteId)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: 'Déjà membre' }, { status: 400 });

  const { error } = await supabase.from('group_members').insert({
    group_id: group.id,
    athlete_id: auth.athleteId,
    role: 'member',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: 'Groupe rejoint', group });
}
