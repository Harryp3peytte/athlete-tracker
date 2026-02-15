'use client'

import { Component, ReactNode, Suspense } from 'react'
import dynamic from 'next/dynamic'

// Import dynamique avec gestion d'erreur
const WorkoutTemplates = dynamic(() => import('./WorkoutTemplates'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-white/15 bg-white/60 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <div className="text-sm text-gray-600 dark:text-gray-400">Chargement...</div>
    </div>
  ),
})

interface Props {
  athleteId: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class WorkoutTemplatesWrapper extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('WorkoutTemplates error:', error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 backdrop-blur dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            ⚠️ Séances modèles non disponibles
          </div>
          <div className="mt-2 text-xs text-amber-800 dark:text-amber-300">
            Les tables <code className="rounded bg-amber-100 px-1 dark:bg-amber-500/20">workout_templates</code> et{' '}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-500/20">workout_template_exercises</code> doivent être créées dans Supabase.
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-medium text-amber-800 dark:text-amber-300">
              Voir le SQL à exécuter
            </summary>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-amber-200 bg-white/50 p-3 text-[10px] dark:border-amber-500/30 dark:bg-black/20">
{`create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  name text not null,
  weekday int not null check (weekday between 0 and 6),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_name text not null,
  sets int not null default 0,
  reps int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- RLS Policies
alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;

create policy "Users can view their own templates"
  on public.workout_templates for select
  using (athlete_id in (select id from public.athletes where user_id = auth.uid()));

create policy "Users can insert their own templates"
  on public.workout_templates for insert
  with check (athlete_id in (select id from public.athletes where user_id = auth.uid()));

create policy "Users can view their own template exercises"
  on public.workout_template_exercises for select
  using (template_id in (
    select id from public.workout_templates 
    where athlete_id in (select id from public.athletes where user_id = auth.uid())
  ));

create policy "Users can insert their own template exercises"
  on public.workout_template_exercises for insert
  with check (template_id in (
    select id from public.workout_templates 
    where athlete_id in (select id from public.athletes where user_id = auth.uid())
  ));`}
            </pre>
          </details>
        </div>
      )
    }

    return (
      <Suspense
        fallback={
          <div className="rounded-2xl border border-white/15 bg-white/60 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="text-sm text-gray-600 dark:text-gray-400">Chargement...</div>
          </div>
        }
      >
        <WorkoutTemplates athleteId={this.props.athleteId} />
      </Suspense>
    )
  }
}
