
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

// Cache for Pokémon cards by set ID
const cardCache = new Map<string, {
  cards: PokemonCard[];
  timestamp: number;
}>();

// Memory cache for sets
const setsCache: {
  sets: PokemonSet[];
  timestamp: number;
} = { sets: [], timestamp: 0 };

// Local storage cache keys
const SETS_CACHE_KEY = 'pokemon_sets_cache';
const CARDS_CACHE_KEY_PREFIX = 'pokemon_cards_cache_';

// Cache expiration time (10 minutes for sets, 30 minutes for cards)
const SETS_CACHE_TTL = 10 * 60 * 1000; 
const CARDS_CACHE_TTL = 30 * 60 * 1000;

// Determine if a string is a valid number
const isNumeric = (str: string) => {
  // Handle strings like '001', '1a', etc.
  const numericPart = str.match(/^\d+/);
  return numericPart !== null;
};

// Sort cards by number correctly
export const sortCardsByNumber = (cards: PokemonCard[]): PokemonCard[] => {
  return [...cards].sort((a, b) => {
    // Handle non-numeric card numbers (like promos)
    if (!isNumeric(a.number) && isNumeric(b.number)) {
      return 1; // Non-numeric after numeric
    }
    if (isNumeric(a.number) && !isNumeric(b.number)) {
      return -1; // Numeric before non-numeric
    }
    if (!isNumeric(a.number) && !isNumeric(b.number)) {
      return a.number.localeCompare(b.number); // Both non-numeric, sort alphabetically
    }

    // For numeric values, extract the numeric part and compare
    const aNum = parseInt(a.number.match(/^\d+/)?.[0] || '0', 10);
    const bNum = parseInt(b.number.match(/^\d+/)?.[0] || '0', 10);
    return aNum - bNum;
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

// Try to get data from Supabase first, fallback to API
export const fetchPokemonCards = async (setId: string): Promise<PokemonCard[]> => {
  console.log(`Fetching cards for set: ${setId}`);
  
  // Check memory cache first
  const cached = cardCache.get(setId);
  if (cached && (Date.now() - cached.timestamp < CARDS_CACHE_TTL)) {
    console.log(`Using memory cache for set: ${setId}`);
    return cached.cards;
  }
  
  // Check localStorage cache
  try {
    const localCacheKey = `${CARDS_CACHE_KEY_PREFIX}${setId}`;
    const localCache = localStorage.getItem(localCacheKey);
    
    if (localCache) {
      const parsedCache = JSON.parse(localCache);
      if (Date.now() - parsedCache.timestamp < CARDS_CACHE_TTL) {
        console.log(`Using localStorage cache for set: ${setId}`);
        
        // Store in memory cache too
        cardCache.set(setId, {
          cards: parsedCache.cards,
          timestamp: parsedCache.timestamp
        });
        
        return parsedCache.cards;
      }
    }
  } catch (e) {
    console.warn("Error accessing localStorage:", e);
  }
  
  // Try to get from Supabase first
  try {
    console.log(`Trying to fetch from Supabase for set: ${setId}`);
    const { data: supabaseCards, error } = await supabase
      .from('pokemon_cards')
      .select('*')
      .eq('set_id', setId);
      
    if (!error && supabaseCards && supabaseCards.length > 0) {
      console.log(`Found ${supabaseCards.length} cards in Supabase for set: ${setId}`);
      
      // Process the cards and cache them
      const processedCards = supabaseCards.map(card => normalizeCardData(card));
      const sortedCards = sortCardsByNumber(processedCards);
      
      // Cache the results
      cacheCards(setId, sortedCards);
      
      return sortedCards;
    } else {
      console.log(`No cards found in Supabase for set: ${setId}, falling back to API`);
    }
  } catch (supabaseError) {
    console.error(`Error fetching from Supabase for set: ${setId}:`, supabaseError);
  }
  
  // Fallback to Pokemon TCG API
  return fetchCardsFromAPI(setId);
};

// Helper function to cache cards
const cacheCards = (setId: string, cards: PokemonCard[]) => {
  // Cache in memory
  cardCache.set(setId, {
    cards,
    timestamp: Date.now()
  });
  
  // Cache in localStorage
  try {
    const localCacheKey = `${CARDS_CACHE_KEY_PREFIX}${setId}`;
    localStorage.setItem(localCacheKey, JSON.stringify({
      cards,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn("Error storing in localStorage:", e);
  }
};

// Fetch cards from API with optimized error handling and retries
const fetchCardsFromAPI = async (setId: string): Promise<PokemonCard[]> => {
  console.log(`Fetching from API for set: ${setId}`);
  
  // Maximum retries for API errors
  const MAX_RETRIES = 3;
  let retryCount = 0;
  
  while (retryCount <= MAX_RETRIES) {
    try {
      // Use consistent timeout - 8 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        const response = await fetch(
          `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&orderBy=number&pageSize=250`, 
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Apply normalization to ensure consistent data structure
        const fetchedCards = data.data.map((card: any) => normalizeCardData(card));
        const sortedCards = sortCardsByNumber(fetchedCards);
        
        // Cache the results
        cacheCards(setId, sortedCards);
        
        return sortedCards;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('API request timed out, retrying...');
          retryCount++;
          // Add exponential backoff - wait longer between retries
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          
          // If we have more retries to go, continue the loop
          if (retryCount <= MAX_RETRIES) continue;
          throw new Error('Request timed out after multiple attempts. The API is taking too long to respond.');
        }
        throw error;
      }
    } catch (error) {
      retryCount++;
      if (retryCount <= MAX_RETRIES) {
        console.error(`Error fetching cards for set ${setId}, retry ${retryCount}:`, error);
        // Wait a second before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      
      console.error(`Failed to fetch cards for set ${setId} after ${MAX_RETRIES} retries:`, error);
      throw error;
    }
  }
  
  // This should not be reached due to the throw in the catch block, but TypeScript wants a return
  throw new Error(`Failed to fetch cards for set ${setId} after ${MAX_RETRIES} retries`);
};

// Try to get sets from Supabase first, fallback to API
export const fetchPokemonSets = async (): Promise<PokemonSet[]> => {
  console.log("Fetching Pokemon sets");
  
  // Check memory cache first
  if (setsCache.sets.length > 0 && (Date.now() - setsCache.timestamp < SETS_CACHE_TTL)) {
    console.log("Using memory cache for Pokemon sets");
    return setsCache.sets;
  }
  
  // Check localStorage cache
  try {
    const localCache = localStorage.getItem(SETS_CACHE_KEY);
    
    if (localCache) {
      const parsedCache = JSON.parse(localCache);
      if (Date.now() - parsedCache.timestamp < SETS_CACHE_TTL) {
        console.log("Using localStorage cache for Pokemon sets");
        
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

// Helper function to cache sets
const cacheSets = (sets: PokemonSet[]) => {
  // Update memory cache
  setsCache.sets = sets;
  setsCache.timestamp = Date.now();
  
  // Cache in localStorage
  try {
    localStorage.setItem(SETS_CACHE_KEY, JSON.stringify({
      sets,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn("Error storing in localStorage:", e);
  }
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
    
    // Sort by release date
    const sortedSets = transformedSets.sort((a: PokemonSet, b: PokemonSet) => {
      return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
    });
    
    // Cache the results
    cacheSets(sortedSets);
    
    return sortedSets;
  } catch (error) {
    console.error("Error fetching Pokemon sets:", error);
    throw error;
  }
};

// Clear all caches
export const clearPokemonCaches = () => {
  // Clear memory caches
  cardCache.clear();
  setsCache.sets = [];
  setsCache.timestamp = 0;
  
  // Clear localStorage caches
  try {
    localStorage.removeItem(SETS_CACHE_KEY);
    
    // Clear all card caches
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CARDS_CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log("Pokemon caches cleared");
  } catch (e) {
    console.warn("Error clearing localStorage caches:", e);
  }
};
