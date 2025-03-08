
// Pokemon cards API integration

const API_KEY = Deno.env.get("POKEMON_TCG_API_KEY") || "";

// Interface for Pokemon card
interface PokemonCard {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  images: Record<string, string>;
  set: {
    id: string;
    name?: string;
  };
  [key: string]: any; // Allow for additional properties
}

// Fetch cards for a specific Pokémon TCG set
export async function fetchPokemonCardsForSet(setId: string): Promise<PokemonCard[]> {
  console.log(`Fetching Pokémon cards for set: ${setId}`);
  
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (API_KEY) {
      headers["X-Api-Key"] = API_KEY;
    }
    
    // Log when API key is missing
    if (!API_KEY) {
      console.warn("No Pokemon TCG API key found in environment variables. Using limited public access.");
    }
    
    // Add orderBy parameter to get cards in proper number order
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&orderBy=number`, {
      method: "GET",
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      console.log(`No cards found for set: ${setId}`);
      return [];
    }
    
    console.log(`Found ${data.data.length} cards for set: ${setId}`);
    
    // Sort cards by number to ensure correct ordering
    const sortedCards = data.data.sort((a: PokemonCard, b: PokemonCard) => {
      const numA = parseInt(a.number.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.number.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
    
    return sortedCards as PokemonCard[];
  } catch (error) {
    console.error(`Error fetching Pokémon cards for set ${setId}:`, error);
    throw error;
  }
}

// Interface for Pokemon set
interface PokemonSet {
  id: string;
  name: string;
  series: string;
  printedTotal?: number;
  total?: number;
  releaseDate?: string;
  images: {
    symbol: string;
    logo: string;
  };
  [key: string]: any; // Allow for additional properties
}

// Get information about available sets
export async function fetchPokemonSets(): Promise<PokemonSet[]> {
  console.log("Fetching available Pokémon TCG sets");
  
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (API_KEY) {
      headers["X-Api-Key"] = API_KEY;
    }
    
    const response = await fetch("https://api.pokemontcg.io/v2/sets", {
      method: "GET",
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      console.log("No sets found");
      return [];
    }
    
    console.log(`Found ${data.data.length} Pokémon TCG sets`);
    return data.data as PokemonSet[];
  } catch (error) {
    console.error("Error fetching Pokémon TCG sets:", error);
    throw error;
  }
}
