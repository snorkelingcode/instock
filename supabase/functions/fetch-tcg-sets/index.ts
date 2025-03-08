
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

// Rate limiting configuration
const RATE_LIMIT_SECONDS = 60; // 1 minute between syncs
const RATE_LIMIT_TABLE = "api_rate_limits";

// Job status tracking
const JOB_STATUS_TABLE = "api_job_status";

// Function to check rate limit in the database
async function checkRateLimit(source) {
  try {
    console.log(`Checking rate limit for ${source}`);
    
    // Try to create the rate limit table if it doesn't exist
    await supabase.rpc("create_rate_limit_table_if_not_exists").catch(e => {
      console.log("Rate limit table creation RPC error (may already exist):", e);
    });
    
    // Check if rate limit exists
    const { data, error } = await supabase
      .from(RATE_LIMIT_TABLE)
      .select("expires_at")
      .eq("api_key", source)
      .single();
      
    if (error && error.code !== "PGRST116") { // PGRST116 is "No rows returned"
      console.error("Error checking rate limit:", error);
      return { limited: false, retryAfter: 0 }; // Fail open if error
    }
    
    if (!data) {
      return { limited: false, retryAfter: 0 };
    }
    
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    
    if (now < expiresAt) {
      const retryAfter = Math.ceil((expiresAt.getTime() - now.getTime()) / 1000);
      console.log(`Rate limit active for ${source}, retry after ${retryAfter}s`);
      return { limited: true, retryAfter };
    }
    
    return { limited: false, retryAfter: 0 };
  } catch (error) {
    console.error("Error in rate limit check:", error);
    return { limited: false, retryAfter: 0 }; // Fail open if error
  }
}

// Function to set rate limit in the database
async function setRateLimit(source) {
  try {
    console.log(`Setting rate limit for ${source}`);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RATE_LIMIT_SECONDS * 1000);
    
    // Upsert rate limit
    const { error } = await supabase
      .from(RATE_LIMIT_TABLE)
      .upsert({
        api_key: source,
        last_accessed: now.toISOString(),
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: "api_key"
      });
      
    if (error) {
      console.error("Error setting rate limit:", error);
    }
    
    return { expiresAt, retryAfter: RATE_LIMIT_SECONDS };
  } catch (error) {
    console.error("Error in set rate limit:", error);
    return { expiresAt: new Date(Date.now() + RATE_LIMIT_SECONDS * 1000), retryAfter: RATE_LIMIT_SECONDS };
  }
}

// Function to create the job status table if it doesn't exist
async function createJobStatusTableIfNotExists() {
  try {
    // Check if table exists, create it if not
    const { error } = await supabase.rpc('create_job_status_table_if_not_exists').catch(e => {
      console.log("Job status table creation RPC error (may attempt SQL):", e);
      
      // Try direct SQL if RPC fails
      return supabase.from('_manual_sql').select('*').eq('statement', `
        CREATE TABLE IF NOT EXISTS public.${JOB_STATUS_TABLE} (
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
      `);
    });
    
    if (error) {
      console.error("Error creating job status table:", error);
    }
  } catch (error) {
    console.error("Error in create job status table:", error);
  }
}

// Function to create a new job and return the job_id
async function createJob(source) {
  try {
    await createJobStatusTableIfNotExists();
    
    const jobId = crypto.randomUUID();
    
    const { error } = await supabase
      .from(JOB_STATUS_TABLE)
      .insert({
        job_id: jobId,
        source: source,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      console.error("Error creating job:", error);
      return null;
    }
    
    return jobId;
  } catch (error) {
    console.error("Error in create job:", error);
    return null;
  }
}

// Function to update job status
async function updateJobStatus(jobId, status, progress = null, totalItems = null, completedItems = null, error = null) {
  try {
    const updateData = {
      status: status,
      updated_at: new Date().toISOString()
    };
    
    if (progress !== null) updateData.progress = progress;
    if (totalItems !== null) updateData.total_items = totalItems;
    if (completedItems !== null) updateData.completed_items = completedItems;
    if (error) updateData.error = error;
    
    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    const { error: updateError } = await supabase
      .from(JOB_STATUS_TABLE)
      .update(updateData)
      .eq('job_id', jobId);
      
    if (updateError) {
      console.error(`Error updating job status for ${jobId}:`, updateError);
    }
  } catch (error) {
    console.error(`Error in update job status for ${jobId}:`, error);
  }
}

// Function to download and upload an image to Supabase storage
async function storeImageInSupabase(imageUrl, category, filename) {
  if (!imageUrl) return null;
  
  try {
    console.log(`Downloading image from: ${imageUrl}`);
    
    // Check if the bucket exists, create it if not
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets.find(bucket => bucket.name === 'tcg-images')) {
      console.log("Creating tcg-images bucket");
      await supabase.storage.createBucket('tcg-images', {
        public: true,
        fileSizeLimit: 5242880 // 5MB
      });
    }
    
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

// Wrapper for processing in the background
async function processInBackground(fn, jobId, source) {
  try {
    console.log(`Processing ${source} job ${jobId} in background`);
    await updateJobStatus(jobId, 'processing');
    await fn(jobId);
    await updateJobStatus(jobId, 'completed', 100);
    console.log(`Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`Background processing error for job ${jobId}:`, error);
    await updateJobStatus(jobId, 'failed', null, null, null, error.message || "Unknown error");
  }
}

// Handle requests
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
    
    const { source, jobId } = requestData;
    
    // If jobId is provided, this is a job status check
    if (jobId) {
      console.log(`Checking status for job: ${jobId}`);
      const { data, error } = await supabase
        .from(JOB_STATUS_TABLE)
        .select('*')
        .eq('job_id', jobId)
        .single();
        
      if (error) {
        console.error(`Error fetching job status for ${jobId}:`, error);
        return new Response(
          JSON.stringify({ error: `Job not found: ${jobId}` }),
          {
            status: 404,
            headers: responseHeaders,
          }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, job: data }),
        {
          status: 200,
          headers: responseHeaders,
        }
      );
    }
    
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

    // Check rate limit before proceeding
    const rateLimitCheck = await checkRateLimit(source);
    if (rateLimitCheck.limited) {
      console.log(`Rate limit hit for ${source}`);
      responseHeaders["Retry-After"] = rateLimitCheck.retryAfter.toString();
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Rate limited", 
          retryAfter: rateLimitCheck.retryAfter 
        }),
        {
          status: 429, // Too Many Requests
          headers: responseHeaders,
        }
      );
    }
    
    // Set rate limit for this request
    await setRateLimit(source);
    
    // Create a new job for this request
    const newJobId = await createJob(source);
    if (!newJobId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to create job" 
        }),
        {
          status: 500,
          headers: responseHeaders,
        }
      );
    }
    
    // Start background processing based on the source
    let processingFunction;
    switch (source) {
      case "pokemon":
        processingFunction = (jobId) => processPokemonSets(jobId);
        break;
      case "mtg":
        processingFunction = (jobId) => processMTGSets(jobId);
        break;
      case "yugioh":
        processingFunction = (jobId) => processYugiohSets(jobId);
        break;
      case "lorcana":
        processingFunction = (jobId) => processLorcanaSets(jobId);
        break;
      default:
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
    
    // Use EdgeRuntime's waitUntil for background processing
    // @ts-ignore - Deno Deploy specific API
    Deno.core.opAsync("op_queue_microtask", processInBackground(processingFunction, newJobId, source));
    
    // Immediately return the job ID to the client
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Job started for ${source}`,
        jobId: newJobId
      }),
      {
        status: 202, // Accepted
        headers: responseHeaders,
      }
    );
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

// ----- OPTIMIZED SET FETCHING FUNCTIONS -----

// Process Pokémon sets in the background - optimized to fetch only what's needed for UI
async function processPokemonSets(jobId) {
  console.log(`Processing Pokémon TCG sets for job ${jobId}...`);
  
  try {
    const headers = {};
    if (pokemonApiKey) {
      headers["X-Api-Key"] = pokemonApiKey;
      console.log("Using Pokemon TCG API key");
    } else {
      console.log("No Pokemon TCG API key provided");
    }

    await updateJobStatus(jobId, 'fetching_data');
    console.log("Sending request to Pokemon TCG API");
    
    // We're only fetching sets, not individual cards
    const response = await fetch("https://api.pokemontcg.io/v2/sets", {
      headers: pokemonApiKey ? headers : {},
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pokémon API error: ${response.status}`, errorText);
      throw new Error(`Pokémon API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const setCount = data.data?.length || 0;
    console.log(`Received ${setCount} Pokémon sets from API`);
    
    await updateJobStatus(jobId, 'processing_data', 0, setCount, 0);
    
    // Process sets and store only essential UI data
    const sets = [];
    let completedItems = 0;
    
    for (const set of data.data) {
      console.log(`Processing set: ${set.id} - ${set.name}`);
      
      // Only download the images we need for the UI: logo and symbol
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
      
      // Only store fields needed for UI display
      sets.push({
        set_id: set.id,
        name: set.name,
        series: set.series,
        printed_total: set.printedTotal,
        total: set.total,
        release_date: set.releaseDate,
        symbol_url: symbolUrl,
        logo_url: logoUrl,
      });
      
      completedItems++;
      const progress = Math.round((completedItems / setCount) * 100);
      await updateJobStatus(jobId, 'processing_data', progress, setCount, completedItems);
    }

    console.log(`Processing ${sets.length} Pokémon sets for database insertion`);
    await updateJobStatus(jobId, 'saving_to_database');

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

    return sets.length;
  } catch (error) {
    console.error("Error fetching Pokémon sets:", error);
    throw error;
  }
}

// Process MTG sets in the background - optimized for UI display
async function processMTGSets(jobId) {
  console.log(`Processing Magic: The Gathering sets for job ${jobId}...`);
  
  try {
    await updateJobStatus(jobId, 'fetching_data');
    console.log("Sending request to MTG API");
    const response = await fetch("https://api.magicthegathering.io/v1/sets");

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`MTG API error: ${response.status}`, errorText);
      throw new Error(`MTG API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const setCount = data.sets?.length || 0;
    console.log(`Received ${setCount} MTG sets from API`);
    
    await updateJobStatus(jobId, 'processing_data', 0, setCount, 0);
    
    // Process sets and store only what's needed for UI
    const sets = [];
    let completedItems = 0;
    
    for (const set of data.sets) {
      console.log(`Processing set: ${set.code} - ${set.name}`);
      
      // Only download essential images
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
      
      // Only save fields that are displayed in UI
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
      
      completedItems++;
      const progress = Math.round((completedItems / setCount) * 100);
      await updateJobStatus(jobId, 'processing_data', progress, setCount, completedItems);
    }

    console.log(`Processing ${sets.length} MTG sets for database insertion`);
    await updateJobStatus(jobId, 'saving_to_database');

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

    return sets.length;
  } catch (error) {
    console.error("Error fetching MTG sets:", error);
    throw error;
  }
}

// Process Yu-Gi-Oh! sets in the background - optimized
async function processYugiohSets(jobId) {
  console.log(`Processing Yu-Gi-Oh! sets for job ${jobId}...`);
  
  try {
    await updateJobStatus(jobId, 'fetching_data');
    console.log("Sending request to Yu-Gi-Oh! API");
    const response = await fetch("https://db.ygoprodeck.com/api/v7/cardsets.php");

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Yu-Gi-Oh! API error: ${response.status}`, errorText);
      throw new Error(`Yu-Gi-Oh! API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const setCount = data?.length || 0;
    console.log(`Received ${setCount} Yu-Gi-Oh! sets from API`);
    
    await updateJobStatus(jobId, 'processing_data', 0, setCount, 0);
    
    // Process sets - only one representative image per set is needed
    const sets = [];
    let completedItems = 0;
    
    for (const set of data) {
      console.log(`Processing set: ${set.set_code} - ${set.set_name}`);
      
      // Get one representative set image - we don't need all images
      let setImage = null;
      try {
        // Only fetch a single card image as representative
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
      
      // Store only essential set data
      sets.push({
        set_id: set.set_code,
        name: set.set_name,
        set_code: set.set_code,
        num_of_cards: set.num_of_cards || 0,
        tcg_date: set.tcg_date,
        set_image: setImage,
        set_type: set.set_type || "N/A",
      });
      
      completedItems++;
      const progress = Math.round((completedItems / setCount) * 100);
      await updateJobStatus(jobId, 'processing_data', progress, setCount, completedItems);
    }

    console.log(`Processing ${sets.length} Yu-Gi-Oh! sets for database insertion`);
    await updateJobStatus(jobId, 'saving_to_database');

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

    return sets.length;
  } catch (error) {
    console.error("Error fetching Yu-Gi-Oh! sets:", error);
    throw error;
  }
}

// Process Disney Lorcana sets - minimal data set
async function processLorcanaSets(jobId) {
  console.log(`Processing Disney Lorcana sets for job ${jobId}...`);
  
  try {
    await updateJobStatus(jobId, 'processing_data');
    
    // Minimal handcrafted Lorcana set data
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

    const setCount = setData.length;
    await updateJobStatus(jobId, 'processing_data', 0, setCount, 0);

    // Download and store images locally
    const sets = [];
    let completedItems = 0;
    
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
      
      completedItems++;
      const progress = Math.round((completedItems / setCount) * 100);
      await updateJobStatus(jobId, 'processing_data', progress, setCount, completedItems);
    }

    console.log(`Processing ${sets.length} Disney Lorcana sets for database insertion`);
    await updateJobStatus(jobId, 'saving_to_database');

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

    return sets.length;
  } catch (error) {
    console.error("Error adding Disney Lorcana sets:", error);
    throw error;
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
