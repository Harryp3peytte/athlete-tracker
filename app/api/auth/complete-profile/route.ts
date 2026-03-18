import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { updateProfileSchema } from '@/lib/validations';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: athlete } = await supabaseAdmin
    .from('athletes')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!athlete) return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 });
  return NextResponse.json(athlete);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const validated = updateProfileSchema.parse(body);

  // Check if profile already exists
  const { data: existing } = await supabaseAdmin
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    // Update
    const { data, error } = await supabaseAdmin
      .from('athletes')
      .update(validated)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Create
  const { data, error } = await supabaseAdmin
    .from('athletes')
    .insert({ user_id: user.id, ...validated })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const validated = updateProfileSchema.parse(body);

  const { data, error } = await supabaseAdmin
    .from('athletes')
    .update(validated)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
