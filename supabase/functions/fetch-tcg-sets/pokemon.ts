
import { updateJobStatus } from "./job-utils.ts";
import { storeImageInSupabase } from "./storage-utils.ts";
import { updateApiSyncTime } from "./utils.ts";

// Process Pokémon sets in the background
export async function processPokemonSets(jobId, supabase) {
  console.log(`Processing Pokémon TCG sets for job ${jobId}...`);
  
  try {
    const pokemonApiKey = Deno.env.get("POKEMON_TCG_API_KEY") || "";
    const headers = {};
    if (pokemonApiKey) {
      headers["X-Api-Key"] = pokemonApiKey;
      console.log("Using Pokemon TCG API key");
    } else {
      console.log("No Pokemon TCG API key provided");
    }

    await updateJobStatus(jobId, 'fetching_data', null, null, null, null, supabase);
    console.log("Sending request to Pokemon TCG API");
    const response = await fetch("https://api.pokemontcg.io/v2/sets", {
      headers: pokemonApiKey ? headers : {},
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pokémon API error: ${response.status}`, errorText);
      throw new Error(`Pokémon API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const setCount = data.data?.length || 0;
    console.log(`Received ${setCount} Pokémon sets from API`);
    
    // Calculate total items (sets + cards for each set)
    // Estimate average of 100 cards per set for progress calculation
    const estimatedTotalItems = setCount * 2; // Each set counts as 1, and its cards collectively as 1 more
    await updateJobStatus(jobId, 'processing_data', 0, estimatedTotalItems, 0, null, supabase);
    
    // Process sets and store images in Supabase Storage
    const sets = [];
    let completedItems = 0;
    
    for (const set of data.data) {
      console.log(`Processing set: ${set.id} - ${set.name}`);
      
      // Store set images in Supabase Storage
      const symbolUrl = await storeImageInSupabase(
        set.images?.symbol, 
        'pokemon/symbols', 
        `${set.id}_symbol.png`,
        supabase
      );
      
      const logoUrl = await storeImageInSupabase(
        set.images?.logo, 
        'pokemon/logos', 
        `${set.id}_logo.png`,
        supabase
      );
      
      sets.push({
        set_id: set.id,
        name: set.name,
        series: set.series,
        printed_total: set.printedTotal,
        total: set.total,
        release_date: set.releaseDate,
        symbol_url: symbolUrl,
        logo_url: logoUrl,
        images_url: null,
      });
      
      completedItems++;
      const progress = Math.round((completedItems / estimatedTotalItems) * 100);
      await updateJobStatus(jobId, 'processing_data', progress, estimatedTotalItems, completedItems, null, supabase);
    }

    console.log(`Processing ${sets.length} Pokémon sets for database insertion`);
    await updateJobStatus(jobId, 'saving_to_database', null, null, null, null, supabase);

    // Insert sets into database (upsert to avoid duplicates)
    const { error } = await supabase.from("pokemon_sets").upsert(sets, {
      onConflict: "set_id",
    });

    if (error) {
      console.error("Error inserting Pokémon sets:", error);
      throw error;
    }
    
    // Now fetch and store card images for each set
    console.log("Now fetching card images for all Pokemon sets");
    for (const set of sets) {
      await fetchAndStoreCardImages(set.set_id, jobId, estimatedTotalItems, completedItems, supabase, headers);
      completedItems++;
    }

    // Update last sync time
    await updateApiSyncTime("pokemon", supabase);
    console.log("Successfully imported and updated Pokémon sets and cards");

    return sets.length;
  } catch (error) {
    console.error("Error fetching Pokémon sets:", error);
    throw error;
  }
}

// Enhanced function to fetch and store card images for Pokémon TCG
export async function fetchAndStoreCardImages(setId, jobId, totalItemsCount, completedItemsCount, supabase, headers) {
  try {
    console.log(`Fetching cards for set: ${setId}`);
    
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=250`, {
      headers
    });
    
    if (!response.ok) {
      console.error(`Error fetching cards for set ${setId}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const cards = data.data || [];
    console.log(`Found ${cards.length} cards in set ${setId}`);
    
    // Create a table for storing Pokémon cards if it doesn't exist
    await supabase.rpc('create_pokemon_cards_table_if_not_exists').catch(e => {
      console.log("Pokemon cards table creation RPC error (may attempt SQL):", e);
      
      // Try direct SQL if RPC fails
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
    
    const totalCards = cards.length;
    let processedCards = 0;
    const storedCards = [];
    
    for (const card of cards) {
      try {
        console.log(`Processing card: ${card.id} - ${card.name}`);
        
        // Store card images in Supabase
        const smallImageUrl = await storeImageInSupabase(
          card.images?.small,
          'pokemon/cards/small',
          `${card.id}_small.jpg`,
          supabase
        );
        
        const largeImageUrl = await storeImageInSupabase(
          card.images?.large,
          'pokemon/cards/large',
          `${card.id}_large.jpg`,
          supabase
        );
        
        // Prepare card data for storage
        const cardData = {
          card_id: card.id,
          set_id: card.set.id,
          name: card.name,
          supertype: card.supertype,
          subtypes: card.subtypes || [],
          hp: card.hp,
          types: card.types || [],
          number: card.number,
          artist: card.artist,
          rarity: card.rarity,
          small_image_url: smallImageUrl,
          large_image_url: largeImageUrl
        };
        
        storedCards.push(cardData);
        
        // Update job status periodically
        processedCards++;
        let newCompletedItemsCount = completedItemsCount;
        
        if (processedCards % 10 === 0 || processedCards === totalCards) {
          newCompletedItemsCount = completedItemsCount + (processedCards / totalCards);
          const progress = Math.round((newCompletedItemsCount / totalItemsCount) * 100);
          await updateJobStatus(jobId, 'processing_data', progress, totalItemsCount, newCompletedItemsCount, null, supabase);
        }
      } catch (cardError) {
        console.error(`Error processing card ${card.id}:`, cardError);
        // Continue with other cards
      }
    }
    
    // Batch insert cards to improve performance
    if (storedCards.length > 0) {
      console.log(`Inserting ${storedCards.length} Pokemon cards into database`);
      const { error } = await supabase
        .from("pokemon_cards")
        .upsert(storedCards, {
          onConflict: "card_id",
        });
        
      if (error) {
        console.error("Error inserting Pokémon cards:", error);
      }
    }
    
    return processedCards;
  } catch (error) {
    console.error(`Error fetching cards for set ${setId}:`, error);
    return 0;
  }
}
