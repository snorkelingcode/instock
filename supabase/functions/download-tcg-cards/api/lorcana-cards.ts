
// Disney Lorcana cards API integration

// Fetch cards for a specific Lorcana set
export async function fetchLorcanaCardsForSet(setId: string): Promise<any[]> {
  console.log(`Fetching Lorcana cards for set: ${setId}`);
  
  try {
    const response = await fetch(`https://api.lorcana-api.com/cards?set=${encodeURIComponent(setId)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data)) {
      console.log(`No cards found for set: ${setId}`);
      return [];
    }
    
    console.log(`Found ${data.length} cards for set: ${setId}`);
    return data;
  } catch (error) {
    console.error(`Error fetching Lorcana cards for set ${setId}:`, error);
    throw error;
  }
}
