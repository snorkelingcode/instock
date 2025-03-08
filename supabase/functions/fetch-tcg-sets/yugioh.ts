
import { updateJobStatus } from "./job-utils.ts";
import { storeImageInSupabase } from "./storage-utils.ts";
import { updateApiSyncTime } from "./utils.ts";

// Process Yu-Gi-Oh! sets in the background
export async function processYugiohSets(jobId, supabase) {
  console.log(`Processing Yu-Gi-Oh! sets for job ${jobId}...`);
  
  try {
    await updateJobStatus(jobId, 'fetching_data', null, null, null, null, supabase);
    console.log("Sending request to Yu-Gi-Oh! API");
    const response = await fetch("https://db.ygoprodeck.com/api/v7/cardsets.php");

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Yu-Gi-Oh! API error: ${response.status}`, errorText);
      throw new Error(`Yu-Gi-Oh! API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const setCount = data?.length || 0;
    console.log(`Received ${setCount} Yu-Gi-Oh! sets from API`);
    
    // Calculate total items (sets + cards for each set)
    // Estimate for progress calculation
    const estimatedTotalItems = setCount * 2; // Each set counts as 1, and its cards collectively as 1 more
    await updateJobStatus(jobId, 'processing_data', 0, estimatedTotalItems, 0, null, supabase);
    
    // Process sets
    const sets = [];
    let completedItems = 0;
    
    for (const set of data) {
      console.log(`Processing set: ${set.set_code} - ${set.set_name}`);
      
      // Try to get a card from this set to use its image
      let setImage = null;
      try {
        const cardResponse = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=${encodeURIComponent(set.set_name)}&num=1&offset=0`);
        if (cardResponse.ok) {
          const cardData = await cardResponse.json();
          if (cardData.data && cardData.data.length > 0 && cardData.data[0].card_images && cardData.data[0].card_images.length > 0) {
            const imageUrl = cardData.data[0].card_images[0].image_url;
            setImage = await storeImageInSupabase(
              imageUrl,
              'yugioh/sets',
              `${set.set_code}_set.jpg`,
              supabase
            );
          }
        }
      } catch (e) {
        console.error(`Error fetching card image for set ${set.set_name}:`, e);
        // Continue without an image
      }
      
      sets.push({
        set_id: set.set_code,
        name: set.set_name,
        set_code: set.set_code,
        num_of_cards: set.num_of_cards || 0,
        tcg_date: set.tcg_date,
        set_image: setImage,
        set_type: set.set_type || "N/A",
      });
      
      completedItems++;
      const progress = Math.round((completedItems / estimatedTotalItems) * 100);
      await updateJobStatus(jobId, 'processing_data', progress, estimatedTotalItems, completedItems, null, supabase);
    }

    console.log(`Processing ${sets.length} Yu-Gi-Oh! sets for database insertion`);
    await updateJobStatus(jobId, 'saving_to_database', null, null, null, null, supabase);

    // Insert sets into database (upsert to avoid duplicates)
    const { error } = await supabase.from("yugioh_sets").upsert(sets, {
      onConflict: "set_id",
    });

    if (error) {
      console.error("Error inserting Yu-Gi-Oh! sets:", error);
      throw error;
    }
    
    // Now fetch and store card images for each set
    console.log("Now fetching card images for all Yu-Gi-Oh! sets");
    for (const set of sets) {
      await fetchAndStoreYugiohCardImages(set.name, jobId, estimatedTotalItems, completedItems, supabase);
      completedItems++;
    }

    // Update last sync time
    await updateApiSyncTime("yugioh", supabase);
    console.log("Successfully imported and updated Yu-Gi-Oh! sets and cards");

    return sets.length;
  } catch (error) {
    console.error("Error fetching Yu-Gi-Oh! sets:", error);
    throw error;
  }
}

// Enhanced function to fetch and store card images for Yu-Gi-Oh!
export async function fetchAndStoreYugiohCardImages(setName, jobId, totalItemsCount, completedItemsCount, supabase) {
  try {
    console.log(`Fetching cards for Yu-Gi-Oh! set: ${setName}`);
    
    // The YGOPRODeck API uses the set name for filtering
    const encodedSetName = encodeURIComponent(setName);
    const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=${encodedSetName}`);
    
    if (!response.ok) {
      console.error(`Error fetching cards for Yu-Gi-Oh! set ${setName}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const cards = data.data || [];
    console.log(`Found ${cards.length} cards in Yu-Gi-Oh! set ${setName}`);
    
    // Create a table for storing Yu-Gi-Oh! cards if it doesn't exist
    await supabase.rpc('create_yugioh_cards_table_if_not_exists').catch(e => {
      console.log("Yu-Gi-Oh! cards table creation RPC error (may attempt SQL):", e);
      
      // Try direct SQL if RPC fails
      return supabase.from('_manual_sql').select('*').eq('statement', `
        CREATE TABLE IF NOT EXISTS public.yugioh_cards (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          card_id INTEGER NOT NULL,
          set_id TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT,
          desc TEXT,
          atk INTEGER,
          def INTEGER,
          level INTEGER,
          race TEXT,
          attribute TEXT,
          image_url TEXT,
          image_url_small TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          CONSTRAINT yugioh_cards_card_id_key UNIQUE (card_id),
          CONSTRAINT fk_set
            FOREIGN KEY(set_id)
            REFERENCES yugioh_sets(set_id)
            ON DELETE CASCADE
        );
      `);
    });
    
    const totalCards = cards.length;
    let processedCards = 0;
    const storedCards = [];
    
    // Get set_id from set name
    const { data: setData, error: setError } = await supabase
      .from("yugioh_sets")
      .select("set_id")
      .eq("name", setName)
      .single();
      
    if (setError) {
      console.error(`Error finding Yu-Gi-Oh! set ID for ${setName}:`, setError);
      return 0;
    }
    
    const setId = setData.set_id;
    
    for (const card of cards) {
      try {
        if (!card.id || !card.name) {
          console.log(`Skipping Yu-Gi-Oh! card with missing id or name: ${card.id}`);
          continue;
        }
        
        console.log(`Processing Yu-Gi-Oh! card: ${card.id} - ${card.name}`);
        
        // Store card image in Supabase if available
        let imageUrl = null;
        let imageUrlSmall = null;
        
        if (card.card_images && card.card_images.length > 0) {
          const imageObj = card.card_images[0];
          
          if (imageObj.image_url) {
            imageUrl = await storeImageInSupabase(
              imageObj.image_url,
              'yugioh/cards',
              `${card.id}_card.jpg`,
              supabase
            );
          }
          
          if (imageObj.image_url_small) {
            imageUrlSmall = await storeImageInSupabase(
              imageObj.image_url_small,
              'yugioh/cards/small',
              `${card.id}_small.jpg`,
              supabase
            );
          }
        }
        
        // Prepare card data for storage
        const cardData = {
          card_id: card.id,
          set_id: setId,
          name: card.name,
          type: card.type,
          desc: card.desc,
          atk: card.atk,
          def: card.def,
          level: card.level,
          race: card.race,
          attribute: card.attribute,
          image_url: imageUrl,
          image_url_small: imageUrlSmall
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
        console.error(`Error processing Yu-Gi-Oh! card ${card.id}:`, cardError);
        // Continue with other cards
      }
    }
    
    // Batch insert cards to improve performance
    if (storedCards.length > 0) {
      console.log(`Inserting ${storedCards.length} Yu-Gi-Oh! cards into database`);
      const { error } = await supabase
        .from("yugioh_cards")
        .upsert(storedCards, {
          onConflict: "card_id",
        });
        
      if (error) {
        console.error("Error inserting Yu-Gi-Oh! cards:", error);
      }
    }
    
    return processedCards;
  } catch (error) {
    console.error(`Error fetching cards for Yu-Gi-Oh! set ${setName}:`, error);
    return 0;
  }
}
