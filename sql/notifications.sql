-- ============================================
-- FitTrack — Notifications preferences table
-- À exécuter dans Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id),
  reminder_type text NOT NULL CHECK (reminder_type IN ('wake', 'sleep', 'hydration', 'breakfast', 'lunch', 'dinner', 'workout')),
  enabled boolean NOT NULL DEFAULT false,
  time text,
  interval_minutes integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT notification_preferences_unique UNIQUE (athlete_id, reminder_type)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their notification preferences" ON public.notification_preferences
  FOR ALL USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );
