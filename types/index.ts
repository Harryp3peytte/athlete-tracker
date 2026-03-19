// ============================================
// Types mapping to existing Supabase tables
// ============================================

export interface Athlete {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  height_cm: number | null;
  gender: 'male' | 'female' | 'other' | null;
  base_metabolism: number | null;
  daily_calorie_target: number | null;
  created_at: string;
  updated_at: string;
}

export interface WeightLog {
  id: string;
  athlete_id: string;
  date: string;
  weight_kg: number;
  notes: string | null;
  created_at: string;
}

export interface SleepLog {
  id: string;
  athlete_id: string;
  date: string;
  hours: number;
  quality: number | null;
  notes: string | null;
  created_at: string;
}

export type MealTypeDB =
  | 'petit_dejeuner' | 'petit-déjeuner'
  | 'dejeuner' | 'déjeuner'
  | 'gouter' | 'goûter'
  | 'diner' | 'dîner'
  | 'collation';

export interface NutritionLog {
  id: string;
  athlete_id: string;
  date: string;
  meal_type: MealTypeDB | null;
  description: string | null;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  created_at: string;
}

export interface CardioLog {
  id: string;
  athlete_id: string;
  date: string;
  activity_type: 'walking' | 'running' | 'cycling' | 'other';
  duration_minutes: number;
  calories_burned: number;
  distance_km: number | null;
  notes: string | null;
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  athlete_id: string;
  date: string;
  name: string | null;
  notes: string | null;
  created_at: string;
  workout_exercises?: WorkoutExercise[];
}

export interface WorkoutExercise {
  id: string;
  session_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
  notes: string | null;
  created_at: string;
}

export interface WorkoutTemplate {
  id: string;
  athlete_id: string;
  name: string;
  weekday: number;
  notes: string | null;
  created_at: string;
  workout_template_exercises?: WorkoutTemplateExercise[];
}

export interface WorkoutTemplateExercise {
  id: string;
  template_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  sort_order: number;
  created_at: string;
}

export interface WeeklyProgram {
  id: string;
  athlete_id: string;
  weekday: number; // 0=Lundi, 6=Dimanche
  template_id: string | null;
  template?: WorkoutTemplate; // jointure
  created_at: string;
  updated_at: string;
}

export interface ExerciseHistory {
  date: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
}

export interface HydrationLog {
  id: string;
  athlete_id: string;
  date: string;
  liters: number;
  created_at: string;
}

export interface WellnessLog {
  id: string;
  athlete_id: string;
  date: string;
  form_score: number;
  notes: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  avatar: string | null;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  athlete_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface ChatMessage {
  id: string;
  athlete_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// ============================================
// Frontend display types
// ============================================

export const MEAL_TYPE_LABELS: Record<string, string> = {
  'petit_dejeuner': 'Petit-déjeuner',
  'petit-déjeuner': 'Petit-déjeuner',
  'dejeuner': 'Déjeuner',
  'déjeuner': 'Déjeuner',
  'gouter': 'Goûter',
  'goûter': 'Goûter',
  'diner': 'Dîner',
  'dîner': 'Dîner',
  'collation': 'Collation',
};

export const MEAL_TYPE_ORDER: string[] = [
  'petit_dejeuner', 'dejeuner', 'gouter', 'diner', 'collation',
];

export const CARDIO_TYPE_LABELS: Record<string, string> = {
  walking: 'Marche',
  running: 'Course',
  cycling: 'Vélo',
  other: 'Autre',
};

// Legacy: JS Date weekday order (0=Sunday)
export const WEEKDAY_LABELS_SUNDAY_FIRST: string[] = [
  'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi',
];

// Programme hebdomadaire: 0=Lundi, 6=Dimanche
export const WEEKDAY_LABELS: string[] = [
  'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche',
];

export interface DashboardData {
  athlete: Athlete;
  healthScore: { total: number; breakdown: { sleep: number; calories: number; activity: number; hydration: number; wellness: number } };
  calories: { consumed: number; burned: number; target: number; net: number; metabolism: number; activities: number };
  calorieTrend: Array<{ date: string; consumed: number; burned: number }>;
  macros: { proteins: number; carbs: number; fats: number };
  weight: { current: number | null; trend: WeightLog[] };
  sleep: SleepLog | null;
  cardioActivities: CardioLog[];
  workoutSessions: WorkoutSession[];
  hydration: number;
  wellness: WellnessLog | null;
}

export interface LeaderboardEntry {
  athlete: { id: string; name: string };
  role: string;
  value: number;
}
