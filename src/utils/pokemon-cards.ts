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

// Helper function to cache cards
const cacheCards = (setId: string, cards: PokemonCard[]) => {
  const cacheKey = `${setId}_full`;
  
  // Update memory cache
  cardCache.set(cacheKey, {
    cards,
    timestamp: Date.now()
  });
  
  // Cache in localStorage
  try {
    localStorage.setItem(`${CARDS_CACHE_KEY_PREFIX}${setId}`, JSON.stringify({
      cards,
      timestamp: Date.now()
    }));
    console.log(`Cached ${cards.length} cards for set ${setId}`);
  } catch (e) {
    console.warn("Error storing cards in localStorage:", e);
  }
};

// Constants for cards per page and prefetching
const CARDS_PER_PAGE = 60; // Increased from 40 to 60
const PREFETCH_BUFFER = 20; // Extra buffer for secret rares

// Try to get data from Supabase first, fallback to API
export const fetchPokemonCards = async (
  setId: string, 
  options: { page?: number; pageSize?: number } = {}
): Promise<{ cards: PokemonCard[], totalCount: number, hasMore: boolean }> => {
  console.log(`Fetching cards for set: ${setId}, page: ${options.page || 1}`);
  
  const pageSize = options.pageSize || CARDS_PER_PAGE;
  const page = options.page || 1;
  const cacheKey = `${setId}_full`;
  
  // Check memory cache first for the full set
  const cached = cardCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CARDS_CACHE_TTL)) {
    console.log(`Using memory cache for set: ${setId}`);
    
    // Process pagination from the cached complete set
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedCards = cached.cards.slice(startIdx, endIdx);
    const hasMore = endIdx < cached.cards.length;
    
    // If we're near the end, prefetch the next chunk in the background
    if (hasMore && cached.cards.length - endIdx < pageSize) {
      console.log("Near the end of cached data, prefetching next chunk");
      // No need to wait for this to complete
      setTimeout(() => {
        prefetchNextPage(setId, page + 1, pageSize);
      }, 1000);
    }
    
    return { 
      cards: paginatedCards, 
      totalCount: cached.cards.length,
      hasMore 
    };
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
        cardCache.set(cacheKey, {
          cards: parsedCache.cards,
          timestamp: parsedCache.timestamp
        });
        
        // Process pagination from the cached complete set
        const startIdx = (page - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        const paginatedCards = parsedCache.cards.slice(startIdx, endIdx);
        const hasMore = endIdx < parsedCache.cards.length;
        
        return { 
          cards: paginatedCards, 
          totalCount: parsedCache.cards.length,
          hasMore 
        };
      }
    }
  } catch (e) {
    console.warn("Error accessing localStorage:", e);
  }
  
  // Try to get from Supabase
  try {
    console.log(`Trying to fetch from Supabase for set: ${setId}, page: ${page}`);
    
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
    
    // Then get the paginated results
    const { data: supabaseCards, error } = await supabase
      .from('pokemon_cards')
      .select('*')
      .eq('set_id', setId)
      .range((page - 1) * pageSize, page * pageSize - 1);
      
    if (!error && supabaseCards && supabaseCards.length > 0) {
      console.log(`Found ${supabaseCards.length} cards in Supabase for set: ${setId}`);
      
      // Process the cards
      const processedCards = supabaseCards.map(card => normalizeCardData(card));
      const sortedCards = sortCardsByNumber(processedCards);
      
      // Calculate if there are more pages
      const hasMore = page * pageSize < totalCount;
      
      // If it's the first page, prefetch the next page in the background
      if (hasMore) {
        // Prefetch next page for smoother experience
        setTimeout(() => {
          prefetchNextPage(setId, page + 1, pageSize);
        }, 1000);
        
        // Also start a background fetch of all cards if we're on the first page
        // This will help with future browsing
        if (page === 1) {
          setTimeout(() => {
            fetchAllCardsFromAPI(setId);
          }, 3000);
        }
      }
      
      return { 
        cards: sortedCards, 
        totalCount,
        hasMore 
      };
    } else {
      console.log(`No cards found in Supabase for set: ${setId}, falling back to API`);
    }
  } catch (supabaseError) {
    console.error(`Error fetching from Supabase for set: ${setId}:`, supabaseError);
  }
  
  // Fallback to Pokemon TCG API with pagination
  return fetchCardsFromAPIWithPagination(setId, page, pageSize);
};

// Prefetch next page for better UX
const prefetchNextPage = async (setId: string, nextPage: number, pageSize: number) => {
  try {
    // Don't await, just trigger the call
    fetchPokemonCards(setId, { page: nextPage, pageSize });
    console.log(`Prefetching page ${nextPage} for set ${setId} in background`);
  } catch (error) {
    // Silently fail on prefetch errors
    console.warn(`Background prefetch failed for set ${setId}:`, error);
  }
};

// Fetch cards from API with pagination
const fetchCardsFromAPIWithPagination = async (
  setId: string, 
  page: number, 
  pageSize: number
): Promise<{ cards: PokemonCard[], totalCount: number, hasMore: boolean }> => {
  console.log(`Fetching from API for set: ${setId}, page: ${page}, pageSize: ${pageSize}`);
  
  try {
    // Use consistent timeout - 8 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    try {
      // The API supports pagination, but we need to get total count first
      const totalCountResponse = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&page=1&pageSize=1`, 
        { signal: controller.signal }
      );
      
      if (!totalCountResponse.ok) {
        throw new Error(`API responded with status: ${totalCountResponse.status}`);
      }
      
      const totalCountData = await totalCountResponse.json();
      const totalCount = totalCountData.totalCount || 0;
      
      // For the actual page request, use a more reasonable pageSize
      // For the first page, make it larger to include potential secret rares
      const actualPageSize = page === 1 
        ? Math.min(pageSize + PREFETCH_BUFFER, 80) // Increased buffer
        : pageSize;
      
      // Now get the actual page
      const response = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&page=${page}&pageSize=${actualPageSize}&orderBy=number`, 
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
      
      console.log(`Retrieved ${sortedCards.length} cards for set ${setId}`);
      
      // Check if we have more cards
      const hasMore = page * actualPageSize < totalCount || totalCount > data.data.length;
      
      // If we have more pages, prefetch the next one in the background
      if (hasMore) {
        setTimeout(() => {
          prefetchNextPage(setId, page + 1, pageSize);
        }, 1000);
      }
      
      return { 
        cards: sortedCards,
        totalCount: Math.max(totalCount, data.data.length), // Account for secret rares
        hasMore
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('API request timed out, retrying...');
        throw new Error('Request timed out. The API is taking too long to respond.');
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error fetching cards for set ${setId}:`, error);
    throw error;
  }
};

// New function to fetch all cards for background caching
const fetchAllCardsFromAPI = async (setId: string): Promise<void> => {
  console.log(`Background fetch of all cards for set: ${setId}`);
  
  try {
    // Get the total count first
    const countResponse = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&page=1&pageSize=1`
    );
    
    if (!countResponse.ok) {
      throw new Error(`API count request failed: ${countResponse.status}`);
    }
    
    const countData = await countResponse.json();
    const totalCount = countData.totalCount || 0;
    
    if (totalCount === 0) {
      return;
    }
    
    // Now fetch all cards in one go (or with reasonable page size for larger sets)
    // Use a larger page size to try to get all cards including secret rares
    const pageSize = Math.max(350, totalCount + 50); // Significantly increased buffer
    
    console.log(`Fetching all ${totalCount}+ cards for set ${setId} with page size ${pageSize}`);
    
    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=${pageSize}&orderBy=number`
    );
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process and cache all cards
    const fetchedCards = data.data.map((card: any) => normalizeCardData(card));
    const sortedCards = sortCardsByNumber(fetchedCards);
    
    console.log(`Fetched ${sortedCards.length} cards for set ${setId}`);
    
    // Log any secret rares found (cards with numbers greater than the printed total)
    const setDetails = await fetchPokemonSets();
    const currentSet = setDetails.find(set => set.set_id === setId);
    
    if (currentSet) {
      const printedTotal = currentSet.printed_total || currentSet.total || 0;
      const secretRares = sortedCards.filter(card => {
        const cardNumber = parseInt(card.number.match(/^\d+/)?.[0] || '0', 10);
        return cardNumber > printedTotal;
      });
      
      if (secretRares.length > 0) {
        console.log(`Found ${secretRares.length} secret rares in set ${setId} beyond the printed total of ${printedTotal}`);
        secretRares.forEach(card => console.log(`Secret rare: ${card.name} (${card.number})`));
      }
    }
    
    // Cache the complete set
    cacheCards(setId, sortedCards);
    
    console.log(`Successfully cached all ${sortedCards.length} cards for set ${setId}`);
  } catch (error) {
    console.error(`Background caching of all cards failed for set ${setId}:`, error);
    // Don't rethrow as this is a background operation
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
  
  // Check localStorage cache
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

// Helper function to cache sets
const cacheSets = (sets: PokemonSet[]) => {
  console.log(`Caching ${sets.length} Pokemon sets`);
  
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
