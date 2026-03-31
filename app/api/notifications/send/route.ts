import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const MESSAGES: Record<string, { title: string; body: string }> = {
  wake: { title: '☀️ Bonjour !', body: "N'oublie pas de noter ton heure de réveil" },
  sleep: { title: '🌙 Bonne nuit !', body: 'Note ton heure de coucher avant de dormir' },
  hydration: { title: '💧 Hydratation', body: "Tu as bu assez d'eau ? Pense à t'hydrater !" },
  breakfast: { title: '🥣 Petit-déjeuner !', body: 'Pense à noter ce que tu manges' },
  lunch: { title: '🍽️ Bon appétit !', body: 'Note ton déjeuner' },
  dinner: { title: "🍽️ C'est l'heure du dîner !", body: 'Note ton repas' },
  workout: { title: "💪 C'est l'heure !", body: "C'est l'heure de t'entraîner !" },
};

function initWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error('Missing VAPID keys');
  webpush.setVapidDetails('mailto:fittrack@noreply.com', publicKey, privateKey);
}

async function handleSend(request: NextRequest) {
  // Protect with secret
  const secret = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  initWebPush();
  const supabaseAdmin = getSupabaseAdmin();

  // Get current time in HH:MM (Paris timezone)
  const now = new Date();
  const parisTime = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
  const [currentHour, currentMinute] = parisTime.split(':').map(Number);

  // Get all enabled notification preferences
  const { data: prefs } = await supabaseAdmin
    .from('notification_preferences')
    .select('athlete_id, reminder_type, time, interval_minutes')
    .eq('enabled', true);

  if (!prefs || prefs.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Determine which athletes need notifications right now
  const athletesToNotify: Map<string, string[]> = new Map();

  for (const pref of prefs) {
    let shouldSend = false;

    if (pref.reminder_type === 'hydration' && pref.interval_minutes) {
      // Send hydration reminders between 8:00 and 22:00, every interval
      if (currentHour >= 8 && currentHour < 22) {
        const minutesSince8am = (currentHour - 8) * 60 + currentMinute;
        shouldSend = minutesSince8am % pref.interval_minutes < 15; // 15min window
      }
    } else if (pref.time) {
      const [targetH, targetM] = pref.time.split(':').map(Number);
      // Match within a 15-minute window (cron runs every 15min)
      const targetMinutes = targetH * 60 + targetM;
      const currentMinutes = currentHour * 60 + currentMinute;
      shouldSend = currentMinutes >= targetMinutes && currentMinutes < targetMinutes + 15;
    }

    if (shouldSend) {
      const existing = athletesToNotify.get(pref.athlete_id) || [];
      existing.push(pref.reminder_type);
      athletesToNotify.set(pref.athlete_id, existing);
    }
  }

  if (athletesToNotify.size === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Get push subscriptions for these athletes
  const athleteIds = Array.from(athletesToNotify.keys());
  const { data: subscriptions } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .in('athlete_id', athleteIds);

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  const staleEndpoints: string[] = [];

  for (const sub of subscriptions) {
    const reminderTypes = athletesToNotify.get(sub.athlete_id) || [];
    for (const type of reminderTypes) {
      const msg = MESSAGES[type];
      if (!msg) continue;

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
      };

      try {
        await webpush.sendNotification(pushSubscription, JSON.stringify({
          title: msg.title,
          body: msg.body,
          url: '/dashboard',
        }));
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          staleEndpoints.push(sub.endpoint);
        }
      }
    }
  }

  // Clean up stale subscriptions
  if (staleEndpoints.length > 0) {
    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .in('endpoint', staleEndpoints);
  }

  return NextResponse.json({ sent, cleaned: staleEndpoints.length });
}

// Support both GET (cron-job.org) and POST
export async function GET(request: NextRequest) {
  return handleSend(request);
}

export async function POST(request: NextRequest) {
  return handleSend(request);
}
