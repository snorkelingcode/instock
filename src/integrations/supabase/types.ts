export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_config: {
        Row: {
          api_name: string
          created_at: string | null
          id: number
          last_sync_time: string | null
          sync_frequency: string | null
        }
        Insert: {
          api_name: string
          created_at?: string | null
          id?: number
          last_sync_time?: string | null
          sync_frequency?: string | null
        }
        Update: {
          api_name?: string
          created_at?: string | null
          id?: number
          last_sync_time?: string | null
          sync_frequency?: string | null
        }
        Relationships: []
      }
      api_job_status: {
        Row: {
          completed_at: string | null
          completed_items: number | null
          created_at: string | null
          error: string | null
          id: string
          job_id: string
          progress: number | null
          source: string
          status: string
          total_items: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_items?: number | null
          created_at?: string | null
          error?: string | null
          id?: string
          job_id: string
          progress?: number | null
          source: string
          status: string
          total_items?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_items?: number | null
          created_at?: string | null
          error?: string | null
          id?: string
          job_id?: string
          progress?: number | null
          source?: string
          status?: string
          total_items?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lorcana_sets: {
        Row: {
          created_at: string | null
          id: number
          name: string
          release_date: string | null
          set_code: string | null
          set_id: string
          set_image: string | null
          set_type: string | null
          total_cards: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          release_date?: string | null
          set_code?: string | null
          set_id: string
          set_image?: string | null
          set_type?: string | null
          total_cards?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          release_date?: string | null
          set_code?: string | null
          set_id?: string
          set_image?: string | null
          set_type?: string | null
          total_cards?: number | null
        }
        Relationships: []
      }
      mtg_sets: {
        Row: {
          card_count: number | null
          code: string | null
          created_at: string | null
          icon_url: string | null
          id: number
          image_url: string | null
          name: string
          release_date: string | null
          set_id: string
          set_type: string | null
        }
        Insert: {
          card_count?: number | null
          code?: string | null
          created_at?: string | null
          icon_url?: string | null
          id?: number
          image_url?: string | null
          name: string
          release_date?: string | null
          set_id: string
          set_type?: string | null
        }
        Update: {
          card_count?: number | null
          code?: string | null
          created_at?: string | null
          icon_url?: string | null
          id?: number
          image_url?: string | null
          name?: string
          release_date?: string | null
          set_id?: string
          set_type?: string | null
        }
        Relationships: []
      }
      pokemon_sets: {
        Row: {
          created_at: string | null
          id: number
          images_url: string | null
          logo_url: string | null
          name: string
          printed_total: number | null
          release_date: string | null
          series: string | null
          set_id: string
          symbol_url: string | null
          total: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          images_url?: string | null
          logo_url?: string | null
          name: string
          printed_total?: number | null
          release_date?: string | null
          series?: string | null
          set_id: string
          symbol_url?: string | null
          total?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          images_url?: string | null
          logo_url?: string | null
          name?: string
          printed_total?: number | null
          release_date?: string | null
          series?: string | null
          set_id?: string
          symbol_url?: string | null
          total?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          id: number
          image_link: string | null
          listing_link: string
          price: number
          product: string
          product_line: string
          source: string
        }
        Insert: {
          id?: number
          image_link?: string | null
          listing_link: string
          price: number
          product: string
          product_line: string
          source: string
        }
        Update: {
          id?: number
          image_link?: string | null
          listing_link?: string
          price?: number
          product?: string
          product_line?: string
          source?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      yugioh_sets: {
        Row: {
          created_at: string | null
          id: number
          name: string
          num_of_cards: number | null
          set_code: string | null
          set_id: string
          set_image: string | null
          set_type: string | null
          tcg_date: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          num_of_cards?: number | null
          set_code?: string | null
          set_id: string
          set_image?: string | null
          set_type?: string | null
          tcg_date?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          num_of_cards?: number | null
          set_code?: string | null
          set_id?: string
          set_image?: string | null
          set_type?: string | null
          tcg_date?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          "": string
        }
        Returns: string[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
