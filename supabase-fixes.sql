-- ============================================
-- CORRECTIONS SUPABASE - Corrections des contraintes
-- ============================================
-- Exécute ce SQL dans Supabase SQL Editor pour corriger les problèmes

-- 1. Corriger la contrainte CHECK sur nutrition_logs.meal_type
-- Supprimer l'ancienne contrainte si elle existe
alter table public.nutrition_logs 
drop constraint if exists nutrition_logs_meal_type_check;

-- Créer une nouvelle contrainte qui accepte les valeurs avec et sans accents
alter table public.nutrition_logs
add constraint nutrition_logs_meal_type_check 
check (meal_type in (
  'petit_dejeuner', 'petit-déjeuner',
  'dejeuner', 'déjeuner',
  'gouter', 'goûter',
  'diner', 'dîner',
  'collation'
));

-- OU mieux : utiliser un type ENUM (plus propre)
-- Créer le type enum si il n'existe pas
do $$ 
begin
  if not exists (select 1 from pg_type where typname = 'meal_type_enum') then
    create type public.meal_type_enum as enum (
      'petit_dejeuner',
      'dejeuner', 
      'gouter',
      'diner',
      'collation'
    );
  end if;
end $$;

-- Modifier la colonne pour utiliser l'enum (optionnel, nécessite de migrer les données existantes)
-- alter table public.nutrition_logs 
-- alter column meal_type type public.meal_type_enum using meal_type::text::public.meal_type_enum;

-- 2. Rendre weight_kg nullable dans workout_exercises (si ce n'est pas déjà le cas)
alter table public.workout_exercises
alter column weight_kg drop not null;

-- Vérifier que la colonne est bien nullable
-- SELECT column_name, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'workout_exercises' AND column_name = 'weight_kg';
