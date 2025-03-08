
// Create all necessary tables for Pokemon TCG data
export async function createPokemonTablesIfNeeded(supabase) {
  try {
    console.log("Checking and creating Pokemon TCG tables if needed");
    
    // Try to create the pokemon_sets table
    const { error: setsError } = await supabase.from('_manual_sql').select('*').eq('statement', `
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
        images_url JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
      
      -- Create index on set_id for faster lookups
      CREATE INDEX IF NOT EXISTS idx_pokemon_sets_set_id ON public.pokemon_sets(set_id);
    `);
    
    if (setsError) {
      console.error("Error creating pokemon_sets table:", setsError);
    } else {
      console.log("pokemon_sets table exists or was created successfully");
    }
    
    // Try to create the pokemon_cards table with proper JSON storage
    const { error: cardsError } = await supabase.from('_manual_sql').select('*').eq('statement', `
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
        attacks JSONB,
        weaknesses JSONB,
        resistances JSONB,
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
        CONSTRAINT fk_pokemon_set FOREIGN KEY (set_id) REFERENCES pokemon_sets(set_id) ON DELETE CASCADE
      );
      
      -- Create index on set_id for faster queries
      CREATE INDEX IF NOT EXISTS idx_pokemon_cards_set_id ON public.pokemon_cards(set_id);
    `);
    
    if (cardsError) {
      console.error("Error creating pokemon_cards table:", cardsError);
    } else {
      console.log("pokemon_cards table exists or was created successfully");
    }
    
  } catch (error) {
    console.error("Error in createPokemonTablesIfNeeded:", error);
    throw error;
  }
}
