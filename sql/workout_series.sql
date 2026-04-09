-- Migration: Add per-series tracking to workout_exercises
-- series_data stores an array of { set, reps, weight_kg, completed } objects
-- notes stores free-text notes per exercise

ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS series_data jsonb DEFAULT '[]';

-- Add notes column if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_exercises' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.workout_exercises ADD COLUMN notes text DEFAULT '';
  END IF;
END $$;

-- Add duration_seconds to workout_sessions for session timer
ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS duration_seconds integer DEFAULT NULL;
