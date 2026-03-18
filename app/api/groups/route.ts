import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAthleteId } from '@/lib/getAthlete';
import { createGroupSchema } from '@/lib/validations';
import { generateInviteCode } from '@/lib/utils';

export async function GET() {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  // Get groups where user is a member
  const { data: memberships } = await supabaseAdmin
    .from('group_members')
    .select('group_id, role')
    .eq('athlete_id', auth.athleteId);

  if (!memberships || memberships.length === 0) return NextResponse.json([]);

  const groupIds = memberships.map(m => m.group_id);
  const { data: groups } = await supabaseAdmin
    .from('groups')
    .select('*')
    .in('id', groupIds);

  // Count members per group
  const result = await Promise.all(
    (groups || []).map(async (g) => {
      const { count } = await supabaseAdmin
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', g.id);
      const myRole = memberships.find(m => m.group_id === g.id)?.role || 'member';
      return { ...g, memberCount: count || 0, myRole };
    })
  );

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();

  const body = await request.json();
  const validated = createGroupSchema.parse(body);

  const { data: group, error } = await supabaseAdmin
    .from('groups')
    .insert({
      name: validated.name,
      description: validated.description,
      invite_code: generateInviteCode(),
      created_by: auth.athleteId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Add creator as admin
  await supabaseAdmin.from('group_members').insert({
    group_id: group.id,
    athlete_id: auth.athleteId,
    role: 'admin',
  });

  return NextResponse.json(group, { status: 201 });
}
