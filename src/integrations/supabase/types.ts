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
      lorcana_cards: {
        Row: {
          card_id: string
          card_text: string | null
          card_type: string | null
          classifications: string[] | null
          color: string | null
          created_at: string | null
          flavor_text: string | null
          id: number
          illustrator: string | null
          image_url: string | null
          ink_cost: number | null
          name: string
          number: string | null
          price_data: Json | null
          rarity: string | null
          set_id: string | null
          strength: number | null
          sub_type: string | null
          title: string | null
          updated_at: string | null
          willpower: number | null
        }
        Insert: {
          card_id: string
          card_text?: string | null
          card_type?: string | null
          classifications?: string[] | null
          color?: string | null
          created_at?: string | null
          flavor_text?: string | null
          id?: number
          illustrator?: string | null
          image_url?: string | null
          ink_cost?: number | null
          name: string
          number?: string | null
          price_data?: Json | null
          rarity?: string | null
          set_id?: string | null
          strength?: number | null
          sub_type?: string | null
          title?: string | null
          updated_at?: string | null
          willpower?: number | null
        }
        Update: {
          card_id?: string
          card_text?: string | null
          card_type?: string | null
          classifications?: string[] | null
          color?: string | null
          created_at?: string | null
          flavor_text?: string | null
          id?: number
          illustrator?: string | null
          image_url?: string | null
          ink_cost?: number | null
          name?: string
          number?: string | null
          price_data?: Json | null
          rarity?: string | null
          set_id?: string | null
          strength?: number | null
          sub_type?: string | null
          title?: string | null
          updated_at?: string | null
          willpower?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lorcana_cards_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "lorcana_sets"
            referencedColumns: ["set_id"]
          },
        ]
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
      mtg_cards: {
        Row: {
          artist: string | null
          artist_ids: string[] | null
          booster: boolean | null
          border_color: string | null
          card_back_id: string | null
          card_id: string
          cmc: number | null
          collector_number: string | null
          color_identity: string[] | null
          colors: string[] | null
          created_at: string | null
          digital: boolean | null
          finishes: string[] | null
          flavor_text: string | null
          foil: boolean | null
          frame: string | null
          full_art: boolean | null
          games: string[] | null
          id: number
          illustration_id: string | null
          image_uris: Json | null
          keywords: string[] | null
          lang: string | null
          layout: string | null
          legalities: Json | null
          mana_cost: string | null
          name: string
          nonfoil: boolean | null
          oracle_text: string | null
          oversized: boolean | null
          prices: Json | null
          printed_name: string | null
          prints_search_uri: string | null
          promo: boolean | null
          purchase_uris: Json | null
          rarity: string | null
          related_uris: Json | null
          released_at: string | null
          reprint: boolean | null
          reserved: boolean | null
          rulings_uri: string | null
          scryfall_uri: string | null
          set_id: string | null
          set_name: string | null
          set_search_uri: string | null
          set_type: string | null
          set_uri: string | null
          story_spotlight: boolean | null
          textless: boolean | null
          type_line: string | null
          updated_at: string | null
          variation: boolean | null
        }
        Insert: {
          artist?: string | null
          artist_ids?: string[] | null
          booster?: boolean | null
          border_color?: string | null
          card_back_id?: string | null
          card_id: string
          cmc?: number | null
          collector_number?: string | null
          color_identity?: string[] | null
          colors?: string[] | null
          created_at?: string | null
          digital?: boolean | null
          finishes?: string[] | null
          flavor_text?: string | null
          foil?: boolean | null
          frame?: string | null
          full_art?: boolean | null
          games?: string[] | null
          id?: number
          illustration_id?: string | null
          image_uris?: Json | null
          keywords?: string[] | null
          lang?: string | null
          layout?: string | null
          legalities?: Json | null
          mana_cost?: string | null
          name: string
          nonfoil?: boolean | null
          oracle_text?: string | null
          oversized?: boolean | null
          prices?: Json | null
          printed_name?: string | null
          prints_search_uri?: string | null
          promo?: boolean | null
          purchase_uris?: Json | null
          rarity?: string | null
          related_uris?: Json | null
          released_at?: string | null
          reprint?: boolean | null
          reserved?: boolean | null
          rulings_uri?: string | null
          scryfall_uri?: string | null
          set_id?: string | null
          set_name?: string | null
          set_search_uri?: string | null
          set_type?: string | null
          set_uri?: string | null
          story_spotlight?: boolean | null
          textless?: boolean | null
          type_line?: string | null
          updated_at?: string | null
          variation?: boolean | null
        }
        Update: {
          artist?: string | null
          artist_ids?: string[] | null
          booster?: boolean | null
          border_color?: string | null
          card_back_id?: string | null
          card_id?: string
          cmc?: number | null
          collector_number?: string | null
          color_identity?: string[] | null
          colors?: string[] | null
          created_at?: string | null
          digital?: boolean | null
          finishes?: string[] | null
          flavor_text?: string | null
          foil?: boolean | null
          frame?: string | null
          full_art?: boolean | null
          games?: string[] | null
          id?: number
          illustration_id?: string | null
          image_uris?: Json | null
          keywords?: string[] | null
          lang?: string | null
          layout?: string | null
          legalities?: Json | null
          mana_cost?: string | null
          name?: string
          nonfoil?: boolean | null
          oracle_text?: string | null
          oversized?: boolean | null
          prices?: Json | null
          printed_name?: string | null
          prints_search_uri?: string | null
          promo?: boolean | null
          purchase_uris?: Json | null
          rarity?: string | null
          related_uris?: Json | null
          released_at?: string | null
          reprint?: boolean | null
          reserved?: boolean | null
          rulings_uri?: string | null
          scryfall_uri?: string | null
          set_id?: string | null
          set_name?: string | null
          set_search_uri?: string | null
          set_type?: string | null
          set_uri?: string | null
          story_spotlight?: boolean | null
          textless?: boolean | null
          type_line?: string | null
          updated_at?: string | null
          variation?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "mtg_cards_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "mtg_sets"
            referencedColumns: ["set_id"]
          },
        ]
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
      pokemon_cards: {
        Row: {
          artist: string | null
          attacks: Json | null
          card_id: string
          cardmarket: Json | null
          converted_retreat_cost: number | null
          created_at: string | null
          evolves_from: string | null
          evolves_to: string[] | null
          flavor_text: string | null
          hp: string | null
          id: number
          images: Json | null
          legalities: Json | null
          name: string
          national_pokedex_numbers: number[] | null
          number: string | null
          rarity: string | null
          resistances: Json | null
          retreat_cost: string[] | null
          rules: string[] | null
          set_id: string | null
          subtypes: string[] | null
          supertype: string | null
          tcgplayer: Json | null
          types: string[] | null
          updated_at: string | null
          weaknesses: Json | null
        }
        Insert: {
          artist?: string | null
          attacks?: Json | null
          card_id: string
          cardmarket?: Json | null
          converted_retreat_cost?: number | null
          created_at?: string | null
          evolves_from?: string | null
          evolves_to?: string[] | null
          flavor_text?: string | null
          hp?: string | null
          id?: number
          images?: Json | null
          legalities?: Json | null
          name: string
          national_pokedex_numbers?: number[] | null
          number?: string | null
          rarity?: string | null
          resistances?: Json | null
          retreat_cost?: string[] | null
          rules?: string[] | null
          set_id?: string | null
          subtypes?: string[] | null
          supertype?: string | null
          tcgplayer?: Json | null
          types?: string[] | null
          updated_at?: string | null
          weaknesses?: Json | null
        }
        Update: {
          artist?: string | null
          attacks?: Json | null
          card_id?: string
          cardmarket?: Json | null
          converted_retreat_cost?: number | null
          created_at?: string | null
          evolves_from?: string | null
          evolves_to?: string[] | null
          flavor_text?: string | null
          hp?: string | null
          id?: number
          images?: Json | null
          legalities?: Json | null
          name?: string
          national_pokedex_numbers?: number[] | null
          number?: string | null
          rarity?: string | null
          resistances?: Json | null
          retreat_cost?: string[] | null
          rules?: string[] | null
          set_id?: string | null
          subtypes?: string[] | null
          supertype?: string | null
          tcgplayer?: Json | null
          types?: string[] | null
          updated_at?: string | null
          weaknesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pokemon_cards_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "pokemon_sets"
            referencedColumns: ["set_id"]
          },
        ]
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
      tcg_download_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error: string | null
          game: string
          id: string
          job_type: string
          processed_items: number | null
          status: string | null
          total_items: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          game: string
          id: string
          job_type: string
          processed_items?: number | null
          status?: string | null
          total_items?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          game?: string
          id?: string
          job_type?: string
          processed_items?: number | null
          status?: string | null
          total_items?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tcg_image_downloads: {
        Row: {
          card_id: string
          downloaded_at: string | null
          game: string
          id: number
          image_type: string
          original_url: string
          status: string | null
          storage_path: string
        }
        Insert: {
          card_id: string
          downloaded_at?: string | null
          game: string
          id?: number
          image_type: string
          original_url: string
          status?: string | null
          storage_path: string
        }
        Update: {
          card_id?: string
          downloaded_at?: string | null
          game?: string
          id?: number
          image_type?: string
          original_url?: string
          status?: string | null
          storage_path?: string
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
      yugioh_cards: {
        Row: {
          archetype: string | null
          atk: number | null
          attribute: string | null
          banlist_info: Json | null
          card_id: string
          card_images: Json | null
          card_prices: Json | null
          card_sets: Json | null
          card_type: string | null
          created_at: string | null
          def: number | null
          description: string | null
          id: number
          level: number | null
          linkmarkers: string[] | null
          linkval: number | null
          name: string
          race: string | null
          scale: number | null
          set_code: string | null
          set_id: string | null
          set_name: string | null
          set_price: string | null
          set_rarity: string | null
          set_rarity_code: string | null
          updated_at: string | null
        }
        Insert: {
          archetype?: string | null
          atk?: number | null
          attribute?: string | null
          banlist_info?: Json | null
          card_id: string
          card_images?: Json | null
          card_prices?: Json | null
          card_sets?: Json | null
          card_type?: string | null
          created_at?: string | null
          def?: number | null
          description?: string | null
          id?: number
          level?: number | null
          linkmarkers?: string[] | null
          linkval?: number | null
          name: string
          race?: string | null
          scale?: number | null
          set_code?: string | null
          set_id?: string | null
          set_name?: string | null
          set_price?: string | null
          set_rarity?: string | null
          set_rarity_code?: string | null
          updated_at?: string | null
        }
        Update: {
          archetype?: string | null
          atk?: number | null
          attribute?: string | null
          banlist_info?: Json | null
          card_id?: string
          card_images?: Json | null
          card_prices?: Json | null
          card_sets?: Json | null
          card_type?: string | null
          created_at?: string | null
          def?: number | null
          description?: string | null
          id?: number
          level?: number | null
          linkmarkers?: string[] | null
          linkval?: number | null
          name?: string
          race?: string | null
          scale?: number | null
          set_code?: string | null
          set_id?: string | null
          set_name?: string | null
          set_price?: string | null
          set_rarity?: string | null
          set_rarity_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "yugioh_cards_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "yugioh_sets"
            referencedColumns: ["set_id"]
          },
        ]
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
