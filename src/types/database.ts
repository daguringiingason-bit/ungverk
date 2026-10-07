// Generated from the Supabase schema (Insert/Update of RPC-only tables set to `never`
// and worker_can_take_job omitted, since clients cannot write/call them).
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
      job_applications: {
        Row: {
          created_at: string
          id: string
          job_id: string
          message: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          worker_id: string
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_categories: {
        Row: {
          active: boolean
          description: string
          id: number
          legal_basis: Database["public"]["Enums"]["legal_basis"]
          legal_reference: string
          maximum_age: number
          minimum_age: number
          name: string
          requires_manual_approval: boolean
          risk_level: Database["public"]["Enums"]["risk_level"]
          safety_rules: string
          slug: string
          sort_order: number
        }
        Insert: never
        Update: never
        Relationships: []
      }
      job_private_details: {
        Row: {
          address: string
          job_id: string
          latitude: number | null
          longitude: number | null
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: "job_private_details_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          approved_at: string | null
          area_label: string
          assigned_worker_id: string | null
          category_id: number
          created_at: string
          customer_id: string
          description: string
          duration_minutes: number
          id: string
          min_age: number
          municipality_id: number
          price_isk: number
          requires_approval: boolean
          safety_confirmed_at: string
          starts_at: string
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: "jobs_assigned_worker_id_fkey"
            columns: ["assigned_worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
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
          adolescent_latest_end: string
          adolescent_max_minutes: number
          child_latest_end: string
          child_max_age: number
          child_max_minutes_holiday: number
          child_max_minutes_school_term: number
          customer_min_age: number
          earliest_start: string
          id: boolean
          max_days_ahead: number
          school_term_active: boolean
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
      apply_to_job: {
        Args: { p_job_id: string; p_message?: string }
        Returns: Database["public"]["Tables"]["job_applications"]["Row"]
        SetofOptions: { from: "*"; to: "job_applications"; isOneToOne: true; isSetofReturn: false }
      }
      get_job_details: {
        Args: { p_job_id: string }
        Returns: {
          id: string
          title: string
          description: string
          price_isk: number
          category_name: string
          safety_rules: string
          municipality_name: string
          area_label: string
          starts_at: string
          duration_minutes: number
          min_age: number
          job_status: Database["public"]["Enums"]["job_status"]
          customer_first_name: string
          customer_verified: boolean
          can_apply: boolean
          my_application_id: string | null
          my_application_status: Database["public"]["Enums"]["application_status"] | null
        }[]
      }
      get_job_feed: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          id: string
          title: string
          price_isk: number
          category_name: string
          municipality_name: string
          area_label: string
          starts_at: string
          duration_minutes: number
          has_applied: boolean
        }[]
      }
      get_my_applications: {
        Args: never
        Returns: {
          application_id: string
          application_status: Database["public"]["Enums"]["application_status"]
          applied_at: string
          job_id: string
          title: string
          price_isk: number
          municipality_name: string
          area_label: string
          starts_at: string
          duration_minutes: number
          job_status: Database["public"]["Enums"]["job_status"]
        }[]
      }
      withdraw_application: {
        Args: { p_application_id: string }
        Returns: Database["public"]["Tables"]["job_applications"]["Row"]
        SetofOptions: { from: "*"; to: "job_applications"; isOneToOne: true; isSetofReturn: false }
      }
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
      create_job: {
        Args: {
          p_address: string
          p_area_label: string
          p_category_id: number
          p_description: string
          p_duration_minutes: number
          p_min_age: number | null
          p_municipality_id: number
          p_price_isk: number
          p_safety_confirmed: boolean
          p_starts_at: string
          p_title: string
        }
        Returns: Database["public"]["Tables"]["jobs"]["Row"]
        SetofOptions: {
          from: "*"
          to: "jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: never; Returns: boolean }
      today_is: { Args: never; Returns: string }
    }
    Enums: {
      application_status: "PENDING" | "SELECTED" | "NOT_SELECTED" | "WITHDRAWN"
      job_status:
        | "DRAFT"
        | "OPEN"
        | "ASSIGNED"
        | "IN_PROGRESS"
        | "WORKER_COMPLETED"
        | "COMPLETED"
        | "REVIEWED"
        | "CANCELLED"
        | "DISPUTED"
      legal_basis: "LISTED" | "INTERPRETED"
      risk_level: "LOW" | "MEDIUM" | "HIGH"
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
      application_status: ["PENDING", "SELECTED", "NOT_SELECTED", "WITHDRAWN"],
      job_status: [
        "DRAFT",
        "OPEN",
        "ASSIGNED",
        "IN_PROGRESS",
        "WORKER_COMPLETED",
        "COMPLETED",
        "REVIEWED",
        "CANCELLED",
        "DISPUTED",
      ],
      legal_basis: ["LISTED", "INTERPRETED"],
      risk_level: ["LOW", "MEDIUM", "HIGH"],
      user_role: ["CUSTOMER", "WORKER", "ADMIN"],
      verification_status: ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"],
    },
  },
} as const
