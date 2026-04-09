'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useCountdown(initialSeconds: number = 90) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive && remaining > 0) {
      intervalRef.current = setInterval(() => setRemaining(r => r - 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, remaining]);

  // When countdown reaches 0
  useEffect(() => {
    if (remaining === 0 && isActive) {
      setIsActive(false);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    }
  }, [remaining, isActive]);

  const start = useCallback((seconds?: number) => {
    if (seconds !== undefined) setRemaining(seconds);
    setIsActive(true);
  }, []);

  const skip = useCallback(() => {
    setIsActive(false);
    setRemaining(0);
  }, []);

  const reset = useCallback((seconds?: number) => {
    setIsActive(false);
    setRemaining(seconds ?? initialSeconds);
  }, [initialSeconds]);

  const formatCountdown = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }, []);

  return {
    remaining,
    isActive,
    isFinished: remaining === 0 && !isActive,
    start,
    skip,
    reset,
    formatCountdown: () => formatCountdown(remaining),
  };
}
