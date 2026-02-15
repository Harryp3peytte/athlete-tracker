-- ============================================
-- SETUP SUPABASE - Séances modèles récurrentes
-- ============================================
-- Exécute ce SQL dans Supabase SQL Editor pour activer les séances modèles

-- 1. Créer la table workout_templates
create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  name text not null,
  weekday int not null check (weekday between 0 and 6),
  notes text,
  created_at timestamptz not null default now()
);

-- 2. Créer la table workout_template_exercises
create table if not exists public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_name text not null,
  sets int not null default 0,
  reps int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 3. Créer une fonction helper pour vérifier si un athlete_id appartient à l'utilisateur actuel
create or replace function public.is_own_athlete(athlete_uuid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.athletes
    where id = athlete_uuid
    and user_id = auth.uid()
  );
$$;

-- 4. Activer RLS
alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;

-- 4. Supprimer les anciennes policies si elles existent
drop policy if exists "Users can view their own templates" on public.workout_templates;
drop policy if exists "Users can insert their own templates" on public.workout_templates;
drop policy if exists "Users can update their own templates" on public.workout_templates;
drop policy if exists "Users can delete their own templates" on public.workout_templates;

drop policy if exists "Users can view their own template exercises" on public.workout_template_exercises;
drop policy if exists "Users can insert their own template exercises" on public.workout_template_exercises;
drop policy if exists "Users can update their own template exercises" on public.workout_template_exercises;
drop policy if exists "Users can delete their own template exercises" on public.workout_template_exercises;

-- 5. Créer les policies pour workout_templates
-- SELECT: L'utilisateur peut voir ses propres templates
create policy "Users can view their own templates"
  on public.workout_templates
  for select
  using (public.is_own_athlete(athlete_id));

-- INSERT: L'utilisateur peut créer des templates pour son propre athlete_id
create policy "Users can insert their own templates"
  on public.workout_templates
  for insert
  with check (public.is_own_athlete(athlete_id));

-- UPDATE: L'utilisateur peut modifier ses propres templates
create policy "Users can update their own templates"
  on public.workout_templates
  for update
  using (public.is_own_athlete(athlete_id))
  with check (public.is_own_athlete(athlete_id));

-- DELETE: L'utilisateur peut supprimer ses propres templates
create policy "Users can delete their own templates"
  on public.workout_templates
  for delete
  using (public.is_own_athlete(athlete_id));

-- 6. Créer une fonction helper pour vérifier si un template_id appartient à l'utilisateur
create or replace function public.is_own_template(template_uuid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.workout_templates wt
    join public.athletes a on a.id = wt.athlete_id
    where wt.id = template_uuid
    and a.user_id = auth.uid()
  );
$$;

-- 7. Créer les policies pour workout_template_exercises
-- SELECT: L'utilisateur peut voir les exercices de ses propres templates
create policy "Users can view their own template exercises"
  on public.workout_template_exercises
  for select
  using (public.is_own_template(template_id));

-- INSERT: L'utilisateur peut créer des exercices pour ses propres templates
create policy "Users can insert their own template exercises"
  on public.workout_template_exercises
  for insert
  with check (public.is_own_template(template_id));

-- UPDATE: L'utilisateur peut modifier les exercices de ses propres templates
create policy "Users can update their own template exercises"
  on public.workout_template_exercises
  for update
  using (public.is_own_template(template_id))
  with check (public.is_own_template(template_id));

-- DELETE: L'utilisateur peut supprimer les exercices de ses propres templates
create policy "Users can delete their own template exercises"
  on public.workout_template_exercises
  for delete
  using (public.is_own_template(template_id));

-- 8. Créer des index pour améliorer les performances
create index if not exists idx_workout_templates_athlete_id on public.workout_templates(athlete_id);
create index if not exists idx_workout_templates_weekday on public.workout_templates(weekday);
create index if not exists idx_workout_template_exercises_template_id on public.workout_template_exercises(template_id);
create index if not exists idx_workout_template_exercises_sort_order on public.workout_template_exercises(template_id, sort_order);
