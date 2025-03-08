
import { updateJobStatus } from "./job-utils.ts";
import { storeImageInSupabase } from "./storage-utils.ts";
import { updateApiSyncTime } from "./utils.ts";

// Process Disney Lorcana sets in the background
export async function processLorcanaSets(jobId, supabase) {
  console.log(`Processing Disney Lorcana sets for job ${jobId}...`);
  
  try {
    await updateJobStatus(jobId, 'processing_data', null, null, null, null, supabase);
    
    // We'll manually insert some Lorcana sets since there's no official API
    const setData = [
      {
        set_id: "TFC",
        name: "The First Chapter",
        release_date: "2023-08-18",
        set_code: "TFC",
        total_cards: 204,
        set_image: "https://lorcana-api.com/images/emblems/TFC.png",
        set_type: "Main Set",
      },
      {
        set_id: "ROA",
        name: "Rise of the Floodborn",
        release_date: "2023-12-01",
        set_code: "ROA",
        total_cards: 204,
        set_image: "https://lorcana-api.com/images/emblems/ROA.png",
        set_type: "Main Set",
      },
      {
        set_id: "ITM",
        name: "Into the Inklands",
        release_date: "2024-03-08",
        set_code: "ITM",
        total_cards: 204,
        set_image: "https://lorcana-api.com/images/emblems/ITM.png",
        set_type: "Main Set",
      },
      {
        set_id: "UPR",
        name: "Ursula's Return",
        release_date: "2024-06-21",
        set_code: "UPR",
        total_cards: 204,
        set_image: "https://lorcana-api.com/images/emblems/UPR.png", 
        set_type: "Main Set",
      },
    ];

    const setCount = setData.length;
    // For Lorcana, we'll count sets and cards
    const estimatedTotalItems = setCount + 1; // +1 for all cards
    await updateJobStatus(jobId, 'processing_data', 0, estimatedTotalItems, 0, null, supabase);

    // Download and store images locally
    const sets = [];
    let completedItems = 0;
    
    for (const set of setData) {
      console.log(`Processing Lorcana set: ${set.set_id} - ${set.name}`);
      
      // Store set image in Supabase Storage
      const setImage = await storeImageInSupabase(
        set.set_image,
        'lorcana/sets',
        `${set.set_id}_set.png`,
        supabase
      );
      
      sets.push({
        ...set,
        set_image: setImage
      });
      
      completedItems++;
      const progress = Math.round((completedItems / estimatedTotalItems) * 100);
      await updateJobStatus(jobId, 'processing_data', progress, estimatedTotalItems, completedItems, null, supabase);
    }

    console.log(`Processing ${sets.length} Disney Lorcana sets for database insertion`);
    await updateJobStatus(jobId, 'saving_to_database', null, null, null, null, supabase);

    // Insert sets into database (upsert to avoid duplicates)
    const { error } = await supabase.from("lorcana_sets").upsert(sets, {
      onConflict: "set_id",
    });

    if (error) {
      console.error("Error inserting Disney Lorcana sets:", error);
      throw error;
    }
    
    // Create sample Lorcana cards
    await createLorcanaCards(jobId, estimatedTotalItems, completedItems, supabase);

    // Update last sync time
    await updateApiSyncTime("lorcana", supabase);
    console.log("Successfully added Disney Lorcana sets and cards");

    return sets.length;
  } catch (error) {
    console.error("Error adding Disney Lorcana sets:", error);
    throw error;
  }
}

// Enhanced function to create Lorcana cards
export async function createLorcanaCards(jobId, totalItemsCount, completedItemsCount, supabase) {
  try {
    console.log(`Creating Lorcana cards table and sample cards`);
    
    // Create a table for storing Lorcana cards if it doesn't exist
    await supabase.rpc('create_lorcana_cards_table_if_not_exists').catch(e => {
      console.log("Lorcana cards table creation RPC error (may attempt SQL):", e);
      
      // Try direct SQL if RPC fails
      return supabase.from('_manual_sql').select('*').eq('statement', `
        CREATE TABLE IF NOT EXISTS public.lorcana_cards (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          card_id TEXT UNIQUE NOT NULL,
          set_id TEXT NOT NULL,
          name TEXT NOT NULL,
          cost INTEGER,
          ink_color TEXT,
          type TEXT,
          rarity TEXT,
          inkwell INTEGER,
          strength INTEGER,
          willpower INTEGER,
          image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          CONSTRAINT fk_set
            FOREIGN KEY(set_id)
            REFERENCES lorcana_sets(set_id)
            ON DELETE CASCADE
        );
      `);
    });
    
    // Sample Lorcana cards (first set) - in a real scenario, you would fetch these from an API
    const sampleCards = [
      {
        card_id: "TFC-001",
        set_id: "TFC",
        name: "Mickey Mouse, Brave Little Tailor",
        cost: 4,
        ink_color: "Amber",
        type: "Character",
        rarity: "Super Rare",
        inkwell: 2,
        strength: 3,
        willpower: 4,
        image_url: "https://lorcana-api.com/images/cards/TFC/TFC-001.webp"
      },
      {
        card_id: "TFC-002",
        set_id: "TFC",
        name: "Elsa, Snow Queen",
        cost: 5,
        ink_color: "Amethyst",
        type: "Character",
        rarity: "Legendary",
        inkwell: 3,
        strength: 4, 
        willpower: 5,
        image_url: "https://lorcana-api.com/images/cards/TFC/TFC-002.webp"
      },
      {
        card_id: "ROA-001",
        set_id: "ROA", 
        name: "Ariel, Curious Collector",
        cost: 3,
        ink_color: "Ruby",
        type: "Character",
        rarity: "Rare",
        inkwell: 2,
        strength: 2,
        willpower: 3,
        image_url: "https://lorcana-api.com/images/cards/ROA/ROA-001.webp"
      }
    ];
    
    // Download and store images
    const processedCards = [];
    for (const card of sampleCards) {
      try {
        console.log(`Processing Lorcana card: ${card.card_id} - ${card.name}`);
        
        // Store card image in Supabase if available
        if (card.image_url) {
          const imageUrl = await storeImageInSupabase(
            card.image_url,
            'lorcana/cards',
            `${card.card_id}.webp`,
            supabase
          );
          card.image_url = imageUrl;
        }
        
        processedCards.push(card);
      } catch (cardError) {
        console.error(`Error processing Lorcana card ${card.card_id}:`, cardError);
      }
    }
    
    // Upsert cards
    if (processedCards.length > 0) {
      console.log(`Inserting ${processedCards.length} Lorcana cards into database`);
      const { error } = await supabase
        .from("lorcana_cards")
        .upsert(processedCards, {
          onConflict: "card_id",
        });
        
      if (error) {
        console.error("Error inserting Lorcana cards:", error);
      }
    }
    
    // Update job status
    const newCompletedItemsCount = completedItemsCount + 1;  // Count this as one item
    const progress = Math.round((newCompletedItemsCount / totalItemsCount) * 100);
    await updateJobStatus(jobId, 'processing_data', progress, totalItemsCount, newCompletedItemsCount, null, supabase);
    
    return processedCards.length;
  } catch (error) {
    console.error(`Error creating Lorcana cards:`, error);
    return 0;
  }
}
