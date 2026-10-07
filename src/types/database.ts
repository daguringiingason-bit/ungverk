// AUTO-GENERATED from the Supabase schema. Do not edit by hand.
// Regenerate: npx supabase gen types typescript --project-id llmwqlxtgilpvgiqskth > src/types/database.ts

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      municipalities: {
        Row: {
          active: boolean
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          id?: never
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          id?: never
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          customer_min_age: number
          id: boolean
          updated_at: string
          worker_max_age: number
          worker_min_age: number
        }
        Insert: {
          customer_min_age?: number
          id?: boolean
          updated_at?: string
          worker_max_age?: number
          worker_min_age?: number
        }
        Update: {
          customer_min_age?: number
          id?: boolean
          updated_at?: string
          worker_max_age?: number
          worker_min_age?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_id: string
          bio: string | null
          created_at: string
          date_of_birth: string
          first_name: string
          id: string
          last_name_private: string | null
          municipality_id: number
          role: Database["public"]["Enums"]["user_role"]
          suspended_at: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          avatar_id?: string
          bio?: string | null
          created_at?: string
          date_of_birth: string
          first_name: string
          id: string
          last_name_private?: string | null
          municipality_id: number
          role: Database["public"]["Enums"]["user_role"]
          suspended_at?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          avatar_id?: string
          bio?: string | null
          created_at?: string
          date_of_birth?: string
          first_name?: string
          id?: string
          last_name_private?: string | null
          municipality_id?: number
          role?: Database["public"]["Enums"]["user_role"]
          suspended_at?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      age_in_years: { Args: { dob: string }; Returns: number }
      complete_onboarding: {
        Args: {
          p_avatar_id?: string
          p_date_of_birth: string
          p_first_name: string
          p_municipality_id: number
          p_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: {
          avatar_id: string
          bio: string | null
          created_at: string
          date_of_birth: string
          first_name: string
          id: string
          last_name_private: string | null
          municipality_id: number
          role: Database["public"]["Enums"]["user_role"]
          suspended_at: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: never; Returns: boolean }
      today_is: { Args: never; Returns: string }
    }
    Enums: {
      user_role: "CUSTOMER" | "WORKER" | "ADMIN"
      verification_status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["CUSTOMER", "WORKER", "ADMIN"],
      verification_status: ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"],
    },
  },
} as const
