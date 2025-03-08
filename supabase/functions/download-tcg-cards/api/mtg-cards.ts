
// Magic: The Gathering API module for card downloads

export async function downloadMTGCards(apiKey: string, setId?: string) {
  console.log(`Downloading MTG cards${setId ? ` for set: ${setId}` : ''}`);
  
  // Build the URL - We're using Scryfall API as it's more reliable
  let url = "https://api.scryfall.com/cards/search?include_extras=true&include_variations=true";
  
  // If set ID is provided, filter by set
  if (setId) {
    url += `&q=set:${setId}`;
  } else {
    // Just get the most recent 1000 cards if no setId is provided to avoid overloading
    url += `&q=year>=2022`;
  }
  
  const cards: any[] = [];
  let nextPage = url;
  
  // Use pagination to get all cards
  while (nextPage) {
    console.log(`Fetching MTG cards from: ${nextPage}`);
    
    const response = await fetch(nextPage);
    
    if (!response.ok) {
      throw new Error(`Error fetching MTG cards: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Add cards to our collection
    if (data.data && data.data.length > 0) {
      cards.push(...data.data);
      console.log(`Retrieved ${data.data.length} more MTG cards, total: ${cards.length}`);
    }
    
    // Check if there's another page
    nextPage = data.has_more ? data.next_page : null;
    
    // Add a small delay to avoid rate limiting
    if (nextPage) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`Total MTG cards retrieved: ${cards.length}`);
  
  // Transform data to match our database schema
  return cards.map((card: any) => ({
    card_id: card.id,
    name: card.name,
    printed_name: card.printed_name,
    lang: card.lang,
    released_at: card.released_at,
    layout: card.layout,
    mana_cost: card.mana_cost,
    cmc: card.cmc,
    type_line: card.type_line,
    oracle_text: card.oracle_text,
    colors: card.colors,
    color_identity: card.color_identity,
    keywords: card.keywords,
    legalities: JSON.stringify(card.legalities),
    games: card.games,
    reserved: card.reserved,
    foil: card.foil,
    nonfoil: card.nonfoil,
    finishes: card.finishes,
    oversized: card.oversized,
    promo: card.promo,
    reprint: card.reprint,
    variation: card.variation,
    set_id: card.set,
    set_name: card.set_name,
    set_type: card.set_type,
    set_uri: card.set_uri,
    set_search_uri: card.set_search_uri,
    scryfall_uri: card.scryfall_uri,
    rulings_uri: card.rulings_uri,
    prints_search_uri: card.prints_search_uri,
    collector_number: card.collector_number,
    digital: card.digital,
    rarity: card.rarity,
    flavor_text: card.flavor_text,
    card_back_id: card.card_back_id,
    artist: card.artist,
    artist_ids: card.artist_ids,
    illustration_id: card.illustration_id,
    border_color: card.border_color,
    frame: card.frame,
    full_art: card.full_art,
    textless: card.textless,
    booster: card.booster,
    story_spotlight: card.story_spotlight,
    prices: card.prices ? JSON.stringify(card.prices) : null,
    related_uris: card.related_uris ? JSON.stringify(card.related_uris) : null,
    purchase_uris: card.purchase_uris ? JSON.stringify(card.purchase_uris) : null,
    image_uris: card.image_uris ? JSON.stringify(card.image_uris) : null
  }));
}
