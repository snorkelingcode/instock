
// TCG Card Download Processing Module
import { updateDownloadJobStatus } from "../database/job-status.ts";
import { downloadPokemonCards } from "../api/pokemon-cards.ts";
import { downloadMTGCards } from "../api/mtg-cards.ts";
import { downloadYuGiOhCards } from "../api/yugioh-cards.ts";
import { downloadLorcanaCards } from "../api/lorcana-cards.ts";
import { saveCardImages } from "../utils/image-downloader.ts";

export interface DownloadOptions {
  setId?: string;
  downloadImages?: boolean;
}

// Background processing function for TCG card downloads
export async function processCardDownload(
  supabase: any, 
  source: string, 
  jobId: string, 
  apiKeys: {
    pokemon?: string;
    mtg?: string;
  },
  options: DownloadOptions = {}
) {
  console.log(`Starting background processing for ${source} card download with job ID: ${jobId}`);
  console.log(`Options: setId=${options.setId || 'all'}, downloadImages=${options.downloadImages}`);
  
  try {
    // Update job status to downloading data
    await updateDownloadJobStatus(supabase, jobId, 'downloading_data', 0, 0);
    
    let cards: any[] = [];
    
    // Fetch data from appropriate source
    switch (source) {
      case "pokemon":
        cards = await downloadPokemonCards(apiKeys.pokemon || "", options.setId);
        break;
      case "mtg":
        cards = await downloadMTGCards(apiKeys.mtg || "", options.setId);
        break;
      case "yugioh":
        cards = await downloadYuGiOhCards(options.setId);
        break;
      case "lorcana":
        cards = await downloadLorcanaCards(options.setId);
        break;
      default:
        throw new Error(`Unknown source: ${source}`);
    }
    
    if (!cards || cards.length === 0) {
      throw new Error(`No card data received from ${source} API`);
    }
    
    console.log(`Successfully downloaded ${cards.length} ${source} cards`);
    
    // Update job with total items
    await updateDownloadJobStatus(supabase, jobId, 'processing_data', cards.length, 0);
    
    // Save cards to database
    await saveCardsToDatabase(supabase, source, cards, jobId);
    
    // Download and save images if requested
    if (options.downloadImages) {
      await updateDownloadJobStatus(supabase, jobId, 'downloading_images', cards.length, 0);
      await saveCardImages(supabase, source, cards, jobId);
    }
    
    // Mark job as completed
    await updateDownloadJobStatus(supabase, jobId, 'completed', cards.length, cards.length);
    
    console.log(`Completed card download for ${source}`);
  } catch (error) {
    console.error(`Error processing ${source} card download:`, error);
    
    // Update job status with error
    await updateDownloadJobStatus(supabase, jobId, 'failed', 0, 0, error.message);
  }
}

// Save cards to the appropriate database table
async function saveCardsToDatabase(
  supabase: any, 
  source: string, 
  cards: any[], 
  jobId: string
) {
  console.log(`Saving ${cards.length} ${source} cards to the database...`);
  
  let tableName = "";
  
  switch (source) {
    case "pokemon":
      tableName = "pokemon_cards";
      break;
    case "mtg":
      tableName = "mtg_cards";
      break;
    case "yugioh":
      tableName = "yugioh_cards";
      break;
    case "lorcana":
      tableName = "lorcana_cards";
      break;
    default:
      throw new Error(`Unknown source: ${source}`);
  }
  
  // Process cards in batches to avoid overloading the database
  const batchSize = 20;
  let processedCount = 0;
  
  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from(tableName)
      .upsert(batch, { onConflict: 'card_id' });
      
    if (error) {
      console.error(`Error saving ${source} cards batch:`, error);
      throw error;
    }
    
    processedCount += batch.length;
    
    // Update job progress
    await updateDownloadJobStatus(
      supabase, 
      jobId, 
      'processing_data', 
      cards.length, 
      processedCount
    );
  }
  
  console.log(`Successfully saved ${cards.length} ${source} cards to the database`);
}
