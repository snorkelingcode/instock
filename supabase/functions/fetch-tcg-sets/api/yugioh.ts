
// Yu-Gi-Oh! API module

// Fetch YuGiOh sets - optimized to get only what we need
export async function fetchYuGiOhSets() {
  console.log("Fetching Yu-Gi-Oh! sets...");
  
  const response = await fetch("https://db.ygoprodeck.com/api/v7/cardsets.php");
  
  if (!response.ok) {
    throw new Error(`Error fetching YuGiOh sets: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`Retrieved ${data.length} Yu-Gi-Oh! sets`);
  
  // Only extract the fields we need and ensure we have unique IDs
  return data.map((set: any, index: number) => ({
    set_id: set.set_code || `yugioh-set-${index}`,
    name: set.set_name,
    set_code: set.set_code,
    num_of_cards: set.num_of_cards,
    tcg_date: set.tcg_date,
    set_image: `https://images.ygoprodeck.com/images/sets/${set.set_code}.jpg`,
    set_type: set.set_type || "Main Set"
  }));
}
