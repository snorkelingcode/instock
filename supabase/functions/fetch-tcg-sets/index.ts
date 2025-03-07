
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

// Function to download and upload an image to Supabase storage
async function storeImageInSupabase(imageUrl, category, filename) {
  if (!imageUrl) return null;
  
  try {
    console.log(`Downloading image from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      console.error(`Failed to download image: ${imageUrl}, status: ${imageResponse.status}`);
      return imageUrl; // Fallback to original URL on error
    }
    
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = new Uint8Array(imageArrayBuffer);
    
    // Create a unique path in the storage bucket
    const storagePath = `${category}/${filename}`;
    console.log(`Uploading image to path: ${storagePath}`);
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('tcg-images')
      .upload(storagePath, imageBuffer, {
        contentType: imageResponse.headers.get('content-type') || 'image/jpeg',
        upsert: true
      });
    
    if (uploadError) {
      console.error(`Error uploading image to Supabase:`, uploadError);
      return imageUrl; // Fallback to original URL on error
    }
    
    // Get the public URL for the uploaded image
    const { data: { publicUrl } } = supabase
      .storage
      .from('tcg-images')
      .getPublicUrl(storagePath);
    
    console.log(`Image uploaded successfully to: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`Error storing image:`, error);
    return imageUrl; // Fallback to original URL on error
  }
}

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
    
    // Process sets and store images in Supabase Storage
    const sets = [];
    for (const set of data.data) {
      console.log(`Processing set: ${set.id} - ${set.name}`);
      
      // Store set images in Supabase Storage
      const symbolUrl = await storeImageInSupabase(
        set.images?.symbol, 
        'pokemon/symbols', 
        `${set.id}_symbol.png`
      );
      
      const logoUrl = await storeImageInSupabase(
        set.images?.logo, 
        'pokemon/logos', 
        `${set.id}_logo.png`
      );
      
      sets.push({
        set_id: set.id,
        name: set.name,
        series: set.series,
        printed_total: set.printedTotal,
        total: set.total,
        release_date: set.releaseDate,
        symbol_url: symbolUrl,
        logo_url: logoUrl,
        images_url: null,
      });
    }

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
        message: `Successfully imported ${sets.length} Pokémon sets with locally stored images` 
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
    
    // Process sets and store images in Supabase Storage
    const sets = [];
    for (const set of data.sets) {
      console.log(`Processing set: ${set.code} - ${set.name}`);
      
      // Store set images in Supabase Storage
      const symbolUrl = await storeImageInSupabase(
        set.symbolUrl, 
        'mtg/symbols', 
        `${set.code}_symbol.png`
      );
      
      const logoUrl = await storeImageInSupabase(
        set.logoUrl || set.symbolUrl, 
        'mtg/logos', 
        `${set.code}_logo.png`
      );
      
      sets.push({
        set_id: set.code,
        name: set.name,
        code: set.code,
        release_date: set.releaseDate,
        set_type: set.type,
        card_count: set.cardCount,
        icon_url: symbolUrl,
        image_url: logoUrl,
      });
    }

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
        message: `Successfully imported ${sets.length} MTG sets with locally stored images` 
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
    const sets = [];
    
    // Since YGOPRODeck API doesn't provide set images directly,
    // we'll try to find some from a different endpoint for key sets
    for (const set of data) {
      console.log(`Processing set: ${set.set_code} - ${set.set_name}`);
      
      // Try to get a card from this set to use its image
      let setImage = null;
      try {
        const cardResponse = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=${encodeURIComponent(set.set_name)}&num=1&offset=0`);
        if (cardResponse.ok) {
          const cardData = await cardResponse.json();
          if (cardData.data && cardData.data.length > 0 && cardData.data[0].card_images && cardData.data[0].card_images.length > 0) {
            const imageUrl = cardData.data[0].card_images[0].image_url;
            setImage = await storeImageInSupabase(
              imageUrl,
              'yugioh/sets',
              `${set.set_code}_set.jpg`
            );
          }
        }
      } catch (e) {
        console.error(`Error fetching card image for set ${set.set_name}:`, e);
        // Continue without an image
      }
      
      sets.push({
        set_id: set.set_code,
        name: set.set_name,
        set_code: set.set_code,
        num_of_cards: set.num_of_cards || 0,
        tcg_date: set.tcg_date,
        set_image: setImage,
        set_type: set.set_type || "N/A",
      });
    }

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
        message: `Successfully imported ${sets.length} Yu-Gi-Oh! sets with locally stored images where available` 
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
    const setData = [
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

    // Download and store images locally
    const sets = [];
    for (const set of setData) {
      console.log(`Processing Lorcana set: ${set.set_id} - ${set.name}`);
      
      // Store set image in Supabase Storage
      const setImage = await storeImageInSupabase(
        set.set_image,
        'lorcana/sets',
        `${set.set_id}_set.png`
      );
      
      sets.push({
        ...set,
        set_image: setImage
      });
    }

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
        message: `Successfully added ${sets.length} Disney Lorcana sets with locally stored images` 
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
