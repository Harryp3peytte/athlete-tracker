import { z } from 'zod';

export const weightSchema = z.object({
  weight_kg: z.number().positive().max(500),
  date: z.string(),
  notes: z.string().optional().nullable(),
});

export const sleepSchema = z.object({
  date: z.string(),
  hours: z.number().positive().max(24),
  quality: z.number().int().min(1).max(10).optional().nullable(),
  bedtime: z.string().optional().nullable(),
  waketime: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const nutritionSchema = z.object({
  date: z.string(),
  meal_type: z.string(),
  description: z.string().optional().nullable(),
  calories: z.number().int().nonnegative(),
  proteins: z.number().nonnegative().default(0),
  carbs: z.number().nonnegative().default(0),
  fats: z.number().nonnegative().default(0),
});

export const cardioSchema = z.object({
  date: z.string(),
  activity_type: z.enum(['walking', 'running', 'cycling', 'other']),
  duration_minutes: z.number().int().positive(),
  calories_burned: z.number().int().nonnegative(),
  distance_km: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const workoutSessionSchema = z.object({
  date: z.string(),
  name: z.string().min(1),
  notes: z.string().optional().nullable(),
  duration_seconds: z.number().int().nonnegative().optional().nullable(),
  exercises: z.array(z.object({
    exercise_name: z.string().min(1),
    sets: z.number().int().positive(),
    reps: z.number().int().positive(),
    weight_kg: z.number().nonnegative().optional().nullable(),
    notes: z.string().optional().nullable(),
    series_data: z.array(z.object({
      set: z.number().int().positive(),
      reps: z.number().int().nonnegative(),
      weight_kg: z.number().nonnegative(),
      completed: z.boolean(),
    })).optional().nullable(),
  })).optional(),
});

export const workoutTemplateSchema = z.object({
  name: z.string().min(1),
  weekday: z.number().int().min(0).max(6).optional().default(0),
  notes: z.string().optional().nullable(),
  exercises: z.array(z.object({
    exercise_name: z.string().min(1),
    sets: z.number().int().positive(),
    reps: z.number().int().positive(),
    sort_order: z.number().int().nonnegative(),
  })).optional(),
});

export const hydrationSchema = z.object({
  date: z.string(),
  liters: z.number().positive(),
});

export const wellnessSchema = z.object({
  date: z.string(),
  form_score: z.number().int().min(1).max(10),
  energy: z.number().int().min(1).max(10).optional().nullable(),
  stress: z.number().int().min(1).max(10).optional().nullable(),
  pain: z.number().int().min(1).max(10).optional().nullable(),
  motivation: z.number().int().min(1).max(10).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createGroupSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional().nullable(),
});

export const joinGroupSchema = z.object({
  inviteCode: z.string().length(6),
});

export const chatMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  age: z.number().int().positive().optional().nullable(),
  height_cm: z.number().positive().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  daily_calorie_target: z.number().int().positive().optional().nullable(),
  base_metabolism: z.number().int().positive().optional().nullable(),
  goal_type: z.enum(['LOSE_WEIGHT', 'MAINTAIN', 'GAIN_MUSCLE']).optional().nullable(),
  target_weight: z.number().positive().optional().nullable(),
  hydration_goal: z.number().positive().optional().nullable(),
});
