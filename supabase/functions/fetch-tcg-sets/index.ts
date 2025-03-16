// @ts-ignore
import { serve } from "std/http/server.ts";
// Using direct import URL for Supabase client
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Initialize environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const pokemonApiKey = Deno.env.get("POKEMON_TCG_API_KEY") as string;
const mtgApiKey = Deno.env.get("MTG_API_KEY") as string;
const authKey = Deno.env.get("TCG_SYNC_ACCESS_KEY") as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Enforced rate limiting
const RATE_LIMIT_SECONDS = 60; // 1 minute

interface FetchTCGRequest {
  source: "pokemon" | "mtg" | "yugioh" | "lorcana";
  jobId?: string;
  accessKey?: string;
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET"
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    const requestData: FetchTCGRequest = await req.json();
    console.log("Request received for source:", requestData.source);

    // Simple authorization check
    if (requestData.accessKey !== authKey && !requestData.jobId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized. Authentication required." 
        }),
        { 
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // If jobId is provided, return the status of that job
    if (requestData.jobId) {
      console.log("Fetching status for job:", requestData.jobId);
      
      // Use the RPC function to get job by id
      const { data: jobData, error: jobError } = await supabase
        .rpc('get_job_by_id', { job_id: requestData.jobId });

      if (jobError) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to fetch job status: ${jobError.message}` 
          }),
          { 
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          job: jobData
        }),
        { 
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Check if we already have a running job for this source
    const { data: activeJobs, error: jobsError } = await supabase
      .from('api_job_status')
      .select('*')
      .eq('source', requestData.source)
      .not('status', 'in', '("completed","failed")')
      .order('created_at', { ascending: false });

    if (jobsError) {
      console.error("Error checking existing jobs:", jobsError);
    } else if (activeJobs && activeJobs.length > 0) {
      console.log(`Already have a running job for ${requestData.source}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `A synchronization job for ${requestData.source} is already in progress.`,
          jobId: activeJobs[0].job_id
        }),
        { 
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Check rate limiting against database
    const { data: apiConfig, error: configError } = await supabase
      .from('api_config')
      .select('last_sync_time')
      .eq('api_name', requestData.source)
      .single();

    if (!configError && apiConfig && apiConfig.last_sync_time) {
      const lastSyncTime = new Date(apiConfig.last_sync_time).getTime();
      const currentTime = Date.now();
      const elapsedSeconds = (currentTime - lastSyncTime) / 1000;
      
      if (elapsedSeconds < RATE_LIMIT_SECONDS) {
        const retryAfter = Math.ceil(RATE_LIMIT_SECONDS - elapsedSeconds);
        console.log(`Rate limited. Try again in ${retryAfter} seconds.`);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Rate limited. Please try again later.`,
            retryAfter 
          }),
          { 
            status: 429,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
              "Retry-After": retryAfter.toString()
            },
          }
        );
      }
    }
    
    // Create a new job using the RPC function
    const { data: newJob, error: createJobError } = await supabase
      .rpc('create_sync_job', {
        job_details: {
          job_type: `sync_${requestData.source.toLowerCase()}_sets`,
          user_id: null,  // Edge function job
          sync_type: 'full',
          set_code: ''
        }
      });
      
    if (createJobError) {
      console.error("Error creating job:", createJobError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create job: ${createJobError.message}` 
        }),
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
    
    const jobId = newJob;
    
    // Start background processing
    // Instead of waiting for the process to complete, we mark it as a background task
    EdgeRuntime.waitUntil(processTCGData(requestData.source, jobId));
    
    // Return success with the job ID immediately
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synchronization of ${requestData.source} data has started.`,
        jobId: jobId
      }),
      { 
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Failed to process request: ${error.message}` 
      }),
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});

// Background processing function
async function processTCGData(source: string, jobId: string) {
  console.log(`Starting background processing for ${source} with job ID: ${jobId}`);
  
  try {
    // Update job status to running
    await supabase.rpc('update_job_status', { 
      job_id: jobId, 
      new_status: 'running' 
    });
    
    let data: any[] = [];
    
    // Fetch data from appropriate source with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds timeout
    
    try {
      switch (source) {
        case "pokemon":
          data = await fetchPokemonSets(controller.signal);
          break;
        case "mtg":
          data = await fetchMTGSets(controller.signal);
          break;
        case "yugioh":
          data = await fetchYuGiOhSets(controller.signal);
          break;
        case "lorcana":
          data = await fetchLorcanaSets();
          break;
        default:
          throw new Error(`Unknown source: ${source}`);
      }
      
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error(`API request for ${source} timed out after 20 seconds`);
      }
      throw fetchError;
    }
    
    if (!data || data.length === 0) {
      throw new Error(`No data received from ${source} API`);
    }
    
    // Process and save the data
    await saveSets(source, data, jobId);
    
    // Update the last sync time
    const { error: updateError } = await supabase
      .from('api_config')
      .upsert({ 
        api_name: source, 
        last_sync_time: new Date().toISOString() 
      }, { 
        onConflict: 'api_name' 
      });
      
    if (updateError) {
      console.error(`Error updating sync time for ${source}:`, updateError);
    }
    
    // Mark job as completed with result summary
    await supabase.rpc('update_job_status', { 
      job_id: jobId, 
      new_status: 'completed',
      result: { items_processed: data.length }
    });
    
    console.log(`Completed sync for ${source}`);
  } catch (error) {
    console.error(`Error processing ${source} data:`, error);
    
    // Update job status with error
    await supabase.rpc('update_job_status', { 
      job_id: jobId, 
      new_status: 'failed',
      error_msg: error.message
    });
  }
}

// Fetch Pokemon TCG sets - optimized to get only what we need
async function fetchPokemonSets(signal?: AbortSignal) {
  console.log("Fetching Pokemon TCG sets...");
  
  const headers: HeadersInit = {};
  if (pokemonApiKey) {
    headers["X-Api-Key"] = pokemonApiKey;
  }
  
  const response = await fetch("https://api.pokemontcg.io/v2/sets", { 
    headers,
    signal 
  });
  
  if (!response.ok) {
    throw new Error(`Error fetching Pokemon sets: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`Retrieved ${data.data.length} Pokemon sets`);
  
  // Only extract the fields we need
  return data.data.map((set: any) => ({
    set_id: set.id,
    name: set.name,
    series: set.series,
    printed_total: set.printedTotal,
    total: set.total,
    release_date: set.releaseDate,
    symbol_url: set.images.symbol,
    logo_url: set.images.logo,
    images_url: set.images.logo // Prefer logo, fallback to symbol
  }));
}

// Fetch MTG sets with timeout
async function fetchMTGSets(signal?: AbortSignal) {
  console.log("Fetching MTG sets...");
  
  const headers: HeadersInit = {};
  if (mtgApiKey) {
    headers["x-api-key"] = mtgApiKey;
  }
  
  const response = await fetch("https://api.scryfall.com/sets", { signal });
  
  if (!response.ok) {
    throw new Error(`Error fetching MTG sets: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`Retrieved ${data.data.length} MTG sets`);
  
  // Only extract the fields we need
  return data.data.map((set: any) => ({
    set_id: set.id,
    name: set.name,
    code: set.code,
    release_date: set.released_at,
    set_type: set.set_type,
    card_count: set.card_count,
    icon_url: set.icon_svg_uri,
    image_url: set.image_url || set.icon_svg_uri
  }));
}

// Fetch YuGiOh sets with timeout
async function fetchYuGiOhSets(signal?: AbortSignal) {
  console.log("Fetching Yu-Gi-Oh! sets...");
  
  const response = await fetch("https://db.ygoprodeck.com/api/v7/cardsets.php", { signal });
  
  if (!response.ok) {
    throw new Error(`Error fetching YuGiOh sets: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`Retrieved ${data.length} Yu-Gi-Oh! sets`);
  
  // Only extract the fields we need and ensure we have unique IDs
  return data.map((set: any, index: number) => ({
    set_id: set.set_code || `yugioh-set-${index}`,
    name: set.set_name,
    set_code: set.set_code,
    num_of_cards: set.num_of_cards,
    tcg_date: set.tcg_date,
    set_image: `https://images.ygoprodeck.com/images/sets/${set.set_code}.jpg`,
    set_type: set.set_type || "Main Set"
  }));
}

// Add custom Lorcana sets - these are hardcoded since there's no official API
async function fetchLorcanaSets() {
  console.log("Adding Disney Lorcana sets...");
  
  // Hardcoded list of Lorcana sets
  const lorcanaSets = [
    {
      set_id: "tfc",
      name: "The First Chapter",
      release_date: "2023-08-18",
      set_code: "TFC",
      total_cards: 204,
      set_image: "https://lorcana.com/wp-content/uploads/2023/09/Core-Set-The-First-Chapter-Cardback-Banner-1.jpg",
      set_type: "Core Set"
    },
    {
      set_id: "rit",
      name: "Rise of the Floodborn",
      release_date: "2023-12-01",
      set_code: "RIT",
      total_cards: 204,
      set_image: "https://lorcana.com/wp-content/uploads/2023/11/Rise-of-the-Floodborn-Cardback-Banner-1.jpg",
      set_type: "Core Set"
    },
    {
      set_id: "faz",
      name: "Into the Inklands",
      release_date: "2024-02-16",
      set_code: "ITI",
      total_cards: 204,
      set_image: "https://lorcana.com/wp-content/uploads/2024/02/ITI-Promo-Featured-Image-Desktop.jpg",
      set_type: "Core Set"
    },
    {
      set_id: "aur",
      name: "Ursula's Return",
      release_date: "2024-05-17",
      set_code: "AUR",
      total_cards: 204,
      set_image: "https://lorcana.com/wp-content/uploads/2024/05/Ursulas-Return-Desktop-Banner-3960x2380.jpg",
      set_type: "Core Set"
    }
  ];
  
  return lorcanaSets;
}

// Save sets to the database with better error handling and batching
async function saveSets(source: string, sets: any[], jobId: string) {
  console.log(`Saving ${sets.length} ${source} sets to the database...`);
  
  // Update job status
  await updateJobStatus(jobId, 'saving_to_database', 50, sets.length, 0);
  
  let tableName = "";
  
  switch (source) {
    case "pokemon":
      tableName = "pokemon_sets";
      break;
    case "mtg":
      tableName = "mtg_sets";
      break;
    case "yugioh":
      tableName = "yugioh_sets";
      break;
    case "lorcana":
      tableName = "lorcana_sets";
      break;
    default:
      throw new Error(`Unknown source: ${source}`);
  }
  
  // Process sets in smaller batches to avoid overloading the database
  const batchSize = 10; // Reduced batch size 
  let processedCount = 0;
  
  for (let i = 0; i < sets.length; i += batchSize) {
    const batch = sets.slice(i, i + batchSize);
    
    try {
      const { error } = await supabase
        .from(tableName)
        .upsert(batch, { onConflict: 'set_id' });
        
      if (error) {
        console.error(`Error saving ${source} sets batch:`, error);
        throw error;
      }
      
      processedCount += batch.length;
      const progress = Math.floor((processedCount / sets.length) * 100);
      
      // Update job progress
      await updateJobStatus(jobId, 'saving_to_database', progress, sets.length, processedCount);
      
      // Add a slightly longer delay between batches to avoid database overloading
      if (i + batchSize < sets.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error with batch ${i / batchSize + 1}:`, error);
      throw new Error(`Failed to save batch ${i / batchSize + 1}: ${error.message}`);
    }
  }
  
  console.log(`Successfully saved ${sets.length} ${source} sets`);
}
