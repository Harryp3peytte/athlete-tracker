'use client';

import { useState, useEffect } from 'react';
import type { Athlete } from '@/types';

export function useProfile() {
  const [profile, setProfile] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/complete-profile')
      .then(res => res.ok ? res.json() : null)
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { profile, loading, setProfile };
}
