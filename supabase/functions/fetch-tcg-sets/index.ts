
// Import necessary modules
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.1.1";
import { corsHeaders, handleRequest } from "./utils.ts";
import { createRpcFunctionsIfNeeded } from "../db-setup.ts";

// Define environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Main edge function handler
Deno.serve(async (req) => {
  console.log("Edge function received request:", req.method, req.url);
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request for CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== "POST") {
    console.log(`Method not allowed: ${req.method}`);
    return new Response(
      JSON.stringify({ error: "Method not allowed" }), 
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Try to create RPC functions if needed
    await createRpcFunctionsIfNeeded(supabase);
    
    // Check if tcg_sets table exists, create it if not
    await createTcgSetsTableIfNeeded();
    
    // Check if pokemon_cards table exists, create it if not
    await createPokemonCardsTableIfNeeded();
    
    // Handle the main request processing
    return await handleRequest(req, supabase);
  } catch (error) {
    console.error("Unhandled error in edge function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred",
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Function to ensure tcg_sets table exists
async function createTcgSetsTableIfNeeded() {
  try {
    console.log("Checking if tcg_sets table exists");
    
    const { error } = await supabase.rpc("create_tcg_sets_table_if_not_exists").catch(e => {
      console.log("Tcg sets table creation RPC error (may attempt SQL):", e);
      
      // Try direct SQL if RPC fails
      return supabase.from('_manual_sql').select('*').eq('statement', `
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
      `);
    });
    
    if (error) {
      console.error("Error creating tcg_sets table:", error);
    } else {
      console.log("Tcg_sets table exists or was created successfully");
    }
  } catch (error) {
    console.error("Exception in createTcgSetsTableIfNeeded:", error);
  }
}

// Function to ensure pokemon_cards table exists
async function createPokemonCardsTableIfNeeded() {
  try {
    console.log("Checking if pokemon_cards table exists");
    
    const { error } = await supabase.rpc("create_pokemon_cards_table_if_not_exists").catch(e => {
      console.log("Pokemon cards table creation RPC error (may attempt SQL):", e);
      
      // Try direct SQL if RPC fails
      return supabase.from('_manual_sql').select('*').eq('statement', `
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
          CONSTRAINT fk_set FOREIGN KEY(set_id) REFERENCES pokemon_sets(set_id)
        );
        
        -- Create index on set_id for faster queries
        CREATE INDEX IF NOT EXISTS pokemon_cards_set_id_idx ON public.pokemon_cards(set_id);
      `);
    });
    
    if (error) {
      console.error("Error creating pokemon_cards table:", error);
    } else {
      console.log("Pokemon_cards table exists or was created successfully");
    }
  } catch (error) {
    console.error("Exception in createPokemonCardsTableIfNeeded:", error);
  }
}
