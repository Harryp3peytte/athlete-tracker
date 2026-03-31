-- ============================================
-- FitTrack — Push subscriptions table
-- À exécuter dans Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  keys_p256dh text NOT NULL,
  keys_auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their push subscriptions" ON public.push_subscriptions
  FOR ALL USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );
