-- Add target_weight and hydration_goal to athletes table
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS target_weight numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hydration_goal numeric DEFAULT 2.0;
