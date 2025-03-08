
// Yu-Gi-Oh! cards API integration

// Fetch cards for a specific Yu-Gi-Oh! set
export async function fetchYugiohCardsForSet(setId: string): Promise<any[]> {
  console.log(`Fetching Yu-Gi-Oh! cards for set: ${setId}`);
  
  try {
    const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=${encodeURIComponent(setId)}`, {
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
    console.error(`Error fetching Yu-Gi-Oh! cards for set ${setId}:`, error);
    throw error;
  }
}
