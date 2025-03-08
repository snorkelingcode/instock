
// @ts-ignore
import { serve } from "std/http/server.ts";
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

interface JobStatus {
  id?: string;
  job_id: string;
  source: string;
  status: 'pending' | 'fetching_data' | 'processing_data' | 'saving_to_database' | 'completed' | 'failed';
  progress: number;
  total_items: number;
  completed_items: number;
  error: string | null;
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
      const { data: jobData, error: jobError } = await supabase
        .from('api_job_status')
        .select('*')
        .eq('job_id', requestData.jobId)
        .single();

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
    const { data: existingJobs, error: jobsError } = await supabase
      .from('api_job_status')
      .select('*')
      .eq('source', requestData.source)
      .not('status', 'in', '("completed","failed")')
      .order('created_at', { ascending: false });

    if (jobsError) {
      console.error("Error checking existing jobs:", jobsError);
    } else if (existingJobs && existingJobs.length > 0) {
      console.log(`Already have a running job for ${requestData.source}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `A synchronization job for ${requestData.source} is already in progress.`,
          jobId: existingJobs[0].job_id
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
    
    // Create a job ID for tracking
    const jobId = crypto.randomUUID();
    
    // Create a new job status record
    const newJob: JobStatus = {
      job_id: jobId,
      source: requestData.source,
      status: 'pending',
      progress: 0,
      total_items: 0,
      completed_items: 0,
      error: null
    };
    
    const { error: insertError } = await supabase
      .from('api_job_status')
      .insert(newJob);
      
    if (insertError) {
      console.error("Error creating job status:", insertError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create job status: ${insertError.message}` 
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
    // Update job status to fetching data
    await updateJobStatus(jobId, 'fetching_data', 0);
    
    let data: any[] = [];
    
    // Fetch data from appropriate source with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Reduced timeout to 15 seconds
    
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
        throw new Error(`API request for ${source} timed out after 15 seconds`);
      }
      throw fetchError;
    }
    
    if (!data || data.length === 0) {
      throw new Error(`No data received from ${source} API`);
    }
    
    // Update job with total items
    await updateJobStatus(jobId, 'processing_data', 0, data.length, 0);
    
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
    
    // Mark job as completed
    await updateJobStatus(jobId, 'completed', 100, data.length, data.length);
    
    console.log(`Completed sync for ${source}`);
  } catch (error) {
    console.error(`Error processing ${source} data:`, error);
    
    // Update job status with error
    await updateJobStatus(jobId, 'failed', 0, 0, 0, error.message);
  }
}

// Update job status helper
async function updateJobStatus(
  jobId: string, 
  status: JobStatus['status'], 
  progress: number,
  totalItems: number = 0,
  completedItems: number = 0,
  error: string | null = null
) {
  const updateData: any = { 
    status, 
    progress,
    updated_at: new Date().toISOString()
  };
  
  if (totalItems > 0) {
    updateData.total_items = totalItems;
  }
  
  if (completedItems > 0) {
    updateData.completed_items = completedItems;
  }
  
  if (error) {
    updateData.error = error;
  }
  
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }
  
  const { error: updateError } = await supabase
    .from('api_job_status')
    .update(updateData)
    .eq('job_id', jobId);
    
  if (updateError) {
    console.error(`Error updating job status for ${jobId}:`, updateError);
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
