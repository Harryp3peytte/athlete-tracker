-- Add multi-dimensional wellness tracking
ALTER TABLE public.wellness_logs
  ADD COLUMN IF NOT EXISTS energy integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stress integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pain integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS motivation integer DEFAULT NULL;
