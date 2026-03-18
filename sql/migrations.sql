-- ============================================
-- FitTrack — Migrations SQL pour Supabase
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- 1. Ajouter colonnes macros sur nutrition_logs
ALTER TABLE public.nutrition_logs
  ADD COLUMN IF NOT EXISTS proteins numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carbs numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fats numeric DEFAULT 0;

-- 2. Table groups
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  invite_code text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES public.athletes(id),
  avatar text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT groups_pkey PRIMARY KEY (id)
);

-- 3. Table group_members
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.athletes(id),
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  CONSTRAINT group_members_pkey PRIMARY KEY (id),
  CONSTRAINT group_members_unique UNIQUE (group_id, athlete_id)
);

-- 4. Table chat_messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
);

-- 5. RLS Policies (optionnel mais recommandé)
-- Activer RLS sur les nouvelles tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy : les membres peuvent voir leur groupe
CREATE POLICY "Members can view their groups" ON public.groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM public.group_members WHERE athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()))
  );

-- Policy : tout utilisateur authentifié peut créer un groupe
CREATE POLICY "Authenticated users can create groups" ON public.groups
  FOR INSERT WITH CHECK (
    created_by IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Policy : le créateur peut supprimer son groupe
CREATE POLICY "Creator can delete group" ON public.groups
  FOR DELETE USING (
    created_by IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Policy : les membres peuvent voir les membres de leur groupe
CREATE POLICY "Members can view group members" ON public.group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM public.group_members gm WHERE gm.athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()))
  );

-- Policy : les utilisateurs authentifiés peuvent rejoindre un groupe
CREATE POLICY "Users can join groups" ON public.group_members
  FOR INSERT WITH CHECK (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Policy : les utilisateurs peuvent quitter un groupe
CREATE POLICY "Users can leave groups" ON public.group_members
  FOR DELETE USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Policy : les utilisateurs peuvent voir/écrire leurs messages chat
CREATE POLICY "Users can view their chat messages" ON public.chat_messages
  FOR SELECT USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );
