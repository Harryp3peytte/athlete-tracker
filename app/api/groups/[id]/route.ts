import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const { id } = await params;

  const { data: group } = await supabaseAdmin.from('groups').select('*').eq('id', id).single();
  if (!group) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });

  const { data: members } = await supabaseAdmin
    .from('group_members')
    .select('id, role, athlete_id, athletes(id, name)')
    .eq('group_id', id);

  const isMember = (members || []).some((m: { athlete_id: string }) => m.athlete_id === auth.athleteId);
  if (!isMember) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  return NextResponse.json({ ...group, members: members || [] });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const { id } = await params;

  const { data: group } = await supabaseAdmin.from('groups').select('created_by').eq('id', id).single();
  if (!group) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });

  if (group.created_by === auth.athleteId) {
    await supabaseAdmin.from('groups').delete().eq('id', id);
    return NextResponse.json({ message: 'Groupe supprimé' });
  }

  // Leave group
  await supabaseAdmin.from('group_members').delete().eq('group_id', id).eq('athlete_id', auth.athleteId);
  return NextResponse.json({ message: 'Groupe quitté' });
}
