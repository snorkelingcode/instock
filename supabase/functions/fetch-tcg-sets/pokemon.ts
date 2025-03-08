import { updateApiSyncTime } from "./utils.ts";
import * as StorageUtils from "./storage-utils.ts";
import { updateJobStatus, updateJobProgress } from "./job-utils.ts";

// Added chunk size constant
const CHUNK_SIZE = 10;

export async function processPokemonSets(jobId, supabase) {
  try {
    console.log(`Processing Pokemon sets for job ${jobId}`);
    await processChunkedPokemonSets(jobId, 0, 0);
  } catch (error) {
    console.error(`Error in Pokemon sets processing:`, error);
    throw error;
  }
}

// New chunked processing function
export async function processChunkedPokemonSets(jobId, startIndex = 0, knownTotalItems = 0) {
  console.log(`Starting chunked Pokemon sets processing for job ${jobId} from index ${startIndex}`);
  
  const apiKey = Deno.env.get("POKEMON_TCG_API_KEY") || "";
  if (!apiKey) {
    throw new Error("POKEMON_TCG_API_KEY is not set in environment variables");
  }
  
  try {
    const supabase = new (await import("https://esm.sh/@supabase/supabase-js@2.1.1")).createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );
    
    // Step 1: Fetch all sets
    console.log("Fetching all Pokemon TCG sets...");
    await updateJobStatus(jobId, 'fetching_data', null, null, null, null, supabase);
    
    const sets = await fetchPokemonSets(apiKey);
    const totalSets = sets.length;
    console.log(`Found ${totalSets} Pokemon TCG sets`);
    
    // Update total items if it's not already known
    if (knownTotalItems === 0) {
      await updateJobProgress(jobId, startIndex, totalSets, supabase);
    } else {
      await updateJobProgress(jobId, startIndex, knownTotalItems, supabase);
    }
    
    // Step 2: Process sets in chunks
    await updateJobStatus(jobId, 'processing_data', null, null, null, null, supabase);
    
    // Process sets in chunks from the starting index
    for (let i = startIndex; i < totalSets; i += CHUNK_SIZE) {
      const chunkEnd = Math.min(i + CHUNK_SIZE, totalSets);
      console.log(`Processing chunk ${i} to ${chunkEnd} of ${totalSets}`);
      
      // Process each set in the current chunk
      const processedCount = await processSetChunk(sets.slice(i, chunkEnd), i, totalSets, jobId, apiKey, supabase);
      
      // Update completed count
      await updateJobProgress(jobId, i + processedCount, totalSets, supabase);
      
      // Check if we should continue or if job was cancelled
      const isRunning = await isJobStillRunning(jobId, supabase);
      if (!isRunning) {
        console.log(`Job ${jobId} is no longer running, stopping chunked processing`);
        return;
      }
    }
    
    // Step 3: Update sync time
    console.log("Updating Pokemon TCG API sync time");
    await updateApiSyncTime("pokemon", supabase);
    
    console.log(`Pokemon TCG sets processing completed successfully for job ${jobId}`);
    await updateJobStatus(jobId, 'completed', 100, totalSets, totalSets, null, supabase);
  } catch (error) {
    console.error(`Error in chunked Pokemon sets processing:`, error);
    throw error;
  }
}

// Helper function to process a chunk of sets
async function processSetChunk(sets, startIdx, totalSets, jobId, apiKey, supabase) {
  console.log(`Processing ${sets.length} sets from index ${startIdx}`);
  let processedCount = 0;
  
  for (const set of sets) {
    try {
      console.log(`Processing set: ${set.id} - ${set.name}`);
      
      // Save set to database
      await saveSetToDatabase(set, supabase);
      
      // Process images
      await processSetImages(set, supabase);
      
      processedCount++;
      
      // Update progress every set
      const completedItems = startIdx + processedCount;
      await updateJobProgress(jobId, completedItems, totalSets, supabase);
    } catch (error) {
      console.error(`Error processing set ${set.id}:`, error);
      // Continue with the next set instead of failing the entire job
    }
  }
  
  return processedCount;
}

async function isJobStillRunning(jobId, supabase) {
  try {
    const { data, error } = await supabase
      .from("api_job_status")
      .select("status")
      .eq("job_id", jobId)
      .single();
      
    if (error) {
      console.error(`Error checking job status for ${jobId}:`, error);
      return false;
    }
    
    return data && data.status !== 'failed' && data.status !== 'completed';
  } catch (error) {
    console.error(`Error in isJobStillRunning for ${jobId}:`, error);
    return false;
  }
}

// Existing function implementations
async function fetchPokemonSets(apiKey) {
  console.log("Fetching Pokemon TCG sets...");
  
  const headers = {
    'X-Api-Key': apiKey
  };
  
  const response = await fetch('https://api.pokemontcg.io/v2/sets', { headers });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch Pokemon TCG sets: ${response.status} ${response.statusText} - ${text}`);
  }
  
  const data = await response.json();
  return data.data;
}

async function saveSetToDatabase(set, supabase) {
  console.log(`Saving set ${set.id} to database`);
  
  const setData = {
    id: set.id,
    name: set.name,
    series: set.series,
    printed_total: set.printedTotal,
    total: set.total,
    release_date: set.releaseDate,
    symbol_image: set.images?.symbol || null,
    logo_image: set.images?.logo || null,
    description: `${set.series} expansion released in ${set.releaseDate}`,
    tcg_type: "pokemon",
    updated_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('tcg_sets')
    .upsert(setData, { onConflict: 'id' });
    
  if (error) {
    console.error(`Error saving set ${set.id} to database:`, error);
    throw error;
  }
}

async function processSetImages(set, supabase) {
  console.log(`Processing images for set ${set.id}`);
  
  if (set.images?.symbol) {
    await StorageUtils.downloadAndStoreImage(
      set.images.symbol,
      `pokemon/symbols/${set.id}.png`,
      supabase
    );
  }
  
  if (set.images?.logo) {
    await StorageUtils.downloadAndStoreImage(
      set.images.logo,
      `pokemon/logos/${set.id}.png`,
      supabase
    );
  }
}
