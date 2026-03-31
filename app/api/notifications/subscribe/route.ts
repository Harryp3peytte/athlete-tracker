import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAthleteId } from '@/lib/getAthlete';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const subscription = await request.json();
  const supabaseAdmin = getSupabaseAdmin();

  // Upsert by endpoint to avoid duplicates
  const { error } = await supabaseAdmin
    .from('push_subscriptions')
    .upsert(
      {
        athlete_id: auth.athleteId,
        endpoint: subscription.endpoint,
        keys_p256dh: subscription.keys.p256dh,
        keys_auth: subscription.keys.auth,
      },
      { onConflict: 'endpoint' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const auth = await getAthleteId(supabase);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { endpoint } = await request.json();
  const supabaseAdmin = getSupabaseAdmin();

  await supabaseAdmin
    .from('push_subscriptions')
    .delete()
    .eq('athlete_id', auth.athleteId)
    .eq('endpoint', endpoint);

  return NextResponse.json({ ok: true });
}
