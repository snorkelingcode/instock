
// Function to create RPC functions if they don't exist
export async function createRpcFunctionsIfNeeded(supabase) {
  try {
    // Try to create the table creation RPCs
    await supabase.from('_manual_sql').select('*').eq('statement', `
      CREATE OR REPLACE FUNCTION create_rate_limit_table_if_not_exists()
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.api_rate_limits (
          id SERIAL PRIMARY KEY,
          api_key TEXT UNIQUE NOT NULL,
          last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL
        );
      END;
      $$;
    `);
    
    await supabase.from('_manual_sql').select('*').eq('statement', `
      CREATE OR REPLACE FUNCTION create_job_status_table_if_not_exists()
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.api_job_status (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id TEXT UNIQUE NOT NULL,
          source TEXT NOT NULL,
          status TEXT NOT NULL,
          progress NUMERIC DEFAULT 0,
          total_items NUMERIC DEFAULT 0,
          completed_items NUMERIC DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          completed_at TIMESTAMP WITH TIME ZONE,
          error TEXT
        );
      END;
      $$;
    `);
    
    await supabase.from('_manual_sql').select('*').eq('statement', `
      CREATE OR REPLACE FUNCTION create_pokemon_cards_table_if_not_exists()
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.pokemon_cards (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          card_id TEXT UNIQUE NOT NULL,
          set_id TEXT NOT NULL,
          name TEXT NOT NULL,
          supertype TEXT,
          subtypes TEXT[],
          hp TEXT,
          types TEXT[],
          number TEXT,
          artist TEXT,
          rarity TEXT,
          small_image_url TEXT,
          large_image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          CONSTRAINT fk_set
            FOREIGN KEY(set_id)
            REFERENCES pokemon_sets(set_id)
            ON DELETE CASCADE
        );
      END;
      $$;
    `);
    
    await supabase.from('_manual_sql').select('*').eq('statement', `
      CREATE OR REPLACE FUNCTION create_mtg_cards_table_if_not_exists()
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.mtg_cards (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          card_id TEXT UNIQUE NOT NULL,
          set_id TEXT NOT NULL,
          name TEXT NOT NULL,
          mana_cost TEXT,
          cmc NUMERIC,
          type TEXT,
          rarity TEXT,
          text TEXT,
          flavor TEXT,
          artist TEXT,
          number TEXT,
          power TEXT,
          toughness TEXT,
          layout TEXT,
          image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          CONSTRAINT fk_set
            FOREIGN KEY(set_id)
            REFERENCES mtg_sets(set_id)
            ON DELETE CASCADE
        );
      END;
      $$;
    `);
    
    await supabase.from('_manual_sql').select('*').eq('statement', `
      CREATE OR REPLACE FUNCTION create_yugioh_cards_table_if_not_exists()
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.yugioh_cards (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          card_id INTEGER NOT NULL,
          set_id TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT,
          desc TEXT,
          atk INTEGER,
          def INTEGER,
          level INTEGER,
          race TEXT,
          attribute TEXT,
          image_url TEXT,
          image_url_small TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          CONSTRAINT yugioh_cards_card_id_key UNIQUE (card_id),
          CONSTRAINT fk_set
            FOREIGN KEY(set_id)
            REFERENCES yugioh_sets(set_id)
            ON DELETE CASCADE
        );
      END;
      $$;
    `);
    
    await supabase.from('_manual_sql').select('*').eq('statement', `
      CREATE OR REPLACE FUNCTION create_lorcana_cards_table_if_not_exists()
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.lorcana_cards (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          card_id TEXT UNIQUE NOT NULL,
          set_id TEXT NOT NULL,
          name TEXT NOT NULL,
          cost INTEGER,
          ink_color TEXT,
          type TEXT,
          rarity TEXT,
          inkwell INTEGER,
          strength INTEGER,
          willpower INTEGER,
          image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          CONSTRAINT fk_set
            FOREIGN KEY(set_id)
            REFERENCES lorcana_sets(set_id)
            ON DELETE CASCADE
        );
      END;
      $$;
    `);
    
    console.log("RPC functions created or updated successfully");
  } catch (error) {
    console.error("Error creating RPC functions:", error);
  }
}
