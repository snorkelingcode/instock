
import { updateJobStatus, updateJobProgress } from "./job-utils.ts";
import { storeImageInSupabase } from "./storage-utils.ts";
import { createPokemonTablesIfNeeded } from "./pokemon-tables.ts";

// Function to fetch the total number of Pokemon sets
export async function fetchPokemonSetCount(supabase) {
  try {
    // Make sure tables exist first
    await createPokemonTablesIfNeeded(supabase);
    
    // Fetch from the Pokemon TCG API
    const apiKey = Deno.env.get("POKEMON_TCG_API_KEY") || "";
    const headers = apiKey ? { "X-Api-Key": apiKey } : {};
    
    console.log("Fetching Pokemon sets count from API");
    const response = await fetch("https://api.pokemontcg.io/v2/sets", { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Pokemon sets: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Return the total count from the pagination info, or the length of data if that's not available
    let totalCount = 0;
    if (data.totalCount !== undefined && data.totalCount !== null) {
      totalCount = data.totalCount;
    } else if (data.data && Array.isArray(data.data)) {
      totalCount = data.data.length;
    } else {
      throw new Error("Could not determine total set count from API response");
    }
    
    console.log(`Found ${totalCount} total Pokemon sets`);
    return totalCount;
  } catch (error) {
    console.error("Error fetching Pokemon set count:", error);
    throw error;
  }
}

// Function to process Pokemon sets data in chunks
export async function processChunkedPokemonSets(jobId, startIndex = 0, totalItems = 0, supabase, chunkSize = 30) {
  try {
    console.log(`Processing Pokemon sets for job ${jobId}...`);
    console.log(`Starting from index ${startIndex}, chunk size: ${chunkSize}`);
    
    // Make sure tables exist
    await createPokemonTablesIfNeeded(supabase);
    
    const apiKey = Deno.env.get("POKEMON_TCG_API_KEY") || "";
    const headers = apiKey ? { "X-Api-Key": apiKey } : {};
    
    // If we don't have totalItems yet, get the total count
    if (!totalItems || totalItems === 0) {
      const totalCount = await fetchPokemonSetCount(supabase);
      totalItems = totalCount;
      
      // Update job status with the total
      await updateJobStatus(
        jobId, 
        'processing_data', 
        0, 
        totalCount, 
        startIndex, 
        null, 
        supabase
      );
    }
    
    // Fetch all sets from the API
    console.log("Fetching all Pokemon sets...");
    const response = await fetch("https://api.pokemontcg.io/v2/sets", {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Pokemon sets: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const allSets = data.data || [];
    
    if (allSets.length === 0) {
      throw new Error("No sets returned from the Pokemon TCG API");
    }
    
    console.log(`Successfully retrieved ${allSets.length} Pokemon sets`);
    
    // Process sets in the current chunk
    const endIndex = Math.min(startIndex + chunkSize, allSets.length);
    const setsToProcess = allSets.slice(startIndex, endIndex);
    
    console.log(`Processing ${setsToProcess.length} sets in current chunk (${startIndex+1} to ${endIndex})`);
    
    // Process each set in the chunk
    for (let i = 0; i < setsToProcess.length; i++) {
      const set = setsToProcess[i];
      const currentIndex = startIndex + i;
      
      console.log(`Processing set ${currentIndex+1}/${allSets.length}: ${set.name} (${set.id})`);
      
      try {
        // Store set images in Supabase Storage
        const symbolUrl = await storeImageInSupabase(
          set.images.symbol,
          'pokemon/symbols',
          `${set.id}_symbol.png`,
          supabase
        );
        
        const logoUrl = await storeImageInSupabase(
          set.images.logo,
          'pokemon/logos',
          `${set.id}_logo.png`,
          supabase
        );
        
        // Insert/update set data in the database
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
        
        const { error: setError } = await supabase
          .from("pokemon_sets")
          .upsert(setData, {
            onConflict: "set_id"
          });
          
        if (setError) {
          console.error(`Error upserting set ${set.id}:`, setError);
        } else {
          console.log(`Successfully saved set ${set.id} to database`);
        }
        
        // Fetch and process all cards for this set
        await processCardsForSet(set.id, jobId, currentIndex, allSets.length, supabase);
        
        // Update progress after each set (including its cards) is processed
        await updateJobProgress(jobId, currentIndex + 1, allSets.length, supabase);
        
      } catch (setError) {
        console.error(`Error processing set ${set?.id || "unknown"}:`, setError);
        // Continue with next set
      }
    }
    
    // If we have more sets to process, recurse to the next chunk
    if (endIndex < allSets.length) {
      console.log(`Finished chunk. Continuing with next chunk starting at index ${endIndex}`);
      return processChunkedPokemonSets(jobId, endIndex, allSets.length, supabase, chunkSize);
    }
    
    console.log(`Completed processing all ${allSets.length} Pokemon sets and their cards`);
    return allSets.length;
    
  } catch (error) {
    console.error("Error in processChunkedPokemonSets:", error);
    throw error;
  }
}

// Process all cards for a specific set
async function processCardsForSet(setId, jobId, currentSetIndex, totalSets, supabase) {
  try {
    console.log(`Fetching cards for set ${setId}...`);
    
    const apiKey = Deno.env.get("POKEMON_TCG_API_KEY") || "";
    const headers = apiKey ? { "X-Api-Key": apiKey } : {};
    
    // Fetch all cards for this set
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&orderBy=number`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch cards for set ${setId}: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const cards = data.data || [];
    
    console.log(`Found ${cards.length} cards in set ${setId}`);
    
    // Process cards in smaller batches to avoid overwhelming the DB
    const batchSize = 20;
    for (let i = 0; i < cards.length; i += batchSize) {
      const cardBatch = cards.slice(i, i + batchSize);
      console.log(`Processing batch of ${cardBatch.length} cards (${i+1}-${Math.min(i+batchSize, cards.length)}) for set ${setId}`);
      
      const cardsToInsert = [];
      
      // Process each card in the batch
      for (const card of cardBatch) {
        try {
          // Store card images in Supabase Storage
          const smallImageUrl = await storeImageInSupabase(
            card.images.small,
            'pokemon/cards/small',
            `${card.id}_small.png`,
            supabase
          );
          
          const largeImageUrl = await storeImageInSupabase(
            card.images.large,
            'pokemon/cards/large',
            `${card.id}_large.png`,
            supabase
          );
          
          // Prepare the card's image data for storage
          const imageData = {
            small: smallImageUrl,
            large: largeImageUrl
          };
          
          // Prepare the card data for database insertion
          const cardData = {
            id: card.id,
            name: card.name,
            supertype: card.supertype,
            subtypes: card.subtypes,
            hp: card.hp,
            types: card.types,
            evolves_from: card.evolvesFrom,
            evolves_to: card.evolvesTo,
            rules: card.rules,
            attacks: card.attacks ? JSON.stringify(card.attacks) : null,
            weaknesses: card.weaknesses ? JSON.stringify(card.weaknesses) : null,
            resistances: card.resistances ? JSON.stringify(card.resistances) : null,
            retreat_cost: card.retreatCost,
            converted_retreat_cost: card.convertedRetreatCost,
            set_id: card.set.id,
            number: card.number,
            artist: card.artist,
            rarity: card.rarity,
            flavor_text: card.flavorText,
            national_pokedex_numbers: card.nationalPokedexNumbers,
            legalities: card.legalities ? JSON.stringify(card.legalities) : null,
            images: JSON.stringify(imageData),
            tcgplayer: card.tcgplayer ? JSON.stringify(card.tcgplayer) : null,
            cardmarket: card.cardmarket ? JSON.stringify(card.cardmarket) : null
          };
          
          cardsToInsert.push(cardData);
          
        } catch (cardError) {
          console.error(`Error processing card ${card?.id || "unknown"}:`, cardError);
          // Continue with next card
        }
      }
      
      // Insert the batch of cards into the database
      if (cardsToInsert.length > 0) {
        console.log(`Upserting ${cardsToInsert.length} cards into database`);
        
        const { error } = await supabase
          .from("pokemon_cards")
          .upsert(cardsToInsert, {
            onConflict: "id"
          });
          
        if (error) {
          console.error(`Error upserting cards for set ${setId}:`, error);
        } else {
          console.log(`Successfully saved ${cardsToInsert.length} cards to database`);
        }
      }
    }
    
    console.log(`Completed processing all cards for set ${setId}`);
    
  } catch (error) {
    console.error(`Error processing cards for set ${setId}:`, error);
    throw error;
  }
}
