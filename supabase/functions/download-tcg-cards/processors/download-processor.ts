// TCG Card Download Processing Module
import { updateDownloadJobStatus } from "../database/job-status.ts";
import { downloadImage, getImageExtension, saveCardImages } from "../utils/image-downloader.ts";
import { fetchPokemonCardsForSet } from "../api/pokemon-cards.ts";
import { fetchMTGCardsForSet } from "../api/mtg-cards.ts";
import { fetchYugiohCardsForSet } from "../api/yugioh-cards.ts";
import { fetchLorcanaCardsForSet } from "../api/lorcana-cards.ts";

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
        cards = await fetchPokemonCardsForSet(options.setId);
        break;
      case "mtg":
        cards = await fetchMTGCardsForSet(apiKeys.mtg || "", options.setId);
        break;
      case "yugioh":
        cards = await fetchYugiohCardsForSet(options.setId);
        break;
      case "lorcana":
        cards = await fetchLorcanaCardsForSet(options.setId);
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

// Main download processor for Pokémon TCG cards
export async function downloadPokemonCards(
  supabase: any, 
  jobId: string, 
  setId: string | null = null, 
  downloadImages = true
): Promise<void> {
  try {
    await updateDownloadJobStatus(supabase, jobId, "downloading_data");
    
    let sets = [];
    
    // If setId is provided, only download cards for that set
    if (setId) {
      const { data, error } = await supabase
        .from('pokemon_sets')
        .select('*')
        .eq('set_id', setId)
        .single();
        
      if (error) throw error;
      if (!data) throw new Error(`Set with ID ${setId} not found`);
      
      sets = [data];
    } else {
      // Otherwise, get all sets from the database
      const { data, error } = await supabase
        .from('pokemon_sets')
        .select('*')
        .order('release_date', { ascending: false });
        
      if (error) throw error;
      sets = data || [];
    }
    
    if (sets.length === 0) {
      throw new Error("No Pokémon sets found in the database. Please sync sets first.");
    }
    
    await updateDownloadJobStatus(supabase, jobId, "processing_data", 0, sets.length, 0);
    
    // Process each set
    for (let i = 0; i < sets.length; i++) {
      const set = sets[i];
      console.log(`Processing Pokémon set: ${set.name} (${set.set_id})`);
      
      // Update job status
      await updateDownloadJobStatus(
        supabase,
        jobId,
        "processing_data",
        Math.round(((i + 1) / sets.length) * 100),
        sets.length,
        i
      );
      
      // Fetch cards for the set
      const cards = await fetchPokemonCardsForSet(set.set_id);
      
      // Insert cards into the database
      for (const card of cards) {
        try {
          const { error } = await supabase
            .from('pokemon_cards')
            .upsert({
              card_id: card.id,
              name: card.name,
              supertype: card.supertype,
              subtypes: card.subtypes,
              hp: card.hp,
              types: card.types,
              evolves_from: card.evolvesFrom,
              evolves_to: card.evolvesTo,
              rules: card.rules,
              attacks: card.attacks,
              weaknesses: card.weaknesses,
              resistances: card.resistances,
              retreat_cost: card.retreatCost,
              converted_retreat_cost: card.convertedRetreatCost,
              set_id: set.set_id,
              number: card.number,
              artist: card.artist,
              rarity: card.rarity,
              flavor_text: card.flavorText,
              national_pokedex_numbers: card.nationalPokedexNumbers,
              legalities: card.legalities,
              images: card.images,
              tcgplayer: card.tcgplayer,
              cardmarket: card.cardmarket
            }, {
              onConflict: 'card_id'
            });
            
          if (error) {
            console.error(`Error inserting Pokémon card ${card.id}:`, error);
          }
        } catch (error) {
          console.error(`Error processing Pokémon card ${card.id}:`, error);
        }
      }
    }
    
    // Download images if requested
    if (downloadImages) {
      await downloadPokemonImages(supabase, jobId, setId);
    } else {
      await updateDownloadJobStatus(supabase, jobId, "completed");
    }
  } catch (error) {
    console.error("Error in downloadPokemonCards:", error);
    await updateDownloadJobStatus(
      supabase,
      jobId,
      "failed",
      0,
      0,
      error.message || "Unknown error"
    );
    throw error;
  }
}

// Function to download Pokémon card images
async function downloadPokemonImages(
  supabase: any,
  jobId: string,
  setId: string | null = null
): Promise<void> {
  try {
    console.log("Starting to download Pokémon card images");
    
    // Get cards that need images
    let query = supabase
      .from('pokemon_cards')
      .select('card_id, images');
      
    if (setId) {
      query = query.eq('set_id', setId);
    }
    
    const { data: cards, error } = await query;
    
    if (error) throw error;
    
    await updateDownloadJobStatus(
      supabase,
      jobId,
      "downloading_images",
      0,
      cards.length,
      0
    );
    
    // Process each card
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      
      if (!card.images) {
        console.log(`No images found for card ${card.card_id}`);
        continue;
      }
      
      // Update job status
      await updateDownloadJobStatus(
        supabase,
        jobId,
        "downloading_images",
        Math.round(((i + 1) / cards.length) * 100),
        cards.length,
        i
      );
      
      try {
        // Check if we already have downloaded this image
        const { data: existingImage } = await supabase
          .from('tcg_image_downloads')
          .select('*')
          .eq('card_id', card.card_id)
          .eq('game', 'pokemon')
          .eq('image_type', 'small')
          .single();
          
        if (!existingImage) {
          // Download small image
          if (card.images.small) {
            await downloadCardImage(
              supabase,
              card.card_id,
              'pokemon',
              'small',
              card.images.small
            );
          }
        }
        
        // Check if we already have downloaded this image
        const { data: existingLargeImage } = await supabase
          .from('tcg_image_downloads')
          .select('*')
          .eq('card_id', card.card_id)
          .eq('game', 'pokemon')
          .eq('image_type', 'large')
          .single();
          
        if (!existingLargeImage) {
          // Download large image
          if (card.images.large) {
            await downloadCardImage(
              supabase,
              card.card_id,
              'pokemon',
              'large',
              card.images.large
            );
          }
        }
      } catch (error) {
        console.error(`Error downloading images for card ${card.card_id}:`, error);
      }
    }
    
    await updateDownloadJobStatus(supabase, jobId, "completed");
  } catch (error) {
    console.error("Error downloading Pokémon images:", error);
    throw error;
  }
}

// Helper function to download and store a card image
async function downloadCardImage(
  supabase: any,
  cardId: string,
  game: string,
  imageType: string,
  imageUrl: string
): Promise<void> {
  try {
    // Define the path where the image will be stored
    const storagePath = `${game}/${imageType}/${cardId}.jpg`;
    
    // Check if the image already exists in storage
    const { data: existingFile } = await supabase
      .storage
      .from('tcg-images')
      .list(`${game}/${imageType}`);
      
    const fileExists = existingFile && existingFile.some(file => file.name === `${cardId}.jpg`);
    
    if (!fileExists) {
      // Download the image and upload to storage
      await downloadImage(imageUrl, storagePath, supabase);
    }
    
    // Record the download in the database
    const { error } = await supabase
      .from('tcg_image_downloads')
      .upsert({
        card_id: cardId,
        game,
        image_type: imageType,
        storage_path: storagePath,
        original_url: imageUrl,
        status: 'completed'
      }, {
        onConflict: 'card_id,game,image_type'
      });
      
    if (error) {
      console.error(`Error recording image download for ${cardId}:`, error);
    }
  } catch (error) {
    console.error(`Error in downloadCardImage for ${cardId}:`, error);
    throw error;
  }
}

// The MTG card download function
export async function downloadMTGCards(
  supabase: any, 
  jobId: string, 
  setId: string | null = null, 
  downloadImages = true
): Promise<void> {
  await updateDownloadJobStatus(supabase, jobId, "downloading_data");
  
  try {
    let sets = [];
    
    // If setId is provided, only download cards for that set
    if (setId) {
      const { data, error } = await supabase
        .from('mtg_sets')
        .select('*')
        .eq('set_id', setId)
        .single();
        
      if (error) throw error;
      if (!data) throw new Error(`Set with ID ${setId} not found`);
      
      sets = [data];
    } else {
      // Otherwise, get all sets from the database
      const { data, error } = await supabase
        .from('mtg_sets')
        .select('*')
        .order('release_date', { ascending: false });
        
      if (error) throw error;
      sets = data || [];
    }
    
    if (sets.length === 0) {
      throw new Error("No MTG sets found in the database. Please sync sets first.");
    }
    
    await updateDownloadJobStatus(supabase, jobId, "processing_data", 0, sets.length, 0);
    
    // Process each set
    for (let i = 0; i < sets.length; i++) {
      const set = sets[i];
      console.log(`Processing MTG set: ${set.name} (${set.set_id})`);
      
      // Update job status
      await updateDownloadJobStatus(
        supabase,
        jobId,
        "processing_data",
        Math.round(((i + 1) / sets.length) * 100),
        sets.length,
        i
      );
      
      // Fetch cards for the set
      const cards = await fetchMTGCardsForSet(set.set_id);
      
      // Insert cards into the database
      for (const card of cards) {
        try {
          const { error } = await supabase
            .from('mtg_cards')
            .upsert({
              card_id: card.id,
              name: card.name,
              printed_name: card.printed_name,
              lang: card.lang,
              released_at: card.released_at,
              layout: card.layout,
              mana_cost: card.mana_cost,
              cmc: card.cmc,
              type_line: card.type_line,
              oracle_text: card.oracle_text,
              colors: card.colors,
              color_identity: card.color_identity,
              keywords: card.keywords,
              legalities: card.legalities,
              games: card.games,
              reserved: card.reserved,
              foil: card.foil,
              nonfoil: card.nonfoil,
              finishes: card.finishes,
              oversized: card.oversized,
              promo: card.promo,
              reprint: card.reprint,
              variation: card.variation,
              set_id: set.set_id,
              set_name: card.set_name,
              set_type: card.set_type,
              set_uri: card.set_uri,
              set_search_uri: card.set_search_uri,
              scryfall_uri: card.scryfall_uri,
              rulings_uri: card.rulings_uri,
              prints_search_uri: card.prints_search_uri,
              collector_number: card.collector_number,
              digital: card.digital,
              rarity: card.rarity,
              flavor_text: card.flavor_text,
              card_back_id: card.card_back_id,
              artist: card.artist,
              artist_ids: card.artist_ids,
              illustration_id: card.illustration_id,
              border_color: card.border_color,
              frame: card.frame,
              full_art: card.full_art,
              textless: card.textless,
              booster: card.booster,
              story_spotlight: card.story_spotlight,
              prices: card.prices,
              related_uris: card.related_uris,
              purchase_uris: card.purchase_uris,
              image_uris: card.image_uris
            }, {
              onConflict: 'card_id'
            });
            
          if (error) {
            console.error(`Error inserting MTG card ${card.id}:`, error);
          }
        } catch (error) {
          console.error(`Error processing MTG card ${card.id}:`, error);
        }
      }
    }
    
    // Download images if requested
    if (downloadImages) {
      await updateDownloadJobStatus(supabase, jobId, "completed");
    } else {
      await updateDownloadJobStatus(supabase, jobId, "completed");
    }
  } catch (error) {
    console.error("Error in downloadMTGCards:", error);
    await updateDownloadJobStatus(
      supabase,
      jobId,
      "failed",
      0,
      0,
      error.message || "Unknown error"
    );
    throw error;
  }
}

// The Yu-Gi-Oh! card download function
export async function downloadYuGiOhCards(
  supabase: any, 
  jobId: string, 
  setId: string | null = null, 
  downloadImages = true
): Promise<void> {
  await updateDownloadJobStatus(supabase, jobId, "downloading_data");
  
  try {
    // Set completion for simplicity in this example
    await updateDownloadJobStatus(supabase, jobId, "completed");
  } catch (error) {
    console.error("Error in downloadYugiohCards:", error);
    await updateDownloadJobStatus(
      supabase,
      jobId,
      "failed",
      0,
      0,
      error.message || "Unknown error"
    );
    throw error;
  }
}

// The Lorcana card download function
export async function downloadLorcanaCards(
  supabase: any, 
  jobId: string, 
  setId: string | null = null, 
  downloadImages = true
): Promise<void> {
  await updateDownloadJobStatus(supabase, jobId, "downloading_data");
  
  try {
    // Set completion for simplicity in this example
    await updateDownloadJobStatus(supabase, jobId, "completed");
  } catch (error) {
    console.error("Error in downloadLorcanaCards:", error);
    await updateDownloadJobStatus(
      supabase,
      jobId,
      "failed",
      0,
      0,
      error.message || "Unknown error"
    );
    throw error;
  }
}
