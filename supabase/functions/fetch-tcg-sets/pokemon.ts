
import { updateApiSyncTime } from "./utils.ts";
import { storeImageInSupabase } from "./storage-utils.ts";
import { updateJobStatus, updateJobProgress, isJobStillRunning } from "./job-utils.ts";

// Increased chunk size to process more sets at once while still allowing resume
const CHUNK_SIZE = 30;
// Card chunk size for processing cards within a set
const CARD_CHUNK_SIZE = 50;

export async function processPokemonSets(jobId, supabase) {
  try {
    await updateJobStatus(jobId, 'fetching_data', null, null, null, null, supabase);
    
    // Ensure card table exists
    await supabase.rpc('create_pokemon_cards_table_if_not_exists').catch(e => {
      console.log("Pokemon cards table creation RPC error (falling back to SQL):", e);
      return supabase.from('_manual_sql').select('*').eq('statement', `
        CREATE TABLE IF NOT EXISTS public.pokemon_cards (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          card_id TEXT UNIQUE NOT NULL,
          set_id TEXT NOT NULL,
          name TEXT NOT NULL,
          supertype TEXT,
          subtypes TEXT[],
          hp TEXT,
          types TEXT[],
          number TEXT,
          artist TEXT,
          rarity TEXT,
          small_image_url TEXT,
          large_image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          CONSTRAINT fk_set
            FOREIGN KEY(set_id)
            REFERENCES pokemon_sets(set_id)
            ON DELETE CASCADE
        );
      `);
    });
    
    // Step 1: Fetch sets from the API
    const sets = await fetchPokemonSets(jobId, supabase);
    const totalSets = sets.length;
    
    if (totalSets === 0) {
      throw new Error("No Pokemon sets found from the API");
    }
    
    console.log(`Found ${totalSets} Pokemon sets`);
    
    // The total items will be sets + (estimated cards per set * sets)
    // Assuming an average of 100 cards per set as estimation
    const estimatedTotalItems = totalSets + (totalSets * 100);
    await updateJobStatus(jobId, 'processing_data', 0, estimatedTotalItems, 0, null, supabase);
    
    // Step 2: Process sets and store in database
    await processChunkedPokemonSets(jobId, 0, estimatedTotalItems, supabase, sets);

    // Step 3: Update sync time - will be done in the final step of chunked processing
    console.log(`Successfully processed ${totalSets} Pokemon sets`);
    return totalSets;
    
  } catch (error) {
    console.error(`Error processing Pokemon sets for job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Process Pokemon sets in chunks to allow for resuming
 */
export async function processChunkedPokemonSets(jobId, startIndex, totalItems, supabase, setsToProcess = null) {
  try {
    console.log(`Starting chunked Pokemon set processing from index ${startIndex}`);
    
    // If no sets are provided, fetch them
    const sets = setsToProcess || await fetchPokemonSets(jobId, supabase);
    const totalSets = sets.length;
    
    if (totalSets === 0) {
      throw new Error("No Pokemon sets found");
    }
    
    // Calculate total progress including card processing
    let processedSetCount = 0;
    let processedCardCount = 0;
    let totalProcessedCount = startIndex; // Include previously processed items
    
    // Process sets in chunks
    for (let i = Math.floor(startIndex / totalSets) * totalSets; i < totalSets; i += CHUNK_SIZE) {
      const endIndex = Math.min(i + CHUNK_SIZE, totalSets);
      console.log(`Processing Pokemon sets chunk ${i} to ${endIndex - 1}`);
      
      // Process this chunk of sets
      const chunkSets = sets.slice(i, endIndex);
      
      // Initialize tracking variables for this chunk
      const chunkStartIndex = totalProcessedCount;
      
      // Process each set in the chunk
      for (const set of chunkSets) {
        try {
          console.log(`Processing set: ${set.id} - ${set.name}`);
          
          // Store set images in Supabase Storage
          let logoUrl = null;
          let symbolUrl = null;
          
          if (set.images?.logo) {
            logoUrl = await storeImageInSupabase(
              set.images.logo,
              'pokemon/logos',
              `${set.id}_logo.png`,
              supabase
            );
          }
          
          if (set.images?.symbol) {
            symbolUrl = await storeImageInSupabase(
              set.images.symbol,
              'pokemon/symbols',
              `${set.id}_symbol.png`,
              supabase
            );
          }
          
          // Save set to database
          const setData = {
            set_id: set.id,
            name: set.name,
            series: set.series,
            printed_total: set.printedTotal,
            total: set.total,
            release_date: set.releaseDate,
            symbol_url: symbolUrl,
            logo_url: logoUrl,
            images_url: JSON.stringify(set.images)
          };
          
          // Insert or update the set
          const { error: upsertError } = await supabase
            .from("pokemon_sets")
            .upsert(setData, {
              onConflict: "set_id"
            });
            
          if (upsertError) {
            console.error(`Error upserting Pokemon set ${set.id}:`, upsertError);
            continue;
          }
          
          // Now fetch and process cards for this set
          await processCardsForSet(set.id, jobId, supabase);
          
          processedSetCount++;
          totalProcessedCount++;
          
          // Update progress - each set counts as 1 progress unit
          const progress = Math.floor((totalProcessedCount / totalItems) * 100);
          await updateJobProgress(jobId, totalProcessedCount, totalItems, supabase);
          
        } catch (setError) {
          console.error(`Error processing Pokemon set ${set?.id}:`, setError);
          // Continue with next set on error
        }
      }
      
      // Check if job is still running before processing next chunk
      const isRunning = await isJobStillRunning(jobId, supabase);
      if (!isRunning) {
        console.log(`Job ${jobId} is no longer running, stopping chunked processing`);
        return;
      }
      
      // Save checkpoint
      if (i + CHUNK_SIZE < totalSets) {
        console.log(`Saving checkpoint at index ${totalProcessedCount}`);
        await updateJobStatus(
          jobId, 
          'processing_data', 
          Math.floor((totalProcessedCount / totalItems) * 100),
          totalItems, 
          totalProcessedCount, 
          null, 
          supabase
        );
      }
    }
    
    // Step 3: Update sync time
    await updateApiSyncTime("pokemon", supabase);
    console.log(`Successfully processed ${processedSetCount} Pokemon sets and their cards`);
    
    // Final update - mark as completed
    const finalProgress = Math.floor((totalProcessedCount / totalItems) * 100);
    await updateJobStatus(jobId, 'completed', 100, totalItems, totalProcessedCount, null, supabase);
    
  } catch (error) {
    console.error(`Error in chunked Pokemon processing for job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Process all cards for a particular set
 */
async function processCardsForSet(setId, jobId, supabase) {
  try {
    console.log(`Fetching cards for Pokemon set ${setId}`);
    
    // Initialize page tracking
    let page = 1;
    let hasMoreCards = true;
    let totalProcessedCards = 0;
    
    // Process cards in pages to handle large sets
    while (hasMoreCards) {
      const cards = await fetchCardsForSet(setId, page, CARD_CHUNK_SIZE);
      
      if (!cards || cards.length === 0) {
        hasMoreCards = false;
        break;
      }
      
      console.log(`Processing ${cards.length} cards from set ${setId} (page ${page})`);
      
      // Process each card in this page
      for (const card of cards) {
        try {
          // Store card images in Supabase Storage
          let smallImageUrl = null;
          let largeImageUrl = null;
          
          if (card.images?.small) {
            smallImageUrl = await storeImageInSupabase(
              card.images.small,
              'pokemon/cards/small',
              `${card.id}_small.jpg`,
              supabase
            );
          }
          
          if (card.images?.large) {
            largeImageUrl = await storeImageInSupabase(
              card.images.large,
              'pokemon/cards/large',
              `${card.id}_large.jpg`,
              supabase
            );
          }
          
          // Prepare card data for upsert
          const cardData = {
            card_id: card.id,
            set_id: card.set.id,
            name: card.name,
            supertype: card.supertype,
            subtypes: card.subtypes,
            hp: card.hp,
            types: card.types,
            number: card.number,
            artist: card.artist,
            rarity: card.rarity,
            small_image_url: smallImageUrl,
            large_image_url: largeImageUrl
          };
          
          // Insert or update the card
          const { error: upsertError } = await supabase
            .from("pokemon_cards")
            .upsert(cardData, {
              onConflict: "card_id"
            });
            
          if (upsertError) {
            console.error(`Error upserting Pokemon card ${card.id}:`, upsertError);
            continue;
          }
          
          totalProcessedCards++;
          
        } catch (cardError) {
          console.error(`Error processing Pokemon card in set ${setId}:`, cardError);
          // Continue with next card on error
        }
      }
      
      // Check if we need to fetch the next page
      if (cards.length < CARD_CHUNK_SIZE) {
        hasMoreCards = false;
      } else {
        page++;
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`Finished processing ${totalProcessedCards} cards for set ${setId}`);
    return totalProcessedCards;
    
  } catch (error) {
    console.error(`Error processing cards for set ${setId}:`, error);
    return 0; // Return 0 to indicate no cards were processed
  }
}

/**
 * Fetch cards for a particular set with pagination
 */
async function fetchCardsForSet(setId, page, pageSize) {
  try {
    const apiKey = Deno.env.get("POKEMON_TCG_API_KEY") || "";
    
    const headers = {
      'X-Api-Key': apiKey,
    };
    
    const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&page=${page}&pageSize=${pageSize}`;
    console.log(`Fetching cards from: ${url}`);
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`Error fetching Pokemon cards for set ${setId}:`, text);
      throw new Error(`Failed to fetch Pokemon cards for set ${setId}: ${response.status} ${text}`);
    }
    
    const data = await response.json();
    return data.data || [];
    
  } catch (error) {
    console.error(`Error fetching cards for set ${setId}:`, error);
    throw error;
  }
}

/**
 * Fetch all Pokemon sets from the API
 */
async function fetchPokemonSets(jobId, supabase) {
  const apiKey = Deno.env.get("POKEMON_TCG_API_KEY") || "";
  
  const headers = {
    'X-Api-Key': apiKey,
  };
  
  try {
    const response = await fetch('https://api.pokemontcg.io/v2/sets?pageSize=500', { headers });
    
    if (!response.ok) {
      const text = await response.text();
      console.error("Error fetching Pokemon sets:", text);
      throw new Error(`Failed to fetch Pokemon sets: ${response.status} ${text}`);
    }
    
    const data = await response.json();
    const sets = data.data || [];
    
    // Log what we found
    console.log(`Successfully fetched ${sets.length} Pokemon sets`);
    
    // Update total items
    await updateJobProgress(jobId, 0, sets.length, supabase);
    
    // Log the complete list of set IDs to help with debugging
    console.log(`Set IDs fetched: ${sets.map(s => s.id).join(', ')}`);
    
    return sets;
  } catch (fetchError) {
    console.error("Error fetching Pokemon sets:", fetchError);
    throw new Error(`Failed to fetch Pokemon sets: ${fetchError.message}`);
  }
}
