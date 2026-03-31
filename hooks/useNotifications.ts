'use client';

import { useCallback, useState, useEffect } from 'react';
import { subscribeToPush, unsubscribeFromPush } from '@/components/ServiceWorkerRegistration';

export function useNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    // Check if already subscribed
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      const sub = await subscribeToPush();
      if (sub) {
        setIsSubscribed(true);
        setPermission('granted');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Push subscription failed:', err);
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      await unsubscribeFromPush();
      setIsSubscribed(false);
    } catch (err) {
      console.error('Push unsubscribe failed:', err);
    }
  }, []);

  return { subscribe, unsubscribe, isSubscribed, permission };
}
