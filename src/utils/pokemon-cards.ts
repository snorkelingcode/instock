
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

// Fetch cards from API with optimized error handling and retries
export const fetchPokemonCards = async (setId: string): Promise<PokemonCard[]> => {
  console.log(`Fetching cards for set: ${setId}`);
  
  // Check if we have cached cards and they're less than 5 minutes old
  const cached = cardCache.get(setId);
  if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
    console.log(`Using cached cards for set: ${setId}`);
    return cached.cards;
  }
  
  // Maximum retries for database or API errors
  const MAX_RETRIES = 3;
  let retryCount = 0;
  
  while (retryCount <= MAX_RETRIES) {
    try {
      // First, try to fetch from our database for faster loading
      const { data: dbCards, error: dbError } = await supabase
        .from('pokemon_cards')
        .select('*')
        .eq('set_id', setId)
        .order('number', { ascending: true });
      
      if (!dbError && dbCards && dbCards.length > 0) {
        console.log(`Found ${dbCards.length} cards in database for set: ${setId}`);
        
        // Format to match PokemonCard interface and normalize the data
        const formattedCards = dbCards.map((card: any) => normalizeCardData({
          id: card.card_id,
          name: card.name,
          supertype: card.supertype,
          subtypes: card.subtypes,
          hp: card.hp,
          types: card.types,
          evolves_from: card.evolves_from,
          evolves_to: card.evolves_to,
          rules: card.rules,
          attacks: card.attacks,
          weaknesses: card.weaknesses,
          resistances: card.resistances,
          retreat_cost: card.retreat_cost,
          converted_retreat_cost: card.converted_retreat_cost,
          set: card.set_id,
          number: card.number,
          artist: card.artist,
          rarity: card.rarity,
          national_pokedex_numbers: card.national_pokedex_numbers,
          legalities: card.legalities,
          images: card.images,
          tcgplayer: card.tcgplayer
        }));
        
        // Cache the results
        cardCache.set(setId, {
          cards: formattedCards,
          timestamp: Date.now()
        });
        
        return sortCardsByNumber(formattedCards);
      }
      
      // If not in database or error, fetch from API with timeout
      console.log(`Fetching from API for set: ${setId}`);
      
      // Shorter timeout to prevent long waits - 8 seconds (increased from 5)
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
        
        // Cache the results
        cardCache.set(setId, {
          cards: fetchedCards,
          timestamp: Date.now()
        });
        
        return sortCardsByNumber(fetchedCards);
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
