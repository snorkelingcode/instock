
// Function to create RPC functions for database setup if needed
export async function createRpcFunctionsIfNeeded(supabase) {
  try {
    console.log("Creating RPC functions if needed...");
    
    // Function to create rate limit table
    const createRateLimitTableFn = `
      CREATE OR REPLACE FUNCTION create_rate_limit_table_if_not_exists()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.api_rate_limits (
          id SERIAL PRIMARY KEY,
          api_key TEXT UNIQUE NOT NULL,
          last_accessed TIMESTAMP WITH TIME ZONE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL
        );
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // Function to create job status table
    const createJobStatusTableFn = `
      CREATE OR REPLACE FUNCTION create_job_status_table_if_not_exists()
      RETURNS void AS $$
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
          error TEXT,
          current_chunk INT DEFAULT 0,
          chunk_size INT DEFAULT 10
        );
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // Function to create pokemon_sets table
    const createPokemonSetsTableFn = `
      CREATE OR REPLACE FUNCTION create_pokemon_sets_table_if_not_exists()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.pokemon_sets (
          id SERIAL PRIMARY KEY,
          set_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          series TEXT,
          printed_total INTEGER,
          total INTEGER,
          release_date DATE,
          symbol_url TEXT,
          logo_url TEXT,
          images_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // Function to create pokemon_cards table
    const createPokemonCardsTableFn = `
      CREATE OR REPLACE FUNCTION create_pokemon_cards_table_if_not_exists()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.pokemon_cards (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          supertype TEXT,
          subtypes TEXT[],
          hp TEXT,
          types TEXT[],
          evolves_from TEXT,
          evolves_to TEXT[],
          rules TEXT[],
          attacks JSONB[],
          weaknesses JSONB[],
          resistances JSONB[],
          retreat_cost TEXT[],
          converted_retreat_cost INTEGER,
          set_id TEXT NOT NULL,
          number TEXT,
          artist TEXT,
          rarity TEXT,
          flavor_text TEXT,
          national_pokedex_numbers INTEGER[],
          legalities JSONB,
          images JSONB,
          tcgplayer JSONB,
          cardmarket JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          CONSTRAINT fk_set FOREIGN KEY(set_id) REFERENCES pokemon_sets(set_id)
        );
        
        -- Create index on set_id for faster queries
        CREATE INDEX IF NOT EXISTS pokemon_cards_set_id_idx ON public.pokemon_cards(set_id);
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // Function to create tcg_sets table
    const createTcgSetsTableFn = `
      CREATE OR REPLACE FUNCTION create_tcg_sets_table_if_not_exists()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.tcg_sets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          series TEXT,
          printed_total INTEGER,
          total INTEGER,
          release_date DATE,
          symbol_image TEXT,
          logo_image TEXT,
          description TEXT,
          tcg_type TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // Execute the functions
    const { error: err1 } = await supabase.rpc('create_rate_limit_table_if_not_exists').catch(async () => {
      console.log("Creating rate limit table function...");
      return await supabase.sql(createRateLimitTableFn);
    });
    
    const { error: err2 } = await supabase.rpc('create_job_status_table_if_not_exists').catch(async () => {
      console.log("Creating job status table function...");
      return await supabase.sql(createJobStatusTableFn);
    });
    
    const { error: err3 } = await supabase.rpc('create_pokemon_sets_table_if_not_exists').catch(async () => {
      console.log("Creating pokemon sets table function...");
      return await supabase.sql(createPokemonSetsTableFn);
    });
    
    const { error: err4 } = await supabase.rpc('create_pokemon_cards_table_if_not_exists').catch(async () => {
      console.log("Creating pokemon cards table function...");
      return await supabase.sql(createPokemonCardsTableFn);
    });
    
    const { error: err5 } = await supabase.rpc('create_tcg_sets_table_if_not_exists').catch(async () => {
      console.log("Creating tcg sets table function...");
      return await supabase.sql(createTcgSetsTableFn);
    });
    
    if (err1 || err2 || err3 || err4 || err5) {
      console.error("Error creating RPC functions:", err1 || err2 || err3 || err4 || err5);
    } else {
      console.log("RPC functions created or already exist");
    }
  } catch (error) {
    console.error("Error in createRpcFunctionsIfNeeded:", error);
  }
}
