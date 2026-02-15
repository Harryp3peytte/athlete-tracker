# Suivi Athlète - Application de suivi pour athlètes

Application de suivi complète pour athlètes construite avec Next.js 15, Supabase, TypeScript, Tailwind CSS et Recharts.

## Fonctionnalités

- 🔐 **Authentification** : Système d'authentification complet avec Supabase Auth
- 📊 **Dashboard** : Vue d'ensemble quotidienne avec métriques clés
- 📈 **Graphiques** : Visualisation des données sur 7 ou 30 jours
  - Évolution du poids
  - Calories (entrées/sorties)
  - Heures de sommeil
- 📝 **Formulaires de saisie** :
  - Nutrition (repas et calories)
  - Cardio (activités, durée, calories brûlées)
  - Sommeil (heures, qualité)
  - Hydratation (litres)
  - Forme (score 1-10)
  - Poids
- 💪 **Séances de musculation** : Historique avec progression des charges
- 📱 **Responsive** : Design adapté mobile et desktop

## Structure de la base de données

L'application utilise les tables suivantes dans Supabase :

- `athletes` : Profil de l'athlète
- `weight_logs` : Journal du poids
- `sleep_logs` : Journal du sommeil
- `hydration_logs` : Journal d'hydratation
- `wellness_logs` : Journal de forme
- `nutrition_logs` : Journal nutritionnel
- `cardio_logs` : Journal d'activités cardio
- `workout_sessions` : Séances de musculation
- `workout_exercises` : Exercices des séances

### Séances modèles (récurrence)

Pour la fonctionnalité “séances modèles” (ex: **Dos** tous les **mercredis**), ajoute ces tables dans Supabase :

```sql
create table if not exists public.workout_templates (
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
```

Ensuite, active les **RLS policies** selon ton modèle (au minimum: l’utilisateur ne voit que ses données via son `athlete_id`).

## Configuration

1. **Variables d'environnement** : Créez un fichier `.env.local` avec :
   ```
   NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
   ```

2. **Installation des dépendances** :
   ```bash
   npm install
   ```

3. **Lancement du serveur de développement** :
   ```bash
   npm run dev
   ```

4. Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Technologies utilisées

- **Next.js 15** : Framework React avec App Router
- **Supabase** : Backend as a Service (BaaS)
- **TypeScript** : Typage statique
- **Tailwind CSS** : Framework CSS utilitaire
- **Recharts** : Bibliothèque de graphiques React
- **shadcn/ui** : Composants UI modernes
- **date-fns** : Manipulation de dates

## Structure du projet

```
├── app/
│   ├── actions/          # Server actions
│   ├── dashboard/        # Page dashboard
│   ├── login/            # Page de connexion
│   ├── signup/           # Page d'inscription
│   └── setup/            # Configuration du profil
├── components/
│   ├── dashboard/        # Composants du dashboard
│   ├── setup/            # Composants de configuration
│   └── ui/               # Composants UI réutilisables
├── lib/
│   └── supabase/         # Clients Supabase
└── types/
    └── database.ts       # Types TypeScript pour la DB
```

## Déploiement

L'application peut être déployée sur Vercel, Netlify ou tout autre hébergeur compatible Next.js.

Assurez-vous de configurer les variables d'environnement sur votre plateforme de déploiement.
