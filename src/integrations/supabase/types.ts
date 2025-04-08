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
      article_comments: {
        Row: {
          article_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          article_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          article_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          additional_images: string[] | null
          author_id: string
          category: string
          content: string
          created_at: string
          excerpt: string
          featured: boolean
          featured_image: string | null
          featured_video: string | null
          id: string
          media_type: string | null
          published: boolean
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          additional_images?: string[] | null
          author_id: string
          category: string
          content: string
          created_at?: string
          excerpt: string
          featured?: boolean
          featured_image?: string | null
          featured_video?: string | null
          id?: string
          media_type?: string | null
          published?: boolean
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          additional_images?: string[] | null
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          featured?: boolean
          featured_image?: string | null
          featured_video?: string | null
          id?: string
          media_type?: string | null
          published?: boolean
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "article_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_comment_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_comment_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_replies_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "article_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reports: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "article_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          payload: Json | null
          result_summary: Json | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type: string
          payload?: Json | null
          result_summary?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          payload?: Json | null
          result_summary?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
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
      market_data: {
        Row: {
          card_image: string | null
          card_name: string
          card_set: string | null
          certification_number: string | null
          created_at: string | null
          franchise: string | null
          grading_service: string
          id: string
          language: string | null
          market_cap: number | null
          population_1: number | null
          population_10: number | null
          population_2: number | null
          population_3: number | null
          population_4: number | null
          population_5: number | null
          population_6: number | null
          population_7: number | null
          population_8: number | null
          population_9: number | null
          population_auth: number | null
          price_1: number | null
          price_10: number | null
          price_2: number | null
          price_3: number | null
          price_4: number | null
          price_5: number | null
          price_6: number | null
          price_7: number | null
          price_8: number | null
          price_9: number | null
          price_auth: number | null
          series: string | null
          total_population: number | null
          updated_at: string | null
          year: string | null
        }
        Insert: {
          card_image?: string | null
          card_name: string
          card_set?: string | null
          certification_number?: string | null
          created_at?: string | null
          franchise?: string | null
          grading_service: string
          id?: string
          language?: string | null
          market_cap?: number | null
          population_1?: number | null
          population_10?: number | null
          population_2?: number | null
          population_3?: number | null
          population_4?: number | null
          population_5?: number | null
          population_6?: number | null
          population_7?: number | null
          population_8?: number | null
          population_9?: number | null
          population_auth?: number | null
          price_1?: number | null
          price_10?: number | null
          price_2?: number | null
          price_3?: number | null
          price_4?: number | null
          price_5?: number | null
          price_6?: number | null
          price_7?: number | null
          price_8?: number | null
          price_9?: number | null
          price_auth?: number | null
          series?: string | null
          total_population?: number | null
          updated_at?: string | null
          year?: string | null
        }
        Update: {
          card_image?: string | null
          card_name?: string
          card_set?: string | null
          certification_number?: string | null
          created_at?: string | null
          franchise?: string | null
          grading_service?: string
          id?: string
          language?: string | null
          market_cap?: number | null
          population_1?: number | null
          population_10?: number | null
          population_2?: number | null
          population_3?: number | null
          population_4?: number | null
          population_5?: number | null
          population_6?: number | null
          population_7?: number | null
          population_8?: number | null
          population_9?: number | null
          population_auth?: number | null
          price_1?: number | null
          price_10?: number | null
          price_2?: number | null
          price_3?: number | null
          price_4?: number | null
          price_5?: number | null
          price_6?: number | null
          price_7?: number | null
          price_8?: number | null
          price_9?: number | null
          price_auth?: number | null
          series?: string | null
          total_population?: number | null
          updated_at?: string | null
          year?: string | null
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
      pokemon_recent_releases: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          logo_url: string | null
          name: string
          popularity: number | null
          release_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          logo_url?: string | null
          name: string
          popularity?: number | null
          release_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          logo_url?: string | null
          name?: string
          popularity?: number | null
          release_date?: string
          updated_at?: string
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
      pokemon_upcoming_releases: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          release_date: string
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          release_date: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          release_date?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          featured: boolean | null
          id: number
          image_link: string | null
          in_stock: boolean | null
          last_seen_in_stock: string | null
          listing_link: string
          msrp: number | null
          price: number
          product: string
          product_line: string
          source: string
        }
        Insert: {
          featured?: boolean | null
          id?: number
          image_link?: string | null
          in_stock?: boolean | null
          last_seen_in_stock?: string | null
          listing_link: string
          msrp?: number | null
          price: number
          product: string
          product_line: string
          source: string
        }
        Update: {
          featured?: boolean | null
          id?: number
          image_link?: string | null
          in_stock?: boolean | null
          last_seen_in_stock?: string | null
          listing_link?: string
          msrp?: number | null
          price?: number
          product?: string
          product_line?: string
          source?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachment_urls: string[] | null
          body: string
          created_at: string
          html_body: string | null
          id: string
          read_at: string | null
          recipient: string
          sender_email: string
          sender_name: string | null
          status: Database["public"]["Enums"]["message_status"]
          subject: string
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          attachment_urls?: string[] | null
          body: string
          created_at?: string
          html_body?: string | null
          id?: string
          read_at?: string | null
          recipient: string
          sender_email: string
          sender_name?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          subject: string
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          attachment_urls?: string[] | null
          body?: string
          created_at?: string
          html_body?: string | null
          id?: string
          read_at?: string | null
          recipient?: string
          sender_email?: string
          sender_name?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      support_responses: {
        Row: {
          attachment_urls: string[] | null
          body: string
          delivery_status: string | null
          html_body: string | null
          id: string
          message_id: string
          sent_at: string
          sent_by: string
        }
        Insert: {
          attachment_urls?: string[] | null
          body: string
          delivery_status?: string | null
          html_body?: string | null
          id?: string
          message_id: string
          sent_at?: string
          sent_by: string
        }
        Update: {
          attachment_urls?: string[] | null
          body?: string
          delivery_status?: string | null
          html_body?: string | null
          id?: string
          message_id?: string
          sent_at?: string
          sent_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_responses_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "support_messages"
            referencedColumns: ["id"]
          },
        ]
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
      threed_models: {
        Row: {
          category: Database["public"]["Enums"]["model_category"]
          created_at: string
          customizable: boolean
          default_options: Json
          description: string | null
          id: string
          name: string
          stl_file_path: string
          thumbnail_path: string | null
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["model_category"]
          created_at?: string
          customizable?: boolean
          default_options?: Json
          description?: string | null
          id?: string
          name: string
          stl_file_path: string
          thumbnail_path?: string | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["model_category"]
          created_at?: string
          customizable?: boolean
          default_options?: Json
          description?: string | null
          id?: string
          name?: string
          stl_file_path?: string
          thumbnail_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_customizations: {
        Row: {
          created_at: string
          customization_options: Json
          id: string
          model_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customization_options?: Json
          id?: string
          model_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customization_options?: Json
          id?: string
          model_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_customizations_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "threed_models"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
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
      create_article: {
        Args: { article_data: Json }
        Returns: string
      }
      create_sync_job: {
        Args: { job_details: Json }
        Returns: string
      }
      get_active_jobs_for_user: {
        Args: { user_id_param: string }
        Returns: {
          id: string
          job_type: string
          status: string
          created_at: string
          updated_at: string
          completed_at: string
          error_message: string
          user_id: string
          result_summary: Json
        }[]
      }
      get_all_articles: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          title: string
          content: string
          excerpt: string
          author_id: string
          category: string
          featured: boolean
          published: boolean
          featured_image: string
          featured_video: string
          media_type: string
          additional_images: string[]
          created_at: string
          updated_at: string
          published_at: string
        }[]
      }
      get_article_by_id: {
        Args: { article_id: string }
        Returns: {
          id: string
          title: string
          content: string
          excerpt: string
          author_id: string
          category: string
          featured: boolean
          published: boolean
          featured_image: string
          featured_video: string
          media_type: string
          additional_images: string[]
          created_at: string
          updated_at: string
          published_at: string
        }[]
      }
      get_comment_details: {
        Args: { article_id_param: string }
        Returns: {
          id: string
          content: string
          created_at: string
          user_id: string
          display_name: string
          likes_count: number
          replies_count: number
        }[]
      }
      get_featured_article: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          title: string
          content: string
          excerpt: string
          author_id: string
          category: string
          featured: boolean
          published: boolean
          featured_image: string
          featured_video: string
          media_type: string
          additional_images: string[]
          created_at: string
          updated_at: string
          published_at: string
        }[]
      }
      get_job_by_id: {
        Args: { job_id: string }
        Returns: {
          id: string
          job_type: string
          status: string
          created_at: string
          updated_at: string
          completed_at: string
          error_message: string
          user_id: string
          result_summary: Json
          payload: Json
        }[]
      }
      get_latest_articles: {
        Args: { limit_count?: number }
        Returns: {
          id: string
          title: string
          content: string
          excerpt: string
          author_id: string
          category: string
          featured: boolean
          published: boolean
          featured_image: string
          featured_video: string
          media_type: string
          additional_images: string[]
          created_at: string
          updated_at: string
          published_at: string
        }[]
      }
      get_published_articles: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          title: string
          content: string
          excerpt: string
          author_id: string
          category: string
          featured: boolean
          published: boolean
          featured_image: string
          featured_video: string
          media_type: string
          additional_images: string[]
          created_at: string
          updated_at: string
          published_at: string
        }[]
      }
      get_support_messages: {
        Args: {
          _status?: Database["public"]["Enums"]["message_status"]
          _recipient?: string
          _limit?: number
          _offset?: number
        }
        Returns: {
          id: string
          subject: string
          body: string
          html_body: string
          sender_email: string
          sender_name: string
          recipient: string
          status: Database["public"]["Enums"]["message_status"]
          thread_id: string
          created_at: string
          updated_at: string
          read_at: string
          attachment_urls: string[]
          response_count: number
        }[]
      }
      get_user_display_name: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_user_display_names: {
        Args: { user_ids: string[] }
        Returns: {
          id: string
          display_user_id: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
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
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      update_article: {
        Args: { article_id: string; article_data: Json }
        Returns: undefined
      }
      update_job_status: {
        Args: {
          job_id: string
          new_status: string
          error_msg?: string
          result?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      message_status: "new" | "read" | "replied" | "archived"
      model_category: "display" | "holder" | "marker" | "promotional" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      message_status: ["new", "read", "replied", "archived"],
      model_category: ["display", "holder", "marker", "promotional", "other"],
    },
  },
} as const
