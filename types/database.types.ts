Connecting to db 5432
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      contract_terms: {
        Row: {
          calendar_reminders: Json | null
          clauses: Json
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string | null
          id: string
          project_id: string
          source_file_id: string | null
          term_length_years: number | null
        }
        Insert: {
          calendar_reminders?: Json | null
          clauses?: Json
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          id?: string
          project_id: string
          source_file_id?: string | null
          term_length_years?: number | null
        }
        Update: {
          calendar_reminders?: Json | null
          clauses?: Json
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          id?: string
          project_id?: string
          source_file_id?: string | null
          term_length_years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_terms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_terms_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
        ]
      }
      haul_log: {
        Row: {
          created_at: string | null
          days_since_last: number | null
          haul_date: string
          id: string
          invoice_id: string | null
          project_id: string
          status: string | null
          tonnage: number
        }
        Insert: {
          created_at?: string | null
          days_since_last?: number | null
          haul_date: string
          id?: string
          invoice_id?: string | null
          project_id: string
          status?: string | null
          tonnage: number
        }
        Update: {
          created_at?: string | null
          days_since_last?: number | null
          haul_date?: string
          id?: string
          invoice_id?: string | null
          project_id?: string
          status?: string | null
          tonnage?: number
        }
        Relationships: [
          {
            foreignKeyName: "haul_log_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "haul_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_data: {
        Row: {
          charges: Json | null
          created_at: string | null
          hauls: number | null
          id: string
          invoice_date: string
          invoice_number: string | null
          notes: string | null
          project_id: string
          service_type: string | null
          source_file_id: string | null
          tonnage: number | null
          total_amount: number
          vendor_name: string
        }
        Insert: {
          charges?: Json | null
          created_at?: string | null
          hauls?: number | null
          id?: string
          invoice_date: string
          invoice_number?: string | null
          notes?: string | null
          project_id: string
          service_type?: string | null
          source_file_id?: string | null
          tonnage?: number | null
          total_amount: number
          vendor_name: string
        }
        Update: {
          charges?: Json | null
          created_at?: string | null
          hauls?: number | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          notes?: string | null
          project_id?: string
          service_type?: string | null
          source_file_id?: string | null
          tonnage?: number | null
          total_amount?: number
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_data_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
        ]
      }
      optimizations: {
        Row: {
          calculation_breakdown: Json
          confidence: string | null
          contact_info: Json | null
          created_at: string | null
          description: string | null
          id: string
          implementation_timeline: string | null
          opportunity_type: string
          priority: number | null
          project_id: string
          recommend: boolean
          title: string
        }
        Insert: {
          calculation_breakdown?: Json
          confidence?: string | null
          contact_info?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          implementation_timeline?: string | null
          opportunity_type: string
          priority?: number | null
          project_id: string
          recommend?: boolean
          title: string
        }
        Update: {
          calculation_breakdown?: Json
          confidence?: string | null
          contact_info?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          implementation_timeline?: string | null
          opportunity_type?: string
          priority?: number | null
          project_id?: string
          recommend?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimizations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ordinance_database: {
        Row: {
          accepted_materials: Json | null
          capacity_requirement: string | null
          city: string
          composting_effective_date: string | null
          composting_required: boolean | null
          composting_threshold_units: number | null
          confidence: string | null
          contacts: Json | null
          created_at: string | null
          id: string
          last_verified: string | null
          licensed_haulers: Json | null
          location_key: string
          penalties: Json | null
          primary_source: string | null
          recycling_mandatory: boolean | null
          service_frequency: string | null
          state: string
          threshold_units: number | null
        }
        Insert: {
          accepted_materials?: Json | null
          capacity_requirement?: string | null
          city: string
          composting_effective_date?: string | null
          composting_required?: boolean | null
          composting_threshold_units?: number | null
          confidence?: string | null
          contacts?: Json | null
          created_at?: string | null
          id?: string
          last_verified?: string | null
          licensed_haulers?: Json | null
          location_key: string
          penalties?: Json | null
          primary_source?: string | null
          recycling_mandatory?: boolean | null
          service_frequency?: string | null
          state: string
          threshold_units?: number | null
        }
        Update: {
          accepted_materials?: Json | null
          capacity_requirement?: string | null
          city?: string
          composting_effective_date?: string | null
          composting_required?: boolean | null
          composting_threshold_units?: number | null
          confidence?: string | null
          contacts?: Json | null
          created_at?: string | null
          id?: string
          last_verified?: string | null
          licensed_haulers?: Json | null
          location_key?: string
          penalties?: Json | null
          primary_source?: string | null
          recycling_mandatory?: boolean | null
          service_frequency?: string | null
          state?: string
          threshold_units?: number | null
        }
        Relationships: []
      }
      project_files: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          mime_type: string | null
          processing_error: string | null
          processing_status: string | null
          project_id: string
          storage_path: string
          uploaded_at: string | null
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          mime_type?: string | null
          processing_error?: string | null
          processing_status?: string | null
          project_id: string
          storage_path: string
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          mime_type?: string | null
          processing_error?: string | null
          processing_status?: string | null
          project_id?: string
          storage_path?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          analysis_period_months: number | null
          city: string
          created_at: string | null
          equipment_type: string | null
          error_message: string | null
          id: string
          progress: number | null
          property_name: string
          property_type: string | null
          state: string
          status: string | null
          total_savings: number | null
          units: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_period_months?: number | null
          city: string
          created_at?: string | null
          equipment_type?: string | null
          error_message?: string | null
          id?: string
          progress?: number | null
          property_name: string
          property_type?: string | null
          state: string
          status?: string | null
          total_savings?: number | null
          units: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_period_months?: number | null
          city?: string
          created_at?: string | null
          equipment_type?: string | null
          error_message?: string | null
          id?: string
          progress?: number | null
          property_name?: string
          property_type?: string | null
          state?: string
          status?: string | null
          total_savings?: number | null
          units?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      regulatory_compliance: {
        Row: {
          cached_data: boolean | null
          city: string
          composting_requirements: Json | null
          confidence_score: string | null
          created_at: string | null
          id: string
          last_updated: string | null
          licensed_haulers: Json | null
          penalties: Json | null
          project_id: string
          recycling_requirements: Json | null
          regulatory_contacts: Json | null
          sources_consulted: Json | null
          state: string
          waste_requirements: Json | null
        }
        Insert: {
          cached_data?: boolean | null
          city: string
          composting_requirements?: Json | null
          confidence_score?: string | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          licensed_haulers?: Json | null
          penalties?: Json | null
          project_id: string
          recycling_requirements?: Json | null
          regulatory_contacts?: Json | null
          sources_consulted?: Json | null
          state: string
          waste_requirements?: Json | null
        }
        Update: {
          cached_data?: boolean | null
          city?: string
          composting_requirements?: Json | null
          confidence_score?: string | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          licensed_haulers?: Json | null
          penalties?: Json | null
          project_id?: string
          recycling_requirements?: Json | null
          regulatory_contacts?: Json | null
          sources_consulted?: Json | null
          state?: string
          waste_requirements?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_compliance_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      skills_config: {
        Row: {
          conversion_rates: Json
          created_at: string | null
          enabled: boolean | null
          id: string
          last_validated: string | null
          skill_name: string
          skill_version: string
          thresholds: Json
          updated_at: string | null
        }
        Insert: {
          conversion_rates: Json
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_validated?: string | null
          skill_name: string
          skill_version: string
          thresholds: Json
          updated_at?: string | null
        }
        Update: {
          conversion_rates?: Json
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_validated?: string | null
          skill_name?: string
          skill_version?: string
          thresholds?: Json
          updated_at?: string | null
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

A new version of Supabase CLI is available: v2.58.5 (currently installed v2.51.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
