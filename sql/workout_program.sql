-- Programme hebdomadaire : lie les jours de la semaine aux séances types
CREATE TABLE IF NOT EXISTS public.weekly_program (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id),
  weekday integer NOT NULL CHECK (weekday >= 0 AND weekday <= 6), -- 0=Lundi, 6=Dimanche
  template_id uuid REFERENCES public.workout_templates(id) ON DELETE SET NULL, -- séance type assignée
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT weekly_program_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_program_unique UNIQUE (athlete_id, weekday)
);

-- RLS
ALTER TABLE public.weekly_program ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly program"
  ON public.weekly_program FOR SELECT
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own weekly program"
  ON public.weekly_program FOR INSERT
  WITH CHECK (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own weekly program"
  ON public.weekly_program FOR UPDATE
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own weekly program"
  ON public.weekly_program FOR DELETE
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));
