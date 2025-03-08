
// Pokemon cards API integration

const API_KEY = Deno.env.get("POKEMON_TCG_API_KEY") || "";

// Fetch cards for a specific Pokémon TCG set
export async function fetchPokemonCardsForSet(setId: string): Promise<any[]> {
  console.log(`Fetching Pokémon cards for set: ${setId}`);
  
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (API_KEY) {
      headers["X-Api-Key"] = API_KEY;
    }
    
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}`, {
      method: "GET",
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      console.log(`No cards found for set: ${setId}`);
      return [];
    }
    
    console.log(`Found ${data.data.length} cards for set: ${setId}`);
    return data.data;
  } catch (error) {
    console.error(`Error fetching Pokémon cards for set ${setId}:`, error);
    throw error;
  }
}
