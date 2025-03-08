
// MTG cards API integration

const API_KEY = Deno.env.get("MTG_API_KEY") || "";

// Fetch cards for a specific MTG set
export async function fetchMTGCardsForSet(setId: string): Promise<any[]> {
  console.log(`Fetching MTG cards for set: ${setId}`);
  
  try {
    const response = await fetch(`https://api.scryfall.com/cards/search?q=set:${setId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
    console.error(`Error fetching MTG cards for set ${setId}:`, error);
    throw error;
  }
}
