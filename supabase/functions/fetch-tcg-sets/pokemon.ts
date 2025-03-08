
import { updateJobStatus, updateJobProgress } from "./job-utils.ts";
import { storeImageInSupabase } from "./storage-utils.ts";
import { updateApiSyncTime } from "./utils.ts";
import { supabase } from "./index.ts";

// Fetch total number of sets 
export async function fetchPokemonSetCount(supabase) {
  try {
    console.log("Fetching total number of Pokemon sets");
    
    const apiKey = Deno.env.get("POKEMON_TCG_API_KEY") || "";
    const headers = {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey
    };
    
    const response = await fetch("https://api.pokemontcg.io/v2/sets", {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const count = data.data?.length || 0;
    
    console.log(`Found ${count} Pokemon sets`);
    return count;
  } catch (error) {
    console.error("Error fetching Pokemon set count:", error);
    throw error;
  }
}

// Process Pokemon sets with chunking
export async function processChunkedPokemonSets(jobId, startIndex = 0, totalItems = 0, supabase, chunkSize = 30) {
  console.log(`Processing Pokemon sets for job ${jobId}, starting at index ${startIndex}, chunk size ${chunkSize}`);
  
  try {
    // If we don't have a total yet, fetch it
    if (!totalItems || totalItems === 0) {
      totalItems = await fetchPokemonSetCount(supabase);
      console.log(`Updated total items to ${totalItems}`);
      
      await updateJobStatus(jobId, 'processing_data', 0, totalItems, startIndex, null, supabase);
    }
    
    const apiKey = Deno.env.get("POKEMON_TCG_API_KEY") || "";
    const headers = {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey
    };
    
    // Fetch all sets
    console.log("Fetching all Pokemon sets from API");
    const setsResponse = await fetch("https://api.pokemontcg.io/v2/sets", {
      headers
    });
    
    if (!setsResponse.ok) {
      throw new Error(`API Error: ${setsResponse.status} ${setsResponse.statusText}`);
    }
    
    const setsData = await setsResponse.json();
    const allSets = setsData.data || [];
    
    console.log(`Found ${allSets.length} sets, processing from index ${startIndex}`);
    
    // Process sets in chunks
    const endIndex = Math.min(startIndex + chunkSize, allSets.length);
    const setsToProcess = allSets.slice(startIndex, endIndex);
    
    console.log(`Processing sets ${startIndex} to ${endIndex-1} (${setsToProcess.length} sets)`);
    
    for (let i = 0; i < setsToProcess.length; i++) {
      const set = setsToProcess[i];
      const currentIndex = startIndex + i;
      const progressPercent = Math.floor((currentIndex / totalItems) * 100);
      
      console.log(`Processing set ${currentIndex+1}/${totalItems}: ${set.name} (${set.id})`);
      
      try {
        // Store set images in Supabase Storage
        console.log(`Storing images for set: ${set.id}`);
        
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
        
        // Insert set info into the database
        const { error: setError } = await supabase.from("pokemon_sets").upsert({
          set_id: set.id,
          name: set.name,
          series: set.series,
          printed_total: set.printedTotal,
          total: set.total,
          release_date: set.releaseDate,
          symbol_url: symbolUrl,
          logo_url: logoUrl,
          images_url: JSON.stringify(set.images)
        }, {
          onConflict: "set_id"
        });
        
        if (setError) {
          console.error(`Error inserting set ${set.id}:`, setError);
        }
        
        // Now fetch and process all cards for this set
        await processCardsForSet(set.id, jobId, currentIndex, totalItems, supabase);
        
        // Update progress
        await updateJobProgress(jobId, currentIndex + 1, totalItems, supabase);
        
      } catch (setError) {
        console.error(`Error processing set ${set.id}:`, setError);
        // Continue with other sets even if one fails
      }
    }
    
    // If we have more sets to process, recurse
    if (endIndex < allSets.length) {
      console.log(`Processed ${endIndex} sets so far, continuing with next chunk`);
      return processChunkedPokemonSets(jobId, endIndex, totalItems, supabase, chunkSize);
    }
    
    // All done, update the last sync time
    await updateApiSyncTime("pokemon", supabase);
    console.log(`Processed all ${allSets.length} Pokemon sets`);
    return allSets.length;
    
  } catch (error) {
    console.error(`Error in processChunkedPokemonSets:`, error);
    throw error;
  }
}

// Process all cards for a specific set
async function processCardsForSet(setId, jobId, currentSetIndex, totalSets, supabase) {
  try {
    console.log(`Fetching cards for set: ${setId}`);
    
    const apiKey = Deno.env.get("POKEMON_TCG_API_KEY") || "";
    const headers = {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey
    };
    
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const cards = data.data || [];
    
    console.log(`Found ${cards.length} cards in set ${setId}`);
    
    // Process cards in batches to avoid overwhelming the database
    const batchSize = 20;
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize);
      console.log(`Processing batch of ${batch.length} cards (${i}-${i+batch.length}) for set ${setId}`);
      
      const cardInserts = [];
      
      for (const card of batch) {
        try {
          // Store card images
          const largeUrl = await storeImageInSupabase(
            card.images.large,
            'pokemon/cards/large',
            `${card.id}_large.png`,
            supabase
          );
          
          const smallUrl = await storeImageInSupabase(
            card.images.small,
            'pokemon/cards/small',
            `${card.id}_small.png`,
            supabase
          );
          
          // Prepare card data with stored image URLs
          const cardImages = {
            small: smallUrl,
            large: largeUrl
          };
          
          // Create card object for database
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
            attacks: card.attacks,
            weaknesses: card.weaknesses,
            resistances: card.resistances,
            retreat_cost: card.retreatCost,
            converted_retreat_cost: card.convertedRetreatCost,
            set_id: card.set.id,
            number: card.number,
            artist: card.artist,
            rarity: card.rarity,
            flavor_text: card.flavorText,
            national_pokedex_numbers: card.nationalPokedexNumbers,
            legalities: card.legalities,
            images: cardImages,
            tcgplayer: card.tcgplayer,
            cardmarket: card.cardmarket
          };
          
          cardInserts.push(cardData);
          
        } catch (cardError) {
          console.error(`Error processing card ${card.id}:`, cardError);
          // Continue with other cards
        }
      }
      
      // Insert batch of cards into database
      if (cardInserts.length > 0) {
        console.log(`Inserting batch of ${cardInserts.length} cards into database`);
        
        const { error: insertError } = await supabase
          .from("pokemon_cards")
          .upsert(cardInserts, {
            onConflict: "id"
          });
          
        if (insertError) {
          console.error(`Error inserting cards batch for set ${setId}:`, insertError);
        }
      }
    }
    
    console.log(`Completed processing all cards for set ${setId}`);
    
  } catch (error) {
    console.error(`Error processing cards for set ${setId}:`, error);
    throw error;
  }
}
