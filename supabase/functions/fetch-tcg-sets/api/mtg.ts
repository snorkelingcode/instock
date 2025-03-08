
// Magic: The Gathering API module

// Fetch MTG sets - optimized to get only what we need
export async function fetchMTGSets(apiKey: string) {
  console.log("Fetching MTG sets...");
  
  const headers: HeadersInit = {};
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }
  
  const response = await fetch("https://api.scryfall.com/sets");
  
  if (!response.ok) {
    throw new Error(`Error fetching MTG sets: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`Retrieved ${data.data.length} MTG sets`);
  
  // Only extract the fields we need
  return data.data.map((set: any) => ({
    set_id: set.id,
    name: set.name,
    code: set.code,
    release_date: set.released_at,
    set_type: set.set_type,
    card_count: set.card_count,
    icon_url: set.icon_svg_uri,
    image_url: set.image_url || set.icon_svg_uri
  }));
}
