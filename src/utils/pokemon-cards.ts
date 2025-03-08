
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

// Fetch cards from API with timeout and proper error handling
export const fetchPokemonCards = async (setId: string): Promise<PokemonCard[]> => {
  console.log(`Fetching cards for set: ${setId}`);
  
  // Check if we have cached cards and they're less than 5 minutes old
  const cached = cardCache.get(setId);
  if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
    console.log(`Using cached cards for set: ${setId}`);
    return cached.cards;
  }
  
  try {
    // First, try to fetch from our database for faster loading
    const { data: dbCards, error: dbError } = await supabase
      .from('pokemon_cards')
      .select('*')
      .eq('set_id', setId)
      .order('number', { ascending: true });
    
    if (!dbError && dbCards && dbCards.length > 0) {
      console.log(`Found ${dbCards.length} cards in database for set: ${setId}`);
      
      // Format to match PokemonCard interface (if necessary)
      const formattedCards = dbCards.map((card: any) => ({
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
      })) as PokemonCard[];
      
      // Cache the results
      cardCache.set(setId, {
        cards: formattedCards,
        timestamp: Date.now()
      });
      
      return sortCardsByNumber(formattedCards);
    }
    
    // If not in database or error, fetch from API with timeout
    console.log(`Fetching from API for set: ${setId}`);
    
    // Set up timeout - 8 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    try {
      const response = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&orderBy=number`, 
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      const fetchedCards = data.data as PokemonCard[];
      
      // Cache the results
      cardCache.set(setId, {
        cards: fetchedCards,
        timestamp: Date.now()
      });
      
      return sortCardsByNumber(fetchedCards);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('API request timed out');
        throw new Error('Request timed out. The API is taking too long to respond.');
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error fetching cards for set ${setId}:`, error);
    throw error;
  }
};
