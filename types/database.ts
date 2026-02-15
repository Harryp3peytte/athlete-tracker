export type Database = {
  public: {
    Tables: {
      athletes: {
        Row: {
          id: string
          user_id: string
          name: string
          age: number
          height_cm: number
          gender: string
          base_metabolism: number
          daily_calorie_target: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          age: number
          height_cm: number
          gender: string
          base_metabolism: number
          daily_calorie_target: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          age?: number
          height_cm?: number
          gender?: string
          base_metabolism?: number
          daily_calorie_target?: number
          created_at?: string
        }
      }
      weight_logs: {
        Row: {
          id: string
          athlete_id: string
          date: string
          weight_kg: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          date: string
          weight_kg: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string
          date?: string
          weight_kg?: number
          notes?: string | null
          created_at?: string
        }
      }
      sleep_logs: {
        Row: {
          id: string
          athlete_id: string
          date: string
          hours: number
          quality: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          date: string
          hours: number
          quality: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string
          date?: string
          hours?: number
          quality?: number
          notes?: string | null
          created_at?: string
        }
      }
      hydration_logs: {
        Row: {
          id: string
          athlete_id: string
          date: string
          liters: number
          created_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          date: string
          liters: number
          created_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string
          date?: string
          liters?: number
          created_at?: string
        }
      }
      wellness_logs: {
        Row: {
          id: string
          athlete_id: string
          date: string
          form_score: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          date: string
          form_score: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string
          date?: string
          form_score?: number
          notes?: string | null
          created_at?: string
        }
      }
      nutrition_logs: {
        Row: {
          id: string
          athlete_id: string
          date: string
          meal_type: string
          description: string
          calories: number
          created_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          date: string
          meal_type: string
          description: string
          calories: number
          created_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string
          date?: string
          meal_type?: string
          description?: string
          calories?: number
          created_at?: string
        }
      }
      cardio_logs: {
        Row: {
          id: string
          athlete_id: string
          date: string
          activity_type: 'walking' | 'running' | 'cycling' | 'other'
          duration_minutes: number
          calories_burned: number
          distance_km: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          date: string
          activity_type: 'walking' | 'running' | 'cycling' | 'other'
          duration_minutes: number
          calories_burned: number
          distance_km?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string
          date?: string
          activity_type?: 'walking' | 'running' | 'cycling' | 'other'
          duration_minutes?: number
          calories_burned?: number
          distance_km?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      workout_sessions: {
        Row: {
          id: string
          athlete_id: string
          date: string
          name: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          date: string
          name: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string
          date?: string
          name?: string
          notes?: string | null
          created_at?: string
        }
      }
      workout_exercises: {
        Row: {
          id: string
          session_id: string
          exercise_name: string
          sets: number
          reps: number
          weight_kg: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          exercise_name: string
          sets: number
          reps: number
          weight_kg?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          exercise_name?: string
          sets?: number
          reps?: number
          weight_kg?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      workout_templates: {
        Row: {
          id: string
          athlete_id: string
          name: string
          weekday: number // 0=dimanche ... 6=samedi
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          name: string
          weekday: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string
          name?: string
          weekday?: number
          notes?: string | null
          created_at?: string
        }
      }
      workout_template_exercises: {
        Row: {
          id: string
          template_id: string
          exercise_name: string
          sets: number
          reps: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          exercise_name: string
          sets: number
          reps: number
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          exercise_name?: string
          sets?: number
          reps?: number
          sort_order?: number
          created_at?: string
        }
      }
    }
  }
}
