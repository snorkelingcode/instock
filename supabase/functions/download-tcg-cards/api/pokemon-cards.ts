
// Pokemon TCG API module for card downloads

export async function downloadPokemonCards(apiKey: string, setId?: string) {
  console.log(`Downloading Pokemon cards${setId ? ` for set: ${setId}` : ''}`);
  
  const headers: HeadersInit = {};
  if (apiKey) {
    headers["X-Api-Key"] = apiKey;
  }
  
  // Build the URL
  let url = "https://api.pokemontcg.io/v2/cards";
  
  // If set ID is provided, filter by set
  if (setId) {
    url += `?q=set.id:${setId}`;
  }
  
  // Fetch the cards
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`Error fetching Pokemon cards: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`Retrieved ${data.data.length} Pokemon cards`);
  
  // Transform data to match our database schema
  return data.data.map((card: any) => ({
    card_id: card.id,
    name: card.name,
    supertype: card.supertype,
    subtypes: card.subtypes,
    hp: card.hp,
    types: card.types,
    evolves_from: card.evolvesFrom,
    evolves_to: card.evolvesTo,
    rules: card.rules,
    attacks: card.attacks ? JSON.stringify(card.attacks) : null,
    weaknesses: card.weaknesses ? JSON.stringify(card.weaknesses) : null,
    resistances: card.resistances ? JSON.stringify(card.resistances) : null,
    retreat_cost: card.retreatCost,
    converted_retreat_cost: card.convertedRetreatCost,
    set_id: card.set.id,
    number: card.number,
    artist: card.artist,
    rarity: card.rarity,
    flavor_text: card.flavorText,
    national_pokedex_numbers: card.nationalPokedexNumbers,
    legalities: card.legalities ? JSON.stringify(card.legalities) : null,
    images: card.images ? JSON.stringify(card.images) : null,
    tcgplayer: card.tcgplayer ? JSON.stringify(card.tcgplayer) : null,
    cardmarket: card.cardmarket ? JSON.stringify(card.cardmarket) : null
  }));
}
