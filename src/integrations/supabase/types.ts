export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      basket_items: {
        Row: {
          basket_id: string
          category: string
          freshness_days: number
          id: string
          image_emoji: string | null
          name: string
          price: number
          quantity: number
          unit: string
          user_id: string
        }
        Insert: {
          basket_id: string
          category?: string
          freshness_days?: number
          id?: string
          image_emoji?: string | null
          name: string
          price?: number
          quantity?: number
          unit?: string
          user_id: string
        }
        Update: {
          basket_id?: string
          category?: string
          freshness_days?: number
          id?: string
          image_emoji?: string | null
          name?: string
          price?: number
          quantity?: number
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "basket_items_basket_id_fkey"
            columns: ["basket_id"]
            isOneToOne: false
            referencedRelation: "grocery_baskets"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_schedules: {
        Row: {
          basket_id: string
          created_at: string
          id: string
          items: Json
          label: string
          slot_date: string
          slot_window: string
          status: string
          user_id: string
        }
        Insert: {
          basket_id: string
          created_at?: string
          id?: string
          items?: Json
          label?: string
          slot_date: string
          slot_window?: string
          status?: string
          user_id: string
        }
        Update: {
          basket_id?: string
          created_at?: string
          id?: string
          items?: Json
          label?: string
          slot_date?: string
          slot_window?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_schedules_basket_id_fkey"
            columns: ["basket_id"]
            isOneToOne: false
            referencedRelation: "grocery_baskets"
            referencedColumns: ["id"]
          },
        ]
      }
      grocery_baskets: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          status: string
          total_items: number
          total_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          status?: string
          total_items?: number
          total_value?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          status?: string
          total_items?: number
          total_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grocery_baskets_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          category: string
          freshness_days: number
          id: string
          meal_id: string
          name: string
          quantity: number
          unit: string
          user_id: string
        }
        Insert: {
          category?: string
          freshness_days?: number
          id?: string
          meal_id: string
          name: string
          quantity?: number
          unit?: string
          user_id: string
        }
        Update: {
          category?: string
          freshness_days?: number
          id?: string
          meal_id?: string
          name?: string
          quantity?: number
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          id: string
          status: string
          summary: string | null
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          summary?: string | null
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          summary?: string | null
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          calories: number | null
          completed: boolean
          completed_at: string | null
          created_at: string
          cuisine: string | null
          day_index: number
          description: string | null
          id: string
          image_emoji: string | null
          name: string
          plan_id: string
          prep_minutes: number | null
          protein_g: number | null
          recipe_steps: string[]
          slot: string
          user_id: string
        }
        Insert: {
          calories?: number | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          cuisine?: string | null
          day_index: number
          description?: string | null
          id?: string
          image_emoji?: string | null
          name: string
          plan_id: string
          prep_minutes?: number | null
          protein_g?: number | null
          recipe_steps?: string[]
          slot: string
          user_id: string
        }
        Update: {
          calories?: number | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          cuisine?: string | null
          day_index?: number
          description?: string | null
          id?: string
          image_emoji?: string | null
          name?: string
          plan_id?: string
          prep_minutes?: number | null
          protein_g?: number | null
          recipe_steps?: string[]
          slot?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      preferences: {
        Row: {
          allergies: string[]
          budget_weekly: number
          cook_time_minutes: number
          created_at: string
          cuisines: string[]
          diet: string
          health_goals: string[]
          household_size: number
          spice_level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string[]
          budget_weekly?: number
          cook_time_minutes?: number
          created_at?: string
          cuisines?: string[]
          diet?: string
          health_goals?: string[]
          household_size?: number
          spice_level?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string[]
          budget_weekly?: number
          cook_time_minutes?: number
          created_at?: string
          cuisines?: string[]
          diet?: string
          health_goals?: string[]
          household_size?: number
          spice_level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          onboarded: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          onboarded?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarded?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      weekly_stats: {
        Row: {
          created_at: string
          id: string
          meals_completed: number
          streak_days: number
          total_meals: number
          user_id: string
          utilization_pct: number
          waste_reduction_kg: number
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          meals_completed?: number
          streak_days?: number
          total_meals?: number
          user_id: string
          utilization_pct?: number
          waste_reduction_kg?: number
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          meals_completed?: number
          streak_days?: number
          total_meals?: number
          user_id?: string
          utilization_pct?: number
          waste_reduction_kg?: number
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
