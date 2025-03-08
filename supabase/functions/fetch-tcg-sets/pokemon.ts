
import { updateApiSyncTime } from "./utils.ts";
import * as StorageUtils from "./storage-utils.ts";
import { updateJobStatus, updateJobProgress } from "./job-utils.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.1.1";

// Increased chunk size to process more sets at once while still allowing resume
const CHUNK_SIZE = 30;

export async function processPokemonSets(jobId, supabase) {
  try {
    console.log(`Processing Pokemon sets for job ${jobId}`);
    await processChunkedPokemonSets(jobId, 0, 0, supabase);
  } catch (error) {
    console.error(`Error in Pokemon sets processing:`, error);
    throw error;
  }
}

// Improved chunked processing function
export async function processChunkedPokemonSets(jobId, startIndex = 0, knownTotalItems = 0, supabaseClient = null) {
  console.log(`Starting chunked Pokemon sets processing for job ${jobId} from index ${startIndex}`);
  
  const apiKey = Deno.env.get("POKEMON_TCG_API_KEY") || "";
  if (!apiKey) {
    throw new Error("POKEMON_TCG_API_KEY is not set in environment variables");
  }
  
  try {
    // Use provided supabase client or create a new one if none provided
    const supabase = supabaseClient || createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );
    
    // Step 1: Fetch all sets - but check cache first to avoid repeated API calls
    let sets = [];
    
    // If we're restarting, first check if we already have the sets in the database
    const { data: existingSets, error: existingSetsError } = await supabase
      .from('tcg_sets')
      .select('id')
      .eq('tcg_type', 'pokemon')
      .limit(1);
      
    console.log(`Checked existing sets: ${existingSets?.length || 0} found, error: ${existingSetsError?.message || 'none'}`);
    
    // Force a fresh fetch if we're starting from scratch or no existing sets
    const forceFetch = startIndex === 0 && (!existingSets || existingSets.length === 0);
    
    if (startIndex === 0 || knownTotalItems === 0 || forceFetch) {
      console.log("Fetching all Pokemon TCG sets from API...");
      await updateJobStatus(jobId, 'fetching_data', null, null, null, null, supabase);
      
      try {
        sets = await fetchPokemonSets(apiKey);
        const totalSets = sets.length;
        console.log(`Successfully fetched ${totalSets} Pokemon TCG sets from API`);
        
        // Update total items
        await updateJobProgress(jobId, startIndex, totalSets, supabase);
        
        // Log the complete list of set IDs to help with debugging
        console.log(`Set IDs fetched: ${sets.map(s => s.id).join(', ')}`);
      } catch (fetchError) {
        console.error("Error fetching Pokemon sets:", fetchError);
        throw new Error(`Failed to fetch Pokemon sets: ${fetchError.message}`);
      }
    } else {
      // We're resuming, so get the sets again but don't reset progress
      console.log("Resuming Pokemon sets processing - refetching sets...");
      try {
        sets = await fetchPokemonSets(apiKey);
        console.log(`Refetched ${sets.length} sets for resuming`);
        
        // Verify our known total matches actual total
        if (sets.length !== knownTotalItems && knownTotalItems > 0) {
          console.log(`Warning: Total sets count changed from ${knownTotalItems} to ${sets.length}`);
        }
      } catch (resumeError) {
        console.error("Error fetching Pokemon sets during resume:", resumeError);
        throw new Error(`Failed to fetch Pokemon sets during resume: ${resumeError.message}`);
      }
      
      // Keep using the known total for consistency
      await updateJobProgress(jobId, startIndex, knownTotalItems > 0 ? knownTotalItems : sets.length, supabase);
    }
    
    if (!sets || sets.length === 0) {
      throw new Error("No Pokemon sets were fetched from the API");
    }
    
    const totalSets = knownTotalItems > 0 ? knownTotalItems : sets.length;
    console.log(`Processing ${totalSets} Pokemon TCG sets in total`);
    
    // Step 2: Process sets in chunks
    await updateJobStatus(jobId, 'processing_data', null, null, null, null, supabase);
    
    // Process sets in chunks from the starting index
    for (let i = startIndex; i < totalSets && i < sets.length; i += CHUNK_SIZE) {
      const chunkEnd = Math.min(i + CHUNK_SIZE, totalSets, sets.length);
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
      
      // If this isn't the last chunk, save a checkpoint in the job status
      if (i + CHUNK_SIZE < totalSets) {
        console.log(`Saving checkpoint at index ${i + processedCount}`);
        await updateJobStatus(
          jobId, 
          'processing_data', 
          Math.floor(((i + processedCount) / totalSets) * 100),
          totalSets, 
          i + processedCount, 
          null, 
          supabase
        );
      }
    }
    
    // Step 3: Update sync time
    console.log("Updating Pokemon TCG API sync time");
    await updateApiSyncTime("pokemon", supabase);
    
    console.log(`Pokemon TCG sets processing completed successfully for job ${jobId}`);
    await updateJobStatus(jobId, 'completed', 100, totalSets, totalSets, null, supabase);
  } catch (error) {
    console.error(`Error in chunked Pokemon sets processing:`, error);
    await updateJobStatus(jobId, 'failed', null, null, null, error.message || "Unknown error in Pokemon chunked processing", supabase);
    throw error;
  }
}

// Improved helper function to process a chunk of sets with better error handling
async function processSetChunk(sets, startIdx, totalSets, jobId, apiKey, supabase) {
  console.log(`Processing ${sets.length} sets from index ${startIdx}`);
  let processedCount = 0;
  let errors = [];
  
  for (const set of sets) {
    try {
      console.log(`Processing set: ${set.id} - ${set.name}`);
      
      // Force a small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if the set is already in the database
      const { data: existingSet } = await supabase
        .from('tcg_sets')
        .select('id')
        .eq('id', set.id)
        .single();
        
      if (existingSet) {
        console.log(`Set ${set.id} already exists in database, updating...`);
      } else {
        console.log(`Set ${set.id} not found in database, inserting new record`);
      }
      
      // Save set to database
      await saveSetToDatabase(set, supabase);
      
      // Process images
      await processSetImages(set, supabase);
      
      processedCount++;
      
      // Update progress every set
      const completedItems = startIdx + processedCount;
      await updateJobProgress(jobId, completedItems, totalSets, supabase);
      
      console.log(`Successfully processed set ${set.id} (${completedItems}/${totalSets})`);
    } catch (error) {
      console.error(`Error processing set ${set.id}:`, error);
      errors.push(`${set.id}: ${error.message}`);
      // Continue with the next set instead of failing the entire job
    }
  }
  
  // If we had errors but processed some sets, log the errors but continue
  if (errors.length > 0) {
    console.warn(`Completed chunk with ${errors.length} errors: ${errors.join(', ')}`);
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

// Improved function to fetch Pokemon sets with better error handling
async function fetchPokemonSets(apiKey) {
  console.log("Fetching Pokemon TCG sets...");
  
  const headers = {
    'X-Api-Key': apiKey
  };
  
  try {
    const response = await fetch('https://api.pokemontcg.io/v2/sets?pageSize=500', { headers });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch Pokemon TCG sets: ${response.status} ${response.statusText} - ${text}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('No sets were returned from the Pokemon TCG API');
    }
    
    console.log(`Fetched ${data.data.length} Pokemon TCG sets successfully`);
    return data.data;
  } catch (error) {
    console.error("Error fetching Pokemon TCG sets:", error);
    throw error;
  }
}

// Fixed function to save to the correct table with better error handling
async function saveSetToDatabase(set, supabase) {
  console.log(`Saving set ${set.id} to database`);
  
  try {
    if (!set || !set.id) {
      throw new Error('Invalid set data provided');
    }
    
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
    
    // Making sure we're inserting to the correct table
    const { error } = await supabase
      .from('tcg_sets')
      .upsert(setData, { onConflict: 'id' });
      
    if (error) {
      console.error(`Error saving set ${set.id} to database:`, error);
      throw error;
    }
    
    console.log(`Successfully saved set ${set.id} to tcg_sets table`);
  } catch (error) {
    console.error(`Exception in saveSetToDatabase for ${set?.id}:`, error);
    throw error;
  }
}

// Improved function to process set images with better error handling
async function processSetImages(set, supabase) {
  console.log(`Processing images for set ${set.id}`);
  
  try {
    if (set.images?.symbol) {
      console.log(`Downloading symbol image for set ${set.id}`);
      await StorageUtils.downloadAndStoreImage(
        set.images.symbol,
        `pokemon/symbols/${set.id}.png`,
        supabase
      );
    }
    
    if (set.images?.logo) {
      console.log(`Downloading logo image for set ${set.id}`);
      await StorageUtils.downloadAndStoreImage(
        set.images.logo,
        `pokemon/logos/${set.id}.png`,
        supabase
      );
    }
    
    console.log(`Successfully processed images for set ${set.id}`);
  } catch (error) {
    console.error(`Error processing images for set ${set.id}:`, error);
    throw error;
  }
}
