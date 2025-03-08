
// Pokemon TCG API module

// Fetch Pokemon TCG sets - optimized to get only what we need
export async function fetchPokemonSets(apiKey: string) {
  console.log("Fetching Pokemon TCG sets...");
  
  const headers: HeadersInit = {};
  if (apiKey) {
    headers["X-Api-Key"] = apiKey;
  }
  
  const response = await fetch("https://api.pokemontcg.io/v2/sets", { headers });
  
  if (!response.ok) {
    throw new Error(`Error fetching Pokemon sets: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`Retrieved ${data.data.length} Pokemon sets`);
  
  // Only extract the fields we need
  return data.data.map((set: any) => ({
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
}
