
// Import necessary Deno modules
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.1.1";

// Define environment variables (these will need to be set in Supabase)
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const pokemonApiKey = Deno.env.get("POKEMON_TCG_API_KEY") || "";
const mtgApiKey = Deno.env.get("MTG_API_KEY") || "";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limiting configuration
const RATE_LIMIT_SECONDS = 60; // 1 minute between syncs
const RATE_LIMIT_TABLE = "api_rate_limits";

// Job status tracking
const JOB_STATUS_TABLE = "api_job_status";

// Function to check rate limit in the database
async function checkRateLimit(source) {
  try {
    console.log(`Checking rate limit for ${source}`);
    
    // Try to create the rate limit table if it doesn't exist
    await supabase.rpc("create_rate_limit_table_if_not_exists").catch(e => {
      console.log("Rate limit table creation RPC error (may already exist):", e);
    });
    
    // Check if rate limit exists
    const { data, error } = await supabase
      .from(RATE_LIMIT_TABLE)
      .select("expires_at")
      .eq("api_key", source)
      .single();
      
    if (error && error.code !== "PGRST116") { // PGRST116 is "No rows returned"
      console.error("Error checking rate limit:", error);
      return { limited: false, retryAfter: 0 }; // Fail open if error
    }
    
    if (!data) {
      return { limited: false, retryAfter: 0 };
    }
    
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    
    if (now < expiresAt) {
      const retryAfter = Math.ceil((expiresAt.getTime() - now.getTime()) / 1000);
      console.log(`Rate limit active for ${source}, retry after ${retryAfter}s`);
      return { limited: true, retryAfter };
    }
    
    return { limited: false, retryAfter: 0 };
  } catch (error) {
    console.error("Error in rate limit check:", error);
    return { limited: false, retryAfter: 0 }; // Fail open if error
  }
}

// Function to set rate limit in the database
async function setRateLimit(source) {
  try {
    console.log(`Setting rate limit for ${source}`);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RATE_LIMIT_SECONDS * 1000);
    
    // Upsert rate limit
    const { error } = await supabase
      .from(RATE_LIMIT_TABLE)
      .upsert({
        api_key: source,
        last_accessed: now.toISOString(),
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: "api_key"
      });
      
    if (error) {
      console.error("Error setting rate limit:", error);
    }
    
    return { expiresAt, retryAfter: RATE_LIMIT_SECONDS };
  } catch (error) {
    console.error("Error in set rate limit:", error);
    return { expiresAt: new Date(Date.now() + RATE_LIMIT_SECONDS * 1000), retryAfter: RATE_LIMIT_SECONDS };
  }
}

// Function to create the job status table if it doesn't exist
async function createJobStatusTableIfNotExists() {
  try {
    // Check if table exists, create it if not
    const { error } = await supabase.rpc('create_job_status_table_if_not_exists').catch(e => {
      console.log("Job status table creation RPC error (may attempt SQL):", e);
      
      // Try direct SQL if RPC fails
      return supabase.from('_manual_sql').select('*').eq('statement', `
        CREATE TABLE IF NOT EXISTS public.${JOB_STATUS_TABLE} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id TEXT UNIQUE NOT NULL,
          source TEXT NOT NULL,
          status TEXT NOT NULL,
          progress NUMERIC DEFAULT 0,
          total_items NUMERIC DEFAULT 0,
          completed_items NUMERIC DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          completed_at TIMESTAMP WITH TIME ZONE,
          error TEXT
        );
      `);
    });
    
    if (error) {
      console.error("Error creating job status table:", error);
    }
  } catch (error) {
    console.error("Error in create job status table:", error);
  }
}

// Function to create a new job and return the job_id
async function createJob(source) {
  try {
    await createJobStatusTableIfNotExists();
    
    const jobId = crypto.randomUUID();
    
    const { error } = await supabase
      .from(JOB_STATUS_TABLE)
      .insert({
        job_id: jobId,
        source: source,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      console.error("Error creating job:", error);
      return null;
    }
    
    return jobId;
  } catch (error) {
    console.error("Error in create job:", error);
    return null;
  }
}

// Function to update job status
async function updateJobStatus(jobId, status, progress = null, totalItems = null, completedItems = null, error = null) {
  try {
    const updateData = {
      status: status,
      updated_at: new Date().toISOString()
    };
    
    if (progress !== null) updateData.progress = progress;
    if (totalItems !== null) updateData.total_items = totalItems;
    if (completedItems !== null) updateData.completed_items = completedItems;
    if (error) updateData.error = error;
    
    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    const { error: updateError } = await supabase
      .from(JOB_STATUS_TABLE)
      .update(updateData)
      .eq('job_id', jobId);
      
    if (updateError) {
      console.error(`Error updating job status for ${jobId}:`, updateError);
    }
  } catch (error) {
    console.error(`Error in update job status for ${jobId}:`, error);
  }
}

// Function to check if a storage bucket exists and create it if not
async function ensureStorageBucket(bucketName) {
  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error(`Error checking storage buckets:`, bucketsError);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Creating storage bucket: ${bucketName}`);
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
      });
      
      if (error) {
        console.error(`Error creating storage bucket ${bucketName}:`, error);
        return false;
      }
      
      console.log(`Successfully created bucket: ${bucketName}`);
    } else {
      console.log(`Bucket ${bucketName} already exists`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error ensuring storage bucket ${bucketName}:`, error);
    return false;
  }
}

// Function to download and upload an image to Supabase storage
async function storeImageInSupabase(imageUrl, category, filename) {
  if (!imageUrl) return null;
  
  try {
    console.log(`Downloading image from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      console.error(`Failed to download image: ${imageUrl}, status: ${imageResponse.status}`);
      return imageUrl; // Fallback to original URL on error
    }
    
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = new Uint8Array(imageArrayBuffer);
    
    // Ensure the tcg-images bucket exists
    const bucketExists = await ensureStorageBucket('tcg-images');
    if (!bucketExists) {
      console.error('Failed to ensure the tcg-images bucket exists');
      return imageUrl; // Fallback to original URL
    }
    
    // Create a unique path in the storage bucket
    const storagePath = `${category}/${filename}`;
    console.log(`Uploading image to path: ${storagePath}`);
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('tcg-images')
      .upload(storagePath, imageBuffer, {
        contentType: imageResponse.headers.get('content-type') || 'image/jpeg',
        upsert: true
      });
    
    if (uploadError) {
      console.error(`Error uploading image to Supabase:`, uploadError);
      return imageUrl; // Fallback to original URL on error
    }
    
    // Get the public URL for the uploaded image
    const { data: { publicUrl } } = supabase
      .storage
      .from('tcg-images')
      .getPublicUrl(storagePath);
    
    console.log(`Image uploaded successfully to: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`Error storing image:`, error);
    return imageUrl; // Fallback to original URL on error
  }
}

// Enhanced function to fetch and store card images for Pokémon TCG
async function fetchAndStoreCardImages(setId, jobId, totalItemsCount, completedItemsCount) {
  try {
    console.log(`Fetching cards for set: ${setId}`);
    const headers = {};
    if (pokemonApiKey) {
      headers["X-Api-Key"] = pokemonApiKey;
    }
    
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
          `${card.id}_small.jpg`
        );
        
        const largeImageUrl = await storeImageInSupabase(
          card.images?.large,
          'pokemon/cards/large',
          `${card.id}_large.jpg`
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
          await updateJobStatus(jobId, 'processing_data', progress, totalItemsCount, newCompletedItemsCount);
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

// Enhanced function to fetch and store card images for MTG
async function fetchAndStoreMTGCardImages(setCode, jobId, totalItemsCount, completedItemsCount) {
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
            `${card.id}_card.jpg`
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
          await updateJobStatus(jobId, 'processing_data', progress, totalItemsCount, newCompletedItemsCount);
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

// Enhanced function to fetch and store card images for Yu-Gi-Oh!
async function fetchAndStoreYugiohCardImages(setName, jobId, totalItemsCount, completedItemsCount) {
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
              `${card.id}_card.jpg`
            );
          }
          
          if (imageObj.image_url_small) {
            imageUrlSmall = await storeImageInSupabase(
              imageObj.image_url_small,
              'yugioh/cards/small',
              `${card.id}_small.jpg`
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
          await updateJobStatus(jobId, 'processing_data', progress, totalItemsCount, newCompletedItemsCount);
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

// Enhanced function to create Lorcana cards
async function createLorcanaCards(jobId, totalItemsCount, completedItemsCount) {
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
            `${card.card_id}.webp`
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
    await updateJobStatus(jobId, 'processing_data', progress, totalItemsCount, newCompletedItemsCount);
    
    return processedCards.length;
  } catch (error) {
    console.error(`Error creating Lorcana cards:`, error);
    return 0;
  }
}

// Wrapper for processing in the background
async function processInBackground(fn, jobId, source) {
  try {
    console.log(`Processing ${source} job ${jobId} in background`);
    await updateJobStatus(jobId, 'processing');
    await fn(jobId);
    await updateJobStatus(jobId, 'completed', 100);
    console.log(`Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`Background processing error for job ${jobId}:`, error);
    await updateJobStatus(jobId, 'failed', null, null, null, error.message || "Unknown error");
  }
}

// Create RPC functions if they don't exist
async function createRpcFunctionsIfNeeded() {
  try {
    // Try to create the table creation RPCs
    await supabase.from('_manual_sql').select('*').eq('statement', `
      CREATE OR REPLACE FUNCTION create_rate_limit_table_if_not_exists()
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.api_rate_limits (
          id SERIAL PRIMARY KEY,
          api_key TEXT UNIQUE NOT NULL,
          last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL
        );
      END;
      $$;
    `);
    
    await supabase.from('_manual_sql').select('*').eq('statement', `
      CREATE OR REPLACE FUNCTION create_job_status_table_if_not_exists()
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.api_job_status (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id TEXT UNIQUE NOT NULL,
          source TEXT NOT NULL,
          status TEXT NOT NULL,
          progress NUMERIC DEFAULT 0,
          total_items NUMERIC DEFAULT 0,
          completed_items NUMERIC DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          completed_at TIMESTAMP WITH TIME ZONE,
          error TEXT
        );
      END;
      $$;
    `);
    
    await supabase.from('_manual_sql').select('*').eq('statement', `
      CREATE OR REPLACE FUNCTION create_pokemon_cards_table_if_not_exists()
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
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
      END;
      $$;
    `);
    
    await supabase.from('_manual_sql').select('*').eq('statement', `
      CREATE OR REPLACE FUNCTION create_mtg_cards_table_if_not_exists()
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
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
      END;
      $$;
    `);
    
    await supabase.from('_manual_sql').select('*').eq('statement', `
      CREATE OR REPLACE FUNCTION create_yugioh_cards_table_if_not_exists()
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
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
      END;
      $$;
    `);
    
    await supabase.from('_manual_sql').select('*').eq('statement', `
      CREATE OR REPLACE FUNCTION create_lorcana_cards_table_if_not_exists()
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
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
      END;
      $$;
    `);
    
    console.log("RPC functions created or updated successfully");
  } catch (error) {
    console.error("Error creating RPC functions:", error);
  }
}

// Handle OPTIONS request for CORS
Deno.serve(async (req) => {
  console.log("Edge function received request:", req.method, req.url);
  
  // Add CORS headers to all responses
  const responseHeaders = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request for CORS preflight");
    return new Response(null, { headers: responseHeaders });
  }
  
  if (req.method !== "POST") {
    console.log(`Method not allowed: ${req.method}`);
    return new Response(
      JSON.stringify({ error: "Method not allowed" }), 
      {
        status: 405,
        headers: responseHeaders,
      }
    );
  }

  try {
    console.log("Parsing request body");
    const requestData = await req.json();
    console.log("Request data:", requestData);
    
    // Try to create RPC functions
    await createRpcFunctionsIfNeeded();
    
    const { source, jobId } = requestData;
    
    // If jobId is provided, this is a job status check
    if (jobId) {
      console.log(`Checking status for job: ${jobId}`);
      const { data, error } = await supabase
        .from(JOB_STATUS_TABLE)
        .select('*')
        .eq('job_id', jobId)
        .single();
        
      if (error) {
        console.error(`Error fetching job status for ${jobId}:`, error);
        return new Response(
          JSON.stringify({ error: `Job not found: ${jobId}` }),
          {
            status: 404,
            headers: responseHeaders,
          }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, job: data }),
        {
          status: 200,
          headers: responseHeaders,
        }
      );
    }
    
    if (!source) {
      console.log("Missing source parameter");
      return new Response(
        JSON.stringify({ error: "Missing source parameter" }),
        {
          status: 400,
          headers: responseHeaders,
        }
      );
    }

    // Check rate limit before proceeding
    const rateLimitCheck = await checkRateLimit(source);
    if (rateLimitCheck.limited) {
      console.log(`Rate limit hit for ${source}`);
      responseHeaders["Retry-After"] = rateLimitCheck.retryAfter.toString();
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Rate limited", 
          retryAfter: rateLimitCheck.retryAfter 
        }),
        {
          status: 429, // Too Many Requests
          headers: responseHeaders,
        }
      );
    }
    
    // Set rate limit for this request
    await setRateLimit(source);
    
    // Create a new job for this request
    const newJobId = await createJob(source);
    if (!newJobId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to create job" 
        }),
        {
          status: 500,
          headers: responseHeaders,
        }
      );
    }
    
    // Start background processing based on the source
    let processingFunction;
    switch (source) {
      case "pokemon":
        processingFunction = (jobId) => processPokemonSets(jobId);
        break;
      case "mtg":
        processingFunction = (jobId) => processMTGSets(jobId);
        break;
      case "yugioh":
        processingFunction = (jobId) => processYugiohSets(jobId);
        break;
      case "lorcana":
        processingFunction = (jobId) => processLorcanaSets(jobId);
        break;
      default:
        return new Response(
          JSON.stringify({ 
            error: "Invalid source. Use 'pokemon', 'mtg', 'yugioh', or 'lorcana'" 
          }),
          {
            status: 400,
            headers: responseHeaders,
          }
        );
    }
    
    // Use EdgeRuntime's waitUntil for background processing
    EdgeRuntime.waitUntil(processInBackground(processingFunction, newJobId, source));
    
    // Immediately return the job ID to the client
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Job started for ${source}`,
        jobId: newJobId
      }),
      {
        status: 202, // Accepted
        headers: responseHeaders,
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred",
        stack: error.stack
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});

// Process Pokémon sets in the background
async function processPokemonSets(jobId) {
  console.log(`Processing Pokémon TCG sets for job ${jobId}...`);
  
  try {
    const headers = {};
    if (pokemonApiKey) {
      headers["X-Api-Key"] = pokemonApiKey;
      console.log("Using Pokemon TCG API key");
    } else {
      console.log("No Pokemon TCG API key provided");
    }

    await updateJobStatus(jobId, 'fetching_data');
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
    await updateJobStatus(jobId, 'processing_data', 0, estimatedTotalItems, 0);
    
    // Process sets and store images in Supabase Storage
    const sets = [];
    let completedItems = 0;
    
    for (const set of data.data) {
      console.log(`Processing set: ${set.id} - ${set.name}`);
      
      // Store set images in Supabase Storage
      const symbolUrl = await storeImageInSupabase(
        set.images?.symbol, 
        'pokemon/symbols', 
        `${set.id}_symbol.png`
      );
      
      const logoUrl = await storeImageInSupabase(
        set.images?.logo, 
        'pokemon/logos', 
        `${set.id}_logo.png`
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
      await updateJobStatus(jobId, 'processing_data', progress, estimatedTotalItems, completedItems);
    }

    console.log(`Processing ${sets.length} Pokémon sets for database insertion`);
    await updateJobStatus(jobId, 'saving_to_database');

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
      await fetchAndStoreCardImages(set.set_id, jobId, estimatedTotalItems, completedItems);
      completedItems++;
    }

    // Update last sync time
    await updateApiSyncTime("pokemon");
    console.log("Successfully imported and updated Pokémon sets and cards");

    return sets.length;
  } catch (error) {
    console.error("Error fetching Pokémon sets:", error);
    throw error;
  }
}

// Process MTG sets in the background
async function processMTGSets(jobId) {
  console.log(`Processing Magic: The Gathering sets for job ${jobId}...`);
  
  try {
    await updateJobStatus(jobId, 'fetching_data');
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
    await updateJobStatus(jobId, 'processing_data', 0, estimatedTotalItems, 0);
    
    // Process sets and store images in Supabase Storage
    const sets = [];
    let completedItems = 0;
    
    for (const set of data.sets) {
      console.log(`Processing set: ${set.code} - ${set.name}`);
      
      // Store set images in Supabase Storage
      const symbolUrl = await storeImageInSupabase(
        set.symbolUrl, 
        'mtg/symbols', 
        `${set.code}_symbol.png`
      );
      
      const logoUrl = await storeImageInSupabase(
        set.logoUrl || set.symbolUrl, 
        'mtg/logos', 
        `${set.code}_logo.png`
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
      await updateJobStatus(jobId, 'processing_data', progress, estimatedTotalItems, completedItems);
    }

    console.log(`Processing ${sets.length} MTG sets for database insertion`);
    await updateJobStatus(jobId, 'saving_to_database');

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
      await fetchAndStoreMTGCardImages(set.code, jobId, estimatedTotalItems, completedItems);
      completedItems++;
    }

    // Update last sync time
    await updateApiSyncTime("mtg");
    console.log("Successfully imported and updated MTG sets and cards");

    return sets.length;
  } catch (error) {
    console.error("Error fetching MTG sets:", error);
    throw error;
  }
}

// Process Yu-Gi-Oh! sets in the background
async function processYugiohSets(jobId) {
  console.log(`Processing Yu-Gi-Oh! sets for job ${jobId}...`);
  
  try {
    await updateJobStatus(jobId, 'fetching_data');
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
    await updateJobStatus(jobId, 'processing_data', 0, estimatedTotalItems, 0);
    
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
              `${set.set_code}_set.jpg`
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
      await updateJobStatus(jobId, 'processing_data', progress, estimatedTotalItems, completedItems);
    }

    console.log(`Processing ${sets.length} Yu-Gi-Oh! sets for database insertion`);
    await updateJobStatus(jobId, 'saving_to_database');

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
      await fetchAndStoreYugiohCardImages(set.name, jobId, estimatedTotalItems, completedItems);
      completedItems++;
    }

    // Update last sync time
    await updateApiSyncTime("yugioh");
    console.log("Successfully imported and updated Yu-Gi-Oh! sets and cards");

    return sets.length;
  } catch (error) {
    console.error("Error fetching Yu-Gi-Oh! sets:", error);
    throw error;
  }
}

// Process Disney Lorcana sets in the background
async function processLorcanaSets(jobId) {
  console.log(`Processing Disney Lorcana sets for job ${jobId}...`);
  
  try {
    await updateJobStatus(jobId, 'processing_data');
    
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
    await updateJobStatus(jobId, 'processing_data', 0, estimatedTotalItems, 0);

    // Download and store images locally
    const sets = [];
    let completedItems = 0;
    
    for (const set of setData) {
      console.log(`Processing Lorcana set: ${set.set_id} - ${set.name}`);
      
      // Store set image in Supabase Storage
      const setImage = await storeImageInSupabase(
        set.set_image,
        'lorcana/sets',
        `${set.set_id}_set.png`
      );
      
      sets.push({
        ...set,
        set_image: setImage
      });
      
      completedItems++;
      const progress = Math.round((completedItems / estimatedTotalItems) * 100);
      await updateJobStatus(jobId, 'processing_data', progress, estimatedTotalItems, completedItems);
    }

    console.log(`Processing ${sets.length} Disney Lorcana sets for database insertion`);
    await updateJobStatus(jobId, 'saving_to_database');

    // Insert sets into database (upsert to avoid duplicates)
    const { error } = await supabase.from("lorcana_sets").upsert(sets, {
      onConflict: "set_id",
    });

    if (error) {
      console.error("Error inserting Disney Lorcana sets:", error);
      throw error;
    }
    
    // Create sample Lorcana cards
    await createLorcanaCards(jobId, estimatedTotalItems, completedItems);

    // Update last sync time
    await updateApiSyncTime("lorcana");
    console.log("Successfully added Disney Lorcana sets and cards");

    return sets.length;
  } catch (error) {
    console.error("Error adding Disney Lorcana sets:", error);
    throw error;
  }
}

// Update the last sync time for an API
async function updateApiSyncTime(apiName) {
  console.log(`Updating last sync time for ${apiName}`);
  try {
    const { error } = await supabase.from("api_config").upsert(
      {
        api_name: apiName,
        last_sync_time: new Date().toISOString(),
      },
      {
        onConflict: "api_name",
      }
    );

    if (error) {
      console.error(`Error updating sync time for ${apiName}:`, error);
    } else {
      console.log(`Successfully updated sync time for ${apiName}`);
    }
  } catch (err) {
    console.error(`Exception updating sync time for ${apiName}:`, err);
  }
}

