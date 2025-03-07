
// Import necessary Deno modules
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.1.1";

// Define environment variables (these will need to be set in Supabase)
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const pokemonApiKey = Deno.env.get("POKEMON_TCG_API_KEY") || "";
const mtgApiKey = Deno.env.get("MTG_API_KEY") || "";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Handle OPTIONS request for CORS
Deno.serve(async (req) => {
  console.log("Edge function received request:", req.method, req.url);
  
  // Add CORS headers to all responses
  const responseHeaders = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request for CORS preflight");
    return new Response(null, { headers: responseHeaders });
  }
  
  if (req.method !== "POST") {
    console.log(`Method not allowed: ${req.method}`);
    return new Response(
      JSON.stringify({ error: "Method not allowed" }), 
      {
        status: 405,
        headers: responseHeaders,
      }
    );
  }

  try {
    console.log("Parsing request body");
    const requestData = await req.json();
    console.log("Request data:", requestData);
    
    const { source } = requestData;
    
    if (!source) {
      console.log("Missing source parameter");
      return new Response(
        JSON.stringify({ error: "Missing source parameter" }),
        {
          status: 400,
          headers: responseHeaders,
        }
      );
    }

    // Call the appropriate function based on the source parameter
    console.log(`Processing request for source: ${source}`);
    switch (source) {
      case "pokemon":
        return await fetchPokemonSets(req, responseHeaders);
      case "mtg":
        return await fetchMTGSets(req, responseHeaders);
      case "yugioh":
        return await fetchYugiohSets(req, responseHeaders);
      case "lorcana":
        return await fetchLorcanaSets(req, responseHeaders);
      default:
        console.log(`Invalid source: ${source}`);
        return new Response(
          JSON.stringify({ 
            error: "Invalid source. Use 'pokemon', 'mtg', 'yugioh', or 'lorcana'" 
          }),
          {
            status: 400,
            headers: responseHeaders,
          }
        );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred",
        stack: error.stack
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});

// Function to fetch Pokémon sets
async function fetchPokemonSets(req, responseHeaders) {
  console.log("Fetching Pokémon TCG sets...");
  
  try {
    const headers = {};
    if (pokemonApiKey) {
      headers["X-Api-Key"] = pokemonApiKey;
      console.log("Using Pokemon TCG API key");
    } else {
      console.log("No Pokemon TCG API key provided");
    }

    console.log("Sending request to Pokemon TCG API");
    const response = await fetch("https://api.pokemontcg.io/v2/sets", {
      headers: pokemonApiKey ? headers : {},
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pokémon API error: ${response.status}`, errorText);
      throw new Error(`Pokémon API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`Received ${data.data?.length || 0} Pokémon sets from API`);
    
    // Process and insert sets into database
    const sets = data.data.map((set) => ({
      set_id: set.id,
      name: set.name,
      series: set.series,
      printed_total: set.printedTotal,
      total: set.total,
      release_date: set.releaseDate,
      symbol_url: set.images?.symbol,
      logo_url: set.images?.logo,
      images_url: null,
    }));

    console.log(`Processing ${sets.length} Pokémon sets for database insertion`);

    // Insert sets into database (upsert to avoid duplicates)
    const { error } = await supabase.from("pokemon_sets").upsert(sets, {
      onConflict: "set_id",
    });

    if (error) {
      console.error("Error inserting Pokémon sets:", error);
      throw error;
    }

    // Update last sync time
    await updateApiSyncTime("pokemon");
    console.log("Successfully imported and updated Pokémon sets");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully imported ${sets.length} Pokémon sets` 
      }),
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    console.error("Error fetching Pokémon sets:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred",
        details: error.stack
      }),
      {
        status: 500,
        headers: responseHeaders,
      }
    );
  }
}

// Function to fetch Magic: The Gathering sets
async function fetchMTGSets(req, responseHeaders) {
  console.log("Fetching Magic: The Gathering sets...");
  
  try {
    console.log("Sending request to MTG API");
    const response = await fetch("https://api.magicthegathering.io/v1/sets");

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`MTG API error: ${response.status}`, errorText);
      throw new Error(`MTG API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`Received ${data.sets?.length || 0} MTG sets from API`);
    
    // Process and insert sets into database
    const sets = data.sets.map((set) => ({
      set_id: set.code,
      name: set.name,
      code: set.code,
      release_date: set.releaseDate,
      set_type: set.type,
      card_count: set.cardCount,
      icon_url: set.symbolUrl,
      image_url: set.logoUrl || set.symbolUrl,
    }));

    console.log(`Processing ${sets.length} MTG sets for database insertion`);

    // Insert sets into database (upsert to avoid duplicates)
    const { error } = await supabase.from("mtg_sets").upsert(sets, {
      onConflict: "set_id",
    });

    if (error) {
      console.error("Error inserting MTG sets:", error);
      throw error;
    }

    // Update last sync time
    await updateApiSyncTime("mtg");
    console.log("Successfully imported and updated MTG sets");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully imported ${sets.length} MTG sets` 
      }),
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    console.error("Error fetching MTG sets:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred",
        details: error.stack
      }),
      {
        status: 500,
        headers: responseHeaders,
      }
    );
  }
}

// Function to fetch Yu-Gi-Oh! sets
async function fetchYugiohSets(req, responseHeaders) {
  console.log("Fetching Yu-Gi-Oh! sets...");
  
  try {
    // Yu-Gi-Oh! API doesn't have dedicated sets endpoint, so we can approximate by querying card sets
    console.log("Sending request to Yu-Gi-Oh! API");
    const response = await fetch("https://db.ygoprodeck.com/api/v7/cardsets.php");

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Yu-Gi-Oh! API error: ${response.status}`, errorText);
      throw new Error(`Yu-Gi-Oh! API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`Received ${data?.length || 0} Yu-Gi-Oh! sets from API`);
    
    // Process and insert sets into database
    const sets = data.map((set) => ({
      set_id: set.set_code,
      name: set.set_name,
      set_code: set.set_code,
      num_of_cards: set.num_of_cards || 0,
      tcg_date: set.tcg_date,
      set_image: null, // YGOPRODeck API doesn't provide set images
      set_type: set.set_type || "N/A",
    }));

    console.log(`Processing ${sets.length} Yu-Gi-Oh! sets for database insertion`);

    // Insert sets into database (upsert to avoid duplicates)
    const { error } = await supabase.from("yugioh_sets").upsert(sets, {
      onConflict: "set_id",
    });

    if (error) {
      console.error("Error inserting Yu-Gi-Oh! sets:", error);
      throw error;
    }

    // Update last sync time
    await updateApiSyncTime("yugioh");
    console.log("Successfully imported and updated Yu-Gi-Oh! sets");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully imported ${sets.length} Yu-Gi-Oh! sets` 
      }),
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    console.error("Error fetching Yu-Gi-Oh! sets:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred",
        details: error.stack
      }),
      {
        status: 500,
        headers: responseHeaders,
      }
    );
  }
}

// Function to fetch Disney Lorcana sets (this is a placeholder as there's no official Lorcana API)
async function fetchLorcanaSets(req, responseHeaders) {
  console.log("Adding Disney Lorcana sets...");
  
  try {
    // We'll manually insert some Lorcana sets since there's no official API
    const sets = [
      {
        set_id: "TFC",
        name: "The First Chapter",
        release_date: "2023-08-18",
        set_code: "TFC",
        total_cards: 204,
        set_image: "https://lorcana-api.com/images/emblems/TFC.png",
        set_type: "Main Set",
      },
      {
        set_id: "ROA",
        name: "Rise of the Floodborn",
        release_date: "2023-12-01",
        set_code: "ROA",
        total_cards: 204,
        set_image: "https://lorcana-api.com/images/emblems/ROA.png",
        set_type: "Main Set",
      },
      {
        set_id: "ITM",
        name: "Into the Inklands",
        release_date: "2024-03-08",
        set_code: "ITM",
        total_cards: 204,
        set_image: "https://lorcana-api.com/images/emblems/ITM.png",
        set_type: "Main Set",
      },
      {
        set_id: "UPR",
        name: "Ursula's Return",
        release_date: "2024-06-21",
        set_code: "UPR",
        total_cards: 204,
        set_image: "https://lorcana-api.com/images/emblems/UPR.png", 
        set_type: "Main Set",
      },
    ];

    console.log(`Processing ${sets.length} Disney Lorcana sets for database insertion`);

    // Insert sets into database (upsert to avoid duplicates)
    const { error } = await supabase.from("lorcana_sets").upsert(sets, {
      onConflict: "set_id",
    });

    if (error) {
      console.error("Error inserting Disney Lorcana sets:", error);
      throw error;
    }

    // Update last sync time
    await updateApiSyncTime("lorcana");
    console.log("Successfully added Disney Lorcana sets");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully added ${sets.length} Disney Lorcana sets` 
      }),
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    console.error("Error adding Disney Lorcana sets:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred",
        details: error.stack
      }),
      {
        status: 500,
        headers: responseHeaders,
      }
    );
  }
}

// Update the last sync time for an API
async function updateApiSyncTime(apiName) {
  console.log(`Updating last sync time for ${apiName}`);
  try {
    const { error } = await supabase.from("api_config").upsert(
      {
        api_name: apiName,
        last_sync_time: new Date().toISOString(),
      },
      {
        onConflict: "api_name",
      }
    );

    if (error) {
      console.error(`Error updating sync time for ${apiName}:`, error);
    } else {
      console.log(`Successfully updated sync time for ${apiName}`);
    }
  } catch (err) {
    console.error(`Exception updating sync time for ${apiName}:`, err);
  }
}
