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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          created_at: string
          criar: boolean
          editar: boolean
          excluir: boolean
          id: string
          permission_type: string
          role_id: string
          ver: boolean
        }
        Insert: {
          created_at?: string
          criar?: boolean
          editar?: boolean
          excluir?: boolean
          id?: string
          permission_type: string
          role_id: string
          ver?: boolean
        }
        Update: {
          created_at?: string
          criar?: boolean
          editar?: boolean
          excluir?: boolean
          id?: string
          permission_type?: string
          role_id?: string
          ver?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "admin_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_integrations: {
        Row: {
          auth_token: string | null
          auth_type: string
          base_url: string | null
          created_at: string
          description: string | null
          headers_json: Json | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          auth_token?: string | null
          auth_type?: string
          base_url?: string | null
          created_at?: string
          description?: string | null
          headers_json?: Json | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          auth_token?: string | null
          auth_type?: string
          base_url?: string | null
          created_at?: string
          description?: string | null
          headers_json?: Json | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_test_logs: {
        Row: {
          created_at: string
          endpoint: string
          execution_time_ms: number | null
          id: string
          method: string
          request_body: Json | null
          request_headers: Json | null
          response_body: Json | null
          response_headers: Json | null
          response_status: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          execution_time_ms?: number | null
          id?: string
          method?: string
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: Json | null
          response_headers?: Json | null
          response_status?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          execution_time_ms?: number | null
          id?: string
          method?: string
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: Json | null
          response_headers?: Json | null
          response_status?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      bi_api_integrations: {
        Row: {
          api_integration_id: string
          bi_page_id: string
          created_at: string
          id: string
        }
        Insert: {
          api_integration_id: string
          bi_page_id: string
          created_at?: string
          id?: string
        }
        Update: {
          api_integration_id?: string
          bi_page_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bi_api_integrations_api_integration_id_fkey"
            columns: ["api_integration_id"]
            isOneToOne: false
            referencedRelation: "api_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      bi_chart_config: {
        Row: {
          aggregation_type: string | null
          api_endpoint: string | null
          bi_page_id: string
          chart_position: string
          chart_type: string
          created_at: string
          field_mappings: Json | null
          filters: Json | null
          id: string
          label: string | null
          updated_at: string
        }
        Insert: {
          aggregation_type?: string | null
          api_endpoint?: string | null
          bi_page_id: string
          chart_position?: string
          chart_type?: string
          created_at?: string
          field_mappings?: Json | null
          filters?: Json | null
          id?: string
          label?: string | null
          updated_at?: string
        }
        Update: {
          aggregation_type?: string | null
          api_endpoint?: string | null
          bi_page_id?: string
          chart_position?: string
          chart_type?: string
          created_at?: string
          field_mappings?: Json | null
          filters?: Json | null
          id?: string
          label?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bi_settings: {
        Row: {
          cod_cli: string | null
          company_name: string | null
          created_at: string
          display_name: string
          display_order: number
          id: string
          logo_url: string | null
          page_id: string
          updated_at: string
        }
        Insert: {
          cod_cli?: string | null
          company_name?: string | null
          created_at?: string
          display_name: string
          display_order?: number
          id?: string
          logo_url?: string | null
          page_id: string
          updated_at?: string
        }
        Update: {
          cod_cli?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string
          display_order?: number
          id?: string
          logo_url?: string | null
          page_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      city_regional_mapping: {
        Row: {
          cidade: string
          created_at: string
          id: string
          regional: string
          uf: string
          updated_at: string
        }
        Insert: {
          cidade: string
          created_at?: string
          id?: string
          regional: string
          uf: string
          updated_at?: string
        }
        Update: {
          cidade?: string
          created_at?: string
          id?: string
          regional?: string
          uf?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          ativo: boolean
          cod_cli: string
          created_at: string
          descricao: string | null
          id: string
          logo_url: string | null
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cod_cli: string
          created_at?: string
          descricao?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cod_cli?: string
          created_at?: string
          descricao?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_permissions: {
        Row: {
          apenas_dev: boolean
          atualizar: boolean
          created_at: string
          exportar: boolean
          id: string
          page_id: string
          role_id: string
          visualizar: boolean
        }
        Insert: {
          apenas_dev?: boolean
          atualizar?: boolean
          created_at?: string
          exportar?: boolean
          id?: string
          page_id: string
          role_id: string
          visualizar?: boolean
        }
        Update: {
          apenas_dev?: boolean
          atualizar?: boolean
          created_at?: string
          exportar?: boolean
          id?: string
          page_id?: string
          role_id?: string
          visualizar?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "page_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          is_developer: boolean
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id: string
          is_developer?: boolean
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          is_developer?: boolean
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      public_page_settings: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          page_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          page_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          page_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_kit_config: {
        Row: {
          created_at: string
          id: string
          kit_quantity: number
          sku_code: string
          sku_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kit_quantity?: number
          sku_code: string
          sku_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kit_quantity?: number
          sku_code?: string
          sku_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_product_whitelist: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          product_code: string
          product_name: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          product_code: string
          product_name?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          product_code?: string
          product_name?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role_ids: { Args: { user_uuid: string }; Returns: string[] }
      has_admin_permission: {
        Args: { action: string; perm_type: string; user_uuid: string }
        Returns: boolean
      }
      is_admin_user: { Args: { user_uuid: string }; Returns: boolean }
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
