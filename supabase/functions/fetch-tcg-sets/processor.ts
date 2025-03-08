
// TCG Data Processing Module

import { fetchPokemonSets } from "./api/pokemon.ts";
import { fetchMTGSets } from "./api/mtg.ts";
import { fetchYuGiOhSets } from "./api/yugioh.ts";
import { fetchLorcanaSets } from "./api/lorcana.ts";
import { updateJobStatus } from "./database/job-status.ts";
import { saveSets } from "./database/save-sets.ts";

// Background processing function
export async function processTCGData(supabase: any, source: string, jobId: string, apiKeys: {
  pokemon?: string;
  mtg?: string;
}) {
  console.log(`Starting background processing for ${source} with job ID: ${jobId}`);
  
  try {
    // Update job status to fetching data
    await updateJobStatus(supabase, jobId, 'fetching_data', 0);
    
    let data: any[] = [];
    
    // Fetch data from appropriate source
    switch (source) {
      case "pokemon":
        data = await fetchPokemonSets(apiKeys.pokemon || "");
        break;
      case "mtg":
        data = await fetchMTGSets(apiKeys.mtg || "");
        break;
      case "yugioh":
        data = await fetchYuGiOhSets();
        break;
      case "lorcana":
        data = await fetchLorcanaSets();
        break;
      default:
        throw new Error(`Unknown source: ${source}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error(`No data received from ${source} API`);
    }
    
    // Update job with total items
    await updateJobStatus(supabase, jobId, 'processing_data', 0, data.length, 0);
    
    // Process and save the data
    await saveSets(supabase, source, data, jobId, 
      (jobId: string, status: string, progress: number, totalItems: number, completedItems: number, error?: string | null) => 
        updateJobStatus(supabase, jobId, status, progress, totalItems, completedItems, error)
    );
    
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
    await updateJobStatus(supabase, jobId, 'completed', 100, data.length, data.length);
    
    console.log(`Completed sync for ${source}`);
  } catch (error) {
    console.error(`Error processing ${source} data:`, error);
    
    // Update job status with error
    await updateJobStatus(supabase, jobId, 'failed', 0, 0, 0, error.message);
  }
}
