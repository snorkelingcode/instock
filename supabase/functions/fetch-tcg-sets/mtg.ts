
import { updateJobStatus } from "./job-utils.ts";
import { storeImageInSupabase } from "./storage-utils.ts";
import { updateApiSyncTime } from "./utils.ts";

// Process MTG sets in the background
export async function processMTGSets(jobId, supabase) {
  console.log(`Processing Magic: The Gathering sets for job ${jobId}...`);
  
  try {
    const mtgApiKey = Deno.env.get("MTG_API_KEY") || "";
    
    await updateJobStatus(jobId, 'fetching_data', null, null, null, null, supabase);
    console.log("Sending request to MTG API");
    const response = await fetch("https://api.magicthegathering.io/v1/sets");

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`MTG API error: ${response.status}`, errorText);
      throw new Error(`MTG API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const setCount = data.sets?.length || 0;
    console.log(`Received ${setCount} MTG sets from API`);
    
    // Calculate total items (sets + cards for each set)
    // Estimate for progress calculation
    const estimatedTotalItems = setCount * 2; // Each set counts as 1, and its cards collectively as 1 more
    await updateJobStatus(jobId, 'processing_data', 0, estimatedTotalItems, 0, null, supabase);
    
    // Process sets and store images in Supabase Storage
    const sets = [];
    let completedItems = 0;
    
    for (const set of data.sets) {
      console.log(`Processing set: ${set.code} - ${set.name}`);
      
      // Store set images in Supabase Storage
      const symbolUrl = await storeImageInSupabase(
        set.symbolUrl, 
        'mtg/symbols', 
        `${set.code}_symbol.png`,
        supabase
      );
      
      const logoUrl = await storeImageInSupabase(
        set.logoUrl || set.symbolUrl, 
        'mtg/logos', 
        `${set.code}_logo.png`,
        supabase
      );
      
      sets.push({
        set_id: set.code,
        name: set.name,
        code: set.code,
        release_date: set.releaseDate,
        set_type: set.type,
        card_count: set.cardCount,
        icon_url: symbolUrl,
        image_url: logoUrl,
      });
      
      completedItems++;
      const progress = Math.round((completedItems / estimatedTotalItems) * 100);
      await updateJobStatus(jobId, 'processing_data', progress, estimatedTotalItems, completedItems, null, supabase);
    }

    console.log(`Processing ${sets.length} MTG sets for database insertion`);
    await updateJobStatus(jobId, 'saving_to_database', null, null, null, null, supabase);

    // Insert sets into database (upsert to avoid duplicates)
    const { error } = await supabase.from("mtg_sets").upsert(sets, {
      onConflict: "set_id",
    });

    if (error) {
      console.error("Error inserting MTG sets:", error);
      throw error;
    }
    
    // Now fetch and store card images for each set
    console.log("Now fetching card images for all MTG sets");
    for (const set of sets) {
      await fetchAndStoreMTGCardImages(set.code, jobId, estimatedTotalItems, completedItems, supabase);
      completedItems++;
    }

    // Update last sync time
    await updateApiSyncTime("mtg", supabase);
    console.log("Successfully imported and updated MTG sets and cards");

    return sets.length;
  } catch (error) {
    console.error("Error fetching MTG sets:", error);
    throw error;
  }
}

// Enhanced function to fetch and store card images for MTG
export async function fetchAndStoreMTGCardImages(setCode, jobId, totalItemsCount, completedItemsCount, supabase) {
  try {
    console.log(`Fetching cards for MTG set: ${setCode}`);
    
    const response = await fetch(`https://api.magicthegathering.io/v1/cards?set=${setCode}`);
    
    if (!response.ok) {
      console.error(`Error fetching cards for MTG set ${setCode}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const cards = data.cards || [];
    console.log(`Found ${cards.length} cards in MTG set ${setCode}`);
    
    // Create a table for storing MTG cards if it doesn't exist
    await supabase.rpc('create_mtg_cards_table_if_not_exists').catch(e => {
      console.log("MTG cards table creation RPC error (may attempt SQL):", e);
      
      // Try direct SQL if RPC fails
      return supabase.from('_manual_sql').select('*').eq('statement', `
        CREATE TABLE IF NOT EXISTS public.mtg_cards (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          card_id TEXT UNIQUE NOT NULL,
          set_id TEXT NOT NULL,
          name TEXT NOT NULL,
          mana_cost TEXT,
          cmc NUMERIC,
          type TEXT,
          rarity TEXT,
          text TEXT,
          flavor TEXT,
          artist TEXT,
          number TEXT,
          power TEXT,
          toughness TEXT,
          layout TEXT,
          image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          CONSTRAINT fk_set
            FOREIGN KEY(set_id)
            REFERENCES mtg_sets(set_id)
            ON DELETE CASCADE
        );
      `);
    });
    
    const totalCards = cards.length;
    let processedCards = 0;
    const storedCards = [];
    
    for (const card of cards) {
      try {
        if (!card.id || !card.name) {
          console.log(`Skipping card with missing id or name: ${card.id}`);
          continue;
        }
        
        console.log(`Processing MTG card: ${card.id} - ${card.name}`);
        
        // Store card image in Supabase if available
        let imageUrl = null;
        if (card.imageUrl) {
          imageUrl = await storeImageInSupabase(
            card.imageUrl,
            'mtg/cards',
            `${card.id}_card.jpg`,
            supabase
          );
        }
        
        // Prepare card data for storage
        const cardData = {
          card_id: card.id,
          set_id: card.set,
          name: card.name,
          mana_cost: card.manaCost,
          cmc: card.cmc,
          type: card.type,
          rarity: card.rarity,
          text: card.text,
          flavor: card.flavor,
          artist: card.artist,
          number: card.number,
          power: card.power,
          toughness: card.toughness,
          layout: card.layout,
          image_url: imageUrl
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
        console.error(`Error processing MTG card ${card.id}:`, cardError);
        // Continue with other cards
      }
    }
    
    // Batch insert cards to improve performance
    if (storedCards.length > 0) {
      console.log(`Inserting ${storedCards.length} MTG cards into database`);
      const { error } = await supabase
        .from("mtg_cards")
        .upsert(storedCards, {
          onConflict: "card_id",
        });
        
      if (error) {
        console.error("Error inserting MTG cards:", error);
      }
    }
    
    return processedCards;
  } catch (error) {
    console.error(`Error fetching cards for MTG set ${setCode}:`, error);
    return 0;
  }
}
