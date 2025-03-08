
// Yu-Gi-Oh! API module for card downloads

export async function downloadYuGiOhCards(setId?: string) {
  console.log(`Downloading Yu-Gi-Oh! cards${setId ? ` for set: ${setId}` : ''}`);
  
  // Build the URL
  let url = "https://db.ygoprodeck.com/api/v7/cardinfo.php";
  
  // If set ID is provided, filter by set
  if (setId) {
    url += `?cardset=${encodeURIComponent(setId)}`;
  }
  
  // Fetch the cards
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Error fetching Yu-Gi-Oh! cards: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`Retrieved ${data.data.length} Yu-Gi-Oh! cards`);
  
  // Transform data to match our database schema
  return data.data.map((card: any) => ({
    card_id: card.id.toString(),
    name: card.name,
    type: card.type,
    desc: card.desc,
    atk: card.atk,
    def: card.def,
    level: card.level,
    race: card.race,
    attribute: card.attribute,
    archetype: card.archetype,
    scale: card.scale,
    linkval: card.linkval,
    linkmarkers: card.linkmarkers,
    set_id: setId || (card.card_sets && card.card_sets.length > 0 ? card.card_sets[0].set_code : null),
    set_name: card.card_sets && card.card_sets.length > 0 ? card.card_sets[0].set_name : null,
    set_code: card.card_sets && card.card_sets.length > 0 ? card.card_sets[0].set_code : null,
    set_rarity: card.card_sets && card.card_sets.length > 0 ? card.card_sets[0].set_rarity : null,
    set_rarity_code: card.card_sets && card.card_sets.length > 0 ? card.card_sets[0].set_rarity_code : null,
    set_price: card.card_sets && card.card_sets.length > 0 ? card.card_sets[0].set_price : null,
    card_prices: card.card_prices ? JSON.stringify(card.card_prices) : null,
    card_images: card.card_images ? JSON.stringify(card.card_images) : null,
    card_sets: card.card_sets ? JSON.stringify(card.card_sets) : null,
    banlist_info: card.banlist_info ? JSON.stringify(card.banlist_info) : null
  }));
}
