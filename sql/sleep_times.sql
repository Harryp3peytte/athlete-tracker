-- Add bedtime and waketime to sleep_logs
ALTER TABLE public.sleep_logs
  ADD COLUMN IF NOT EXISTS bedtime text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS waketime text DEFAULT NULL;
