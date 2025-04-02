import { supabase } from "@/integrations/supabase/client";

// Interface for Pokemon Card
export interface PokemonCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  level?: string;
  hp?: string;
  types?: string[];
  evolves_from?: string;
  evolves_to?: string[];
  rules?: string[];
  attacks?: {
    name: string;
    cost: string[];
    convertedEnergyCost: number;
    damage: string;
    text: string;
  }[];
  weaknesses?: {
    type: string;
    value: string;
  }[];
  resistances?: {
    type: string;
    value: string;
  }[];
  retreat_cost?: string[];
  converted_retreat_cost?: number;
  set: string;
  number: string;
  artist?: string;
  rarity?: string;
  national_pokedex_numbers?: number[];
  legalities?: {
    unlimited: string;
    standard: string;
    expanded: string;
  };
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url: string;
    updated_at: string;
    prices: Record<string, {
      low: number;
      mid: number;
      high: number;
      market: number;
      directLow?: number;
    }>;
  };
}

// Interface for Pokemon Set
export interface PokemonSet {
  id: number;
  set_id: string;
  name: string;
  series: string;
  printed_total: number;
  total: number;
  release_date: string;
  symbol_url: string;
  logo_url: string;
  images_url: string;
}

// Enhanced memory cache for cards with preloaded flag
interface CardCache {
  cards: PokemonCard[];
  timestamp: number;
  preloaded?: boolean;
}

// Memory cache for Pokémon cards by set ID
const cardCache = new Map<string, CardCache>();

// Memory cache for sets
const setsCache: {
  sets: PokemonSet[];
  timestamp: number;
} = { sets: [], timestamp: 0 };

// Local storage cache keys
const SETS_CACHE_KEY = 'pokemon_sets_cache';
const CARDS_CACHE_KEY_PREFIX = 'pokemon_cards_cache_';
const SETS_META_CACHE_KEY = 'pokemon_sets_meta';
const CACHE_VERSION = '1.2'; // Incremented for new caching strategy

// Cache expiration time (30 minutes for sets, 24 hours for cards)
const SETS_CACHE_TTL = 30 * 60 * 1000; 
const CARDS_CACHE_TTL = 24 * 60 * 60 * 1000; // Extended cache lifetime

// IndexedDB configuration
const DB_NAME = 'pokemon_cards_db';
const DB_VERSION = 1;
const CARD_STORE = 'cards';
const SET_STORE = 'sets';

// Initialize IndexedDB if available
let idbPromise: Promise<IDBDatabase> | null = null;

// Check if IndexedDB is supported and initialize it
const initializeIndexedDB = (): Promise<IDBDatabase> => {
  if (!window.indexedDB) {
    return Promise.reject("IndexedDB not supported");
  }
  
  if (idbPromise) return idbPromise;
  
  idbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error("IndexedDB error:", event);
      reject("Error opening IndexedDB");
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create card store with set_id index
      if (!db.objectStoreNames.contains(CARD_STORE)) {
        const cardStore = db.createObjectStore(CARD_STORE, { keyPath: "id" });
        cardStore.createIndex("set_id", "set", { unique: false });
      }
      
      // Create set store
      if (!db.objectStoreNames.contains(SET_STORE)) {
        db.createObjectStore(SET_STORE, { keyPath: "set_id" });
      }
    };
  });
  
  return idbPromise;
};

// Try to initialize IndexedDB immediately at script load
try {
  initializeIndexedDB();
} catch (e) {
  console.warn("Failed to initialize IndexedDB:", e);
}

// Determine if a string is a valid number
const isNumeric = (str: string) => {
  // Handle strings like '001', '1a', etc.
  const numericPart = str.match(/^\d+/);
  return numericPart !== null;
};

// Improved sort function for card numbers
export const sortCardsByNumber = (cards: PokemonCard[]): PokemonCard[] => {
  return [...cards].sort((a, b) => {
    // Extract the numeric parts of the card numbers
    const aMatch = a.number.match(/^(\d+)([a-zA-Z]*)$/);
    const bMatch = b.number.match(/^(\d+)([a-zA-Z]*)$/);
    
    // If both have numeric parts
    if (aMatch && bMatch) {
      // Compare the numeric parts first
      const aNum = parseInt(aMatch[1], 10);
      const bNum = parseInt(bMatch[1], 10);
      
      if (aNum !== bNum) {
        return aNum - bNum;
      }
      
      // If numbers are the same, sort by any suffix (e.g., 1a, 1b)
      return (aMatch[2] || '').localeCompare(bMatch[2] || '');
    }
    
    // Handle special cases (promos, etc.)
    if (!isNumeric(a.number) && isNumeric(b.number)) {
      return 1; // Non-numeric after numeric
    }
    if (isNumeric(a.number) && !isNumeric(b.number)) {
      return -1; // Numeric before non-numeric
    }
    
    // Both non-numeric, sort alphabetically
    return a.number.localeCompare(b.number);
  });
};

// Normalize card data to ensure consistent structure
const normalizeCardData = (card: any): PokemonCard => {
  // Ensure arrays are properly defined even if they're null/undefined in the data
  return {
    ...card,
    types: Array.isArray(card.types) ? card.types : [],
    subtypes: Array.isArray(card.subtypes) ? card.subtypes : [],
    rules: Array.isArray(card.rules) ? card.rules : [],
    attacks: Array.isArray(card.attacks) ? card.attacks : [],
    weaknesses: Array.isArray(card.weaknesses) ? card.weaknesses : [],
    resistances: Array.isArray(card.resistances) ? card.resistances : [],
    retreat_cost: Array.isArray(card.retreat_cost) ? card.retreat_cost : [],
    evolves_to: Array.isArray(card.evolves_to) ? card.evolves_to : [],
    national_pokedex_numbers: Array.isArray(card.national_pokedex_numbers) ? card.national_pokedex_numbers : [],
    images: card.images || { small: '', large: '' }
  };
};

// Split card data into chunks for storage to avoid localStorage size limits
const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Save cards to IndexedDB
const saveCardsToIndexedDB = async (setId: string, cards: PokemonCard[]): Promise<boolean> => {
  try {
    const db = await initializeIndexedDB();
    const tx = db.transaction(CARD_STORE, 'readwrite');
    const store = tx.objectStore(CARD_STORE);
    
    // Store cards individually
    cards.forEach(card => {
      store.put({
        ...card,
        set: setId, // Ensure set_id is correctly saved for indexing
        timestamp: Date.now()
      });
    });
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.error("Error saving cards to IndexedDB:", tx.error);
        reject(false);
      };
    });
  } catch (e) {
    console.warn("Failed to save to IndexedDB, falling back to localStorage:", e);
    return false;
  }
};

// Get cards from IndexedDB by set ID
const getCardsFromIndexedDB = async (setId: string): Promise<PokemonCard[] | null> => {
  try {
    const db = await initializeIndexedDB();
    const tx = db.transaction(CARD_STORE, 'readonly');
    const store = tx.objectStore(CARD_STORE);
    const index = store.index('set_id');
    const request = index.getAll(setId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const cards = request.result;
        if (cards && cards.length > 0) {
          // Check if the cache is recent enough
          const now = Date.now();
          const oldestAllowed = now - CARDS_CACHE_TTL;
          
          // Get the timestamp of the first card (assuming all cards have the same timestamp)
          const timestamp = cards[0].timestamp || 0;
          
          if (timestamp < oldestAllowed) {
            console.log(`IndexedDB cache expired for set ${setId}`);
            resolve(null);
            return;
          }
          
          console.log(`Retrieved ${cards.length} cards for set ${setId} from IndexedDB`);
          // Remove timestamp property before returning
          const formattedCards = cards.map(card => {
            const { timestamp, ...rest } = card;
            return rest;
          });
          resolve(formattedCards);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => {
        console.error("Error getting cards from IndexedDB:", request.error);
        reject(null);
      };
    });
  } catch (e) {
    console.warn("Failed to get from IndexedDB, falling back to localStorage:", e);
    return null;
  }
};

// Save sets to IndexedDB
const saveSetsToIndexedDB = async (sets: PokemonSet[]): Promise<boolean> => {
  try {
    const db = await initializeIndexedDB();
    const tx = db.transaction(SET_STORE, 'readwrite');
    const store = tx.objectStore(SET_STORE);
    
    // Store sets individually
    sets.forEach(set => {
      store.put({
        ...set,
        timestamp: Date.now()
      });
    });
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.error("Error saving sets to IndexedDB:", tx.error);
        reject(false);
      };
    });
  } catch (e) {
    console.warn("Failed to save sets to IndexedDB, falling back to localStorage:", e);
    return false;
  }
};

// Get all sets from IndexedDB
const getSetsFromIndexedDB = async (): Promise<PokemonSet[] | null> => {
  try {
    const db = await initializeIndexedDB();
    const tx = db.transaction(SET_STORE, 'readonly');
    const store = tx.objectStore(SET_STORE);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const sets = request.result;
        if (sets && sets.length > 0) {
          // Check if the cache is recent enough
          const now = Date.now();
          const oldestAllowed = now - SETS_CACHE_TTL;
          
          // Get the timestamp of the first set (assuming all sets have the same timestamp)
          const timestamp = sets[0].timestamp || 0;
          
          if (timestamp < oldestAllowed) {
            console.log(`IndexedDB sets cache expired`);
            resolve(null);
            return;
          }
          
          console.log(`Retrieved ${sets.length} sets from IndexedDB`);
          // Remove timestamp property before returning
          const formattedSets = sets.map(set => {
            const { timestamp, ...rest } = set;
            return rest;
          });
          resolve(formattedSets);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => {
        console.error("Error getting sets from IndexedDB:", request.error);
        reject(null);
      };
    });
  } catch (e) {
    console.warn("Failed to get sets from IndexedDB, falling back to localStorage:", e);
    return null;
  }
};

// Helper function to cache cards - with IndexedDB support
const cacheCards = async (setId: string, cards: PokemonCard[]) => {
  // Update memory cache first
  cardCache.set(`${setId}_full`, {
    cards,
    timestamp: Date.now(),
    preloaded: true
  });
  
  // Try to save to IndexedDB first
  const savedToIDB = await saveCardsToIndexedDB(setId, cards);
  
  // If IndexedDB fails, fallback to localStorage
  if (!savedToIDB) {
    try {
      // For localStorage, we need to handle potential storage limits
      // Create metadata object for this set
      const metaKey = `${CARDS_CACHE_KEY_PREFIX}${setId}_meta`;
      const metadata = {
        setId,
        totalCards: cards.length,
        timestamp: Date.now(),
        version: CACHE_VERSION,
        chunks: Math.ceil(cards.length / 100) // Store 100 cards per chunk
      };
      
      // Store metadata
      localStorage.setItem(metaKey, JSON.stringify(metadata));
      
      // Break cards into chunks and store separately
      const cardChunks = chunkArray(cards, 100);
      
      cardChunks.forEach((chunk, index) => {
        const chunkKey = `${CARDS_CACHE_KEY_PREFIX}${setId}_chunk_${index}`;
        localStorage.setItem(chunkKey, JSON.stringify(chunk));
      });
      
      console.log(`Cached ${cards.length} cards for set ${setId} in ${cardChunks.length} chunks`);
    } catch (e) {
      console.warn("Error storing cards in localStorage:", e);
    }
  }
};

// Get cards from chunked localStorage cache
const getCardsFromChunkedCache = (setId: string): { cards: PokemonCard[], timestamp: number } | null => {
  try {
    const metaKey = `${CARDS_CACHE_KEY_PREFIX}${setId}_meta`;
    const metaJson = localStorage.getItem(metaKey);
    
    if (!metaJson) return null;
    
    const metadata = JSON.parse(metaJson);
    
    // Version check - if cache format has changed, don't use old format
    if (metadata.version !== CACHE_VERSION) {
      console.log(`Cache version mismatch (${metadata.version} vs ${CACHE_VERSION}), ignoring cache`);
      return null;
    }
    
    // Check timestamp
    if (Date.now() - metadata.timestamp > CARDS_CACHE_TTL) {
      console.log(`Cache expired for set ${setId}`);
      return null;
    }
    
    // Retrieve and combine all chunks
    const allCards: PokemonCard[] = [];
    
    for (let i = 0; i < metadata.chunks; i++) {
      const chunkKey = `${CARDS_CACHE_KEY_PREFIX}${setId}_chunk_${i}`;
      const chunkJson = localStorage.getItem(chunkKey);
      
      if (!chunkJson) {
        console.warn(`Missing chunk ${i} for set ${setId}`);
        return null; // If any chunk is missing, the cache is invalid
      }
      
      const chunk = JSON.parse(chunkJson);
      allCards.push(...chunk);
    }
    
    if (allCards.length !== metadata.totalCards) {
      console.warn(`Cache size mismatch for set ${setId}: expected ${metadata.totalCards}, got ${allCards.length}`);
      return null;
    }
    
    console.log(`Successfully loaded ${allCards.length} cards from chunked cache for set ${setId}`);
    
    return {
      cards: allCards,
      timestamp: metadata.timestamp
    };
  } catch (e) {
    console.warn("Error reading chunked cache:", e);
    return null;
  }
};

// New function to eagerly fetch a specific set
export const prefetchPokemonSet = async (setId: string): Promise<boolean> => {
  console.log(`Prefetching set: ${setId}`);
  
  // Check if we already have this set in memory cache
  const cached = cardCache.get(`${setId}_full`);
  if (cached && cached.preloaded) {
    console.log(`Set ${setId} already preloaded in memory cache`);
    return true;
  }

  try {
    // Try to get from IndexedDB first
    const idbCards = await getCardsFromIndexedDB(setId);
    if (idbCards && idbCards.length > 0) {
      console.log(`Using ${idbCards.length} cards from IndexedDB for set ${setId}`);
      cardCache.set(`${setId}_full`, {
        cards: idbCards,
        timestamp: Date.now(),
        preloaded: true
      });
      // Preload critical images in background
      setTimeout(() => preloadCardImages(idbCards, 100), 10);
      return true;
    }
    
    // Fall back to localStorage if IndexedDB fails
    const localCache = getCardsFromChunkedCache(setId);
    if (localCache) {
      console.log(`Using ${localCache.cards.length} cards from localStorage for set ${setId}`);
      cardCache.set(`${setId}_full`, {
        cards: localCache.cards,
        timestamp: localCache.timestamp,
        preloaded: true
      });
      // Preload critical images in background
      setTimeout(() => preloadCardImages(localCache.cards, 100), 10);
      return true;
    }
    
    // Fetch from Supabase or API if needed
    const result = await fetchPokemonCards(setId, { loadAll: true });
    if (result.cards.length > 0) {
      // Already cached in fetchPokemonCards function
      setTimeout(() => preloadCardImages(result.cards, 100), 10);
      return true;
    }
    
    return false;
  } catch (e) {
    console.error(`Error prefetching set ${setId}:`, e);
    return false;
  }
};

// Try to get data from Supabase first, fallback to API
export const fetchPokemonCards = async (
  setId: string, 
  options: { page?: number; pageSize?: number, loadAll?: boolean } = {}
): Promise<{ cards: PokemonCard[], totalCount: number, hasMore: boolean }> => {
  console.log(`Fetching cards for set: ${setId}, options:`, options);
  
  const { loadAll = false } = options;
  const cacheKey = `${setId}_full`;
  
  // Check memory cache first for the full set
  const cached = cardCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CARDS_CACHE_TTL)) {
    console.log(`Using memory cache for set: ${setId}`);
    return { 
      cards: cached.cards, 
      totalCount: cached.cards.length,
      hasMore: false 
    };
  }
  
  // Try IndexedDB first
  try {
    const idbCards = await getCardsFromIndexedDB(setId);
    if (idbCards && idbCards.length > 0) {
      console.log(`Using ${idbCards.length} cards from IndexedDB for set ${setId}`);
      
      // Store in memory cache
      cardCache.set(cacheKey, {
        cards: idbCards,
        timestamp: Date.now(),
        preloaded: true
      });
      
      return { 
        cards: idbCards, 
        totalCount: idbCards.length,
        hasMore: false 
      };
    }
  } catch (e) {
    console.warn("IndexedDB access failed:", e);
  }
  
  // Check chunked localStorage cache if IndexedDB fails
  const localCache = getCardsFromChunkedCache(setId);
  if (localCache) {
    console.log(`Using localStorage cache for set: ${setId}`);
    
    // Store in memory cache too
    cardCache.set(cacheKey, {
      cards: localCache.cards,
      timestamp: localCache.timestamp
    });
    
    return { 
      cards: localCache.cards, 
      totalCount: localCache.cards.length,
      hasMore: false 
    };
  }
  
  // Try to get from Supabase
  try {
    console.log(`Trying to fetch from Supabase for set: ${setId}`);
    
    // First get the total count
    const { count, error: countError } = await supabase
      .from('pokemon_cards')
      .select('*', { count: 'exact', head: true })
      .eq('set_id', setId);
      
    if (countError) {
      console.error(`Error counting cards in Supabase for set: ${setId}:`, countError);
      throw countError;
    }
    
    const totalCount = count || 0;
    console.log(`Total cards in set ${setId}: ${totalCount}`);
    
    if (totalCount > 0) {
      // Get all cards at once
      const { data: supabaseCards, error } = await supabase
        .from('pokemon_cards')
        .select('*')
        .eq('set_id', setId);
        
      if (!error && supabaseCards && supabaseCards.length > 0) {
        console.log(`Found ${supabaseCards.length} cards in Supabase for set: ${setId}`);
        
        // Process the cards
        const processedCards = supabaseCards.map(card => normalizeCardData(card));
        const sortedCards = sortCardsByNumber(processedCards);
        
        // Cache the result
        cacheCards(setId, sortedCards);
        
        return { 
          cards: sortedCards, 
          totalCount: sortedCards.length,
          hasMore: false 
        };
      }
    }
    
    console.log(`No cards found in Supabase for set: ${setId}, falling back to API`);
  } catch (supabaseError) {
    console.error(`Error fetching from Supabase for set: ${setId}:`, supabaseError);
  }
  
  // Fallback to Pokemon TCG API - load all cards at once
  return fetchAllCardsFromAPI(setId);
};

// Fetch all cards from API in one go
const fetchAllCardsFromAPI = async (setId: string): Promise<{ cards: PokemonCard[], totalCount: number, hasMore: boolean }> => {
  console.log(`Fetching all cards from API for set: ${setId}`);
  
  try {
    // First get the total count to know how big the page size should be
    const countResponse = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&page=1&pageSize=1`
    );
    
    if (!countResponse.ok) {
      throw new Error(`API count request failed: ${countResponse.status}`);
    }
    
    const countData = await countResponse.json();
    const totalCount = countData.totalCount || 0;
    
    if (totalCount === 0) {
      return { cards: [], totalCount: 0, hasMore: false };
    }
    
    // Now we'll make multiple requests to ensure we get ALL cards
    // We'll make 2 requests: one with orderBy=number (default) and another with orderBy=-number
    // This helps catch cards that might be missing from one request due to API limitations
    
    // First request - get cards ordered by number ascending
    console.log(`Fetching cards for set ${setId} with ascending order`);
    const ascResponse = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=1000&orderBy=number`
    );
    
    if (!ascResponse.ok) {
      throw new Error(`API responded with status: ${ascResponse.status}`);
    }
    
    const ascData = await ascResponse.json();
    const ascCards = ascData.data.map((card: any) => normalizeCardData(card));
    
    // Second request - get cards ordered by number descending to catch any potential stragglers
    console.log(`Fetching cards for set ${setId} with descending order`);
    const descResponse = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=1000&orderBy=-number`
    );
    
    if (!descResponse.ok) {
      throw new Error(`API responded with status: ${descResponse.status}`);
    }
    
    const descData = await descResponse.json();
    const descCards = descData.data.map((card: any) => normalizeCardData(card));
    
    // Combine both sets and remove duplicates by card ID
    const cardMap = new Map<string, PokemonCard>();
    
    // Add all cards from both requests
    [...ascCards, ...descCards].forEach(card => {
      if (!cardMap.has(card.id)) {
        cardMap.set(card.id, card);
      }
    });
    
    // Convert back to array and sort
    const allCards = Array.from(cardMap.values());
    const sortedCards = sortCardsByNumber(allCards);
    
    console.log(`Fetched ${sortedCards.length} total unique cards for set ${setId}`);
    
    // Cache the complete set
    cacheCards(setId, sortedCards);
    
    return { 
      cards: sortedCards,
      totalCount: sortedCards.length,
      hasMore: false
    };
  } catch (error) {
    console.error(`Error fetching all cards for set ${setId}:`, error);
    throw error;
  }
};

// Track which sets metadata has been cached to avoid unnecessary localStorage operations
const metaCacheTracking: Record<string, boolean> = {};

// Store sets metadata for faster lookup
const cacheSetMetadata = (setId: string, totalCount: number, hasSecretRares: boolean, secretRaresCount: number) => {
  try {
    // Skip if already cached recently
    if (metaCacheTracking[setId]) {
      return;
    }
    
    // Get existing metadata
    let allSetsMetadata: Record<string, any> = {};
    const metaJson = localStorage.getItem(SETS_META_CACHE_KEY);
    
    if (metaJson) {
      allSetsMetadata = JSON.parse(metaJson);
    }
    
    // Update or add this set's metadata
    allSetsMetadata[setId] = {
      totalCount,
      hasSecretRares,
      secretRaresCount,
      timestamp: Date.now()
    };
    
    // Save back to localStorage
    localStorage.setItem(SETS_META_CACHE_KEY, JSON.stringify(allSetsMetadata));
    metaCacheTracking[setId] = true;
    
    console.log(`Cached metadata for set ${setId}: ${totalCount} cards, ${secretRaresCount} secret rares`);
  } catch (e) {
    console.warn("Error caching set metadata:", e);
  }
};

// Get cached set metadata if available
export const getCachedSetMetadata = (setId: string): { 
  totalCount: number, 
  hasSecretRares: boolean, 
  secretRaresCount: number 
} | null => {
  try {
    const metaJson = localStorage.getItem(SETS_META_CACHE_KEY);
    if (!metaJson) return null;
    
    const allSetsMetadata = JSON.parse(metaJson);
    
    if (!allSetsMetadata[setId]) return null;
    
    // Check if metadata is fresh enough (within 24 hours)
    const metadata = allSetsMetadata[setId];
    if (Date.now() - metadata.timestamp > 24 * 60 * 60 * 1000) {
      return null;
    }
    
    return {
      totalCount: metadata.totalCount,
      hasSecretRares: metadata.hasSecretRares,
      secretRaresCount: metadata.secretRaresCount
    };
  } catch (e) {
    console.warn("Error reading set metadata:", e);
    return null;
  }
};

// Helper function to cache sets
const cacheSets = async (sets: PokemonSet[]) => {
  console.log(`Caching ${sets.length} Pokemon sets`);
  
  // Update memory cache
  setsCache.sets = sets;
  setsCache.timestamp = Date.now();
  
  // Try to save to IndexedDB first
  try {
    await saveSetsToIndexedDB(sets);
  } catch (e) {
    console.warn("Error saving sets to IndexedDB:", e);
    
    // Fallback to localStorage
    try {
      localStorage.setItem(SETS_CACHE_KEY, JSON.stringify({
        sets,
        timestamp: Date.now(),
        version: CACHE_VERSION
      }));
    } catch (localStorageError) {
      console.warn("Error storing sets in localStorage:", localStorageError);
    }
  }
};

// Try to get sets from Supabase first, fallback to API
export const fetchPokemonSets = async (): Promise<PokemonSet[]> => {
  console.log("Fetching Pokemon sets");
  
  // Check memory cache first
  if (setsCache.sets.length > 0 && (Date.now() - setsCache.timestamp < SETS_CACHE_TTL)) {
    console.log("Using memory cache for Pokemon sets, count:", setsCache.sets.length);
    return setsCache.sets;
  }
  
  // Try IndexedDB first
  try {
    const idbSets = await getSetsFromIndexedDB();
    if (idbSets && idbSets.length > 0) {
      console.log(`Using ${idbSets.length} sets from IndexedDB`);
      
      // Update memory cache
      setsCache.sets = idbSets;
      setsCache.timestamp = Date.now();
      
      return idbSets;
    }
  } catch (e) {
    console.warn("IndexedDB sets access failed:", e);
  }
  
  // Check localStorage cache if IndexedDB fails
  try {
    const localCache = localStorage.getItem(SETS_CACHE_KEY);
    
    if (localCache) {
      const parsedCache = JSON.parse(localCache);
      if (Date.now() - parsedCache.timestamp < SETS_CACHE_TTL) {
        console.log("Using localStorage cache for Pokemon sets, count:", parsedCache.sets.length);
        
        // Update memory cache
        setsCache.sets = parsedCache.sets;
        setsCache.timestamp = parsedCache.timestamp;
        
        return parsedCache.sets;
      }
    }
  } catch (e) {
    console.warn("Error accessing localStorage:", e);
  }
  
  // Try to get from Supabase first
  try {
    console.log("Trying to fetch from Supabase");
    const { data: supabaseSets, error } = await supabase
      .from('pokemon_sets')
      .select('*')
      .order('release_date', { ascending: false });
      
    if (!error && supabaseSets && supabaseSets.length > 0) {
      console.log(`Found ${supabaseSets.length} sets in Supabase`);
      
      // Cache the results
      cacheSets(supabaseSets);
      
      return supabaseSets;
    } else {
      console.log("No sets found in Supabase, falling back to API");
    }
  } catch (supabaseError) {
    console.error("Error fetching from Supabase:", supabaseError);
  }
  
  // Fallback to Pokemon TCG API
  return fetchSetsFromAPI();
};

// Fetch Pokemon sets from API
const fetchSetsFromAPI = async (): Promise<PokemonSet[]> => {
  console.log("Fetching Pokemon sets from API");
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for sets
    
    const response = await fetch("https://api.pokemontcg.io/v2/sets", { 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Retrieved ${data.data.length} Pokemon sets from API`);
    
    // Transform API response to match our PokemonSet interface
    const transformedSets = data.data.map((set: any) => ({
      id: 0, // This field isn't used when loading from API
      set_id: set.id,
      name: set.name,
      series: set.series,
      printed_total: set.printedTotal,
      total: set.total,
      release_date: set.releaseDate,
      symbol_url: set.images.symbol,
      logo_url: set.images.logo,
      images_url: set.images.logo // Prefer logo, fallback to symbol
    }));
