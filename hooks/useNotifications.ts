'use client';

import { useCallback, useRef } from 'react';

interface NotificationPref {
  reminder_type: string;
  enabled: boolean;
  time: string | null;
  interval_minutes: number | null;
}

const MESSAGES: Record<string, { title: string; body: string }> = {
  wake: { title: '☀️ Bonjour !', body: "N'oublie pas de noter ton heure de réveil" },
  sleep: { title: '🌙 Bonne nuit !', body: 'Note ton heure de coucher avant de dormir' },
  hydration: { title: '💧 Hydratation', body: "Tu as bu assez d'eau ? Pense à t'hydrater !" },
  breakfast: { title: '🥣 Petit-déjeuner !', body: 'Pense à noter ce que tu manges' },
  lunch: { title: '🍽️ Bon appétit !', body: 'Note ton déjeuner' },
  dinner: { title: "🍽️ C'est l'heure du dîner !", body: 'Note ton repas' },
  workout: { title: "💪 C'est l'heure !", body: "C'est l'heure de t'entraîner !" },
};

export function useNotifications() {
  const timersRef = useRef<number[]>([]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  const showNotification = useCallback((title: string, body: string) => {
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body,
          icon: '/icons/icon-192.svg',
          badge: '/icons/icon-192.svg',
        } as NotificationOptions);
      });
    }
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(id => clearTimeout(id));
    timersRef.current = [];
  }, []);

  const scheduleReminders = useCallback((preferences: NotificationPref[]) => {
    clearTimers();

    preferences.forEach(pref => {
      if (!pref.enabled) return;
      const msg = MESSAGES[pref.reminder_type];
      if (!msg) return;

      if (pref.reminder_type === 'hydration' && pref.interval_minutes) {
        const id = window.setInterval(() => {
          showNotification(msg.title, msg.body);
        }, pref.interval_minutes * 60 * 1000);
        timersRef.current.push(id);
      } else if (pref.time) {
        const scheduleDaily = () => {
          const [hours, minutes] = pref.time!.split(':').map(Number);
          const now = new Date();
          const target = new Date();
          target.setHours(hours, minutes, 0, 0);
          if (target <= now) target.setDate(target.getDate() + 1);
          const delay = target.getTime() - now.getTime();

          const id = window.setTimeout(() => {
            showNotification(msg.title, msg.body);
            scheduleDaily(); // re-schedule for next day
          }, delay);
          timersRef.current.push(id);
        };
        scheduleDaily();
      }
    });
  }, [clearTimers, showNotification]);

  return { requestPermission, scheduleReminders, showNotification, clearTimers };
}
