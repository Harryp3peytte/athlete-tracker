-- Body measurements tracking
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id uuid REFERENCES public.athletes(id) ON DELETE CASCADE NOT NULL,
  date text NOT NULL,
  chest_cm numeric DEFAULT NULL,
  waist_cm numeric DEFAULT NULL,
  hips_cm numeric DEFAULT NULL,
  left_arm_cm numeric DEFAULT NULL,
  right_arm_cm numeric DEFAULT NULL,
  left_thigh_cm numeric DEFAULT NULL,
  right_thigh_cm numeric DEFAULT NULL,
  left_calf_cm numeric DEFAULT NULL,
  right_calf_cm numeric DEFAULT NULL,
  shoulders_cm numeric DEFAULT NULL,
  neck_cm numeric DEFAULT NULL,
  notes text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own measurements" ON public.body_measurements
  FOR SELECT USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own measurements" ON public.body_measurements
  FOR INSERT WITH CHECK (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own measurements" ON public.body_measurements
  FOR DELETE USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));
