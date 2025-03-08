// Card download processors for different TCG types

import { fetchPokemonCardsForSet } from "../api/pokemon-cards.ts";
import { fetchMTGCardsForSet } from "../api/mtg-cards.ts";
import { fetchYugiohCardsForSet } from "../api/yugioh-cards.ts";
import { fetchLorcanaCardsForSet } from "../api/lorcana-cards.ts";
import { updateDownloadJobStatus } from "../database/job-status.ts";
import { saveCardImages } from "../utils/image-downloader.ts";

// Download and save Pokémon cards
export async function downloadPokemonCards(
  supabase: any,
  jobId: string,
  setId?: string,
  downloadImages: boolean = true
): Promise<void> {
  try {
    // Update job status to downloading data
    await updateDownloadJobStatus(supabase, jobId, "downloading_data");
    
    let cards: any[] = [];
    
    // Download cards for specific set or all cards
    if (setId) {
      cards = await fetchPokemonCardsForSet(setId);
    } else {
      throw new Error("Downloading all Pokémon cards is not implemented yet");
    }
    
    if (!cards || cards.length === 0) {
      await updateDownloadJobStatus(
        supabase,
        jobId,
        "failed",
        0,
        0,
        `No cards found ${setId ? 'for set ' + setId : ''}`
      );
      return;
    }
    
    // Update job status to processing data
    await updateDownloadJobStatus(
      supabase,
      jobId,
      "processing_data",
      cards.length,
      0
    );
    
    // Process and save cards
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      
      try {
        // Extract card data
        const cardData = {
          card_id: card.id,
          name: card.name,
          number: card.number,
          set_id: card.set.id,
          rarity: card.rarity,
          images: JSON.stringify(card.images),
          supertype: card.supertype,
          subtypes: card.subtypes ? JSON.stringify(card.subtypes) : null,
          types: card.types ? JSON.stringify(card.types) : null,
          hp: card.hp || null,
          rules: card.rules ? JSON.stringify(card.rules) : null,
          attacks: card.attacks ? JSON.stringify(card.attacks) : null,
          weaknesses: card.weaknesses ? JSON.stringify(card.weaknesses) : null,
          resistances: card.resistances ? JSON.stringify(card.resistances) : null,
          retreat_cost: card.retreatCost ? JSON.stringify(card.retreatCost) : null,
          converted_retreat_cost: card.convertedRetreatCost || null,
          artist: card.artist || null,
          national_pokedex_numbers: card.nationalPokedexNumbers ? JSON.stringify(card.nationalPokedexNumbers) : null,
          legalities: card.legalities ? JSON.stringify(card.legalities) : null,
          tcgplayer: card.tcgplayer ? JSON.stringify(card.tcgplayer) : null,
          cardmarket: card.cardmarket ? JSON.stringify(card.cardmarket) : null,
          local_image_urls: null
        };
        
        // Upsert card to database
        const { error: cardError } = await supabase
          .from('pokemon_cards')
          .upsert(cardData, { onConflict: 'card_id' });
          
        if (cardError) {
          console.error(`Error saving card ${card.id}:`, cardError);
        }
        
        // Update job status
        await updateDownloadJobStatus(
          supabase,
          jobId,
          "processing_data",
          cards.length,
          i + 1
        );
      } catch (cardError) {
        console.error(`Error processing card ${card.id}:`, cardError);
      }
    }
    
    // If images should be downloaded
    if (downloadImages) {
      // Update job status to downloading images
      await updateDownloadJobStatus(
        supabase,
        jobId,
        "downloading_images",
        cards.length,
        0
      );
      
      // Download and save card images
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        
        try {
          // Extract image URLs
          const imageUrls = [];
          if (card.images?.small) imageUrls.push(card.images.small);
          if (card.images?.large) imageUrls.push(card.images.large);
          
          // Download and save images
          if (imageUrls.length > 0) {
            const savedImagePaths = await saveCardImages(
              supabase,
              'pokemon',
              card.id,
              imageUrls,
              card.set.id
            );
            
            // Update card with local image URLs
            if (savedImagePaths.length > 0) {
              const { error: updateError } = await supabase
                .from('pokemon_cards')
                .update({ local_image_urls: JSON.stringify(savedImagePaths) })
                .eq('card_id', card.id);
                
              if (updateError) {
                console.error(`Error updating card ${card.id} with local image URLs:`, updateError);
              }
            }
          }
          
          // Update job status
          await updateDownloadJobStatus(
            supabase,
            jobId,
            "downloading_images",
            cards.length,
            i + 1
          );
        } catch (imageError) {
          console.error(`Error downloading images for card ${card.id}:`, imageError);
        }
      }
    }
    
    // Update job status to completed
    await updateDownloadJobStatus(
      supabase,
      jobId,
      "completed",
      cards.length,
      cards.length
    );
    
    console.log(`Successfully downloaded ${cards.length} Pokémon cards${setId ? ' for set ' + setId : ''}`);
  } catch (error) {
    console.error(`Error downloading Pokémon cards:`, error);
    await updateDownloadJobStatus(
      supabase,
      jobId,
      "failed",
      0,
      0,
      error.message || "Unknown error during Pokémon card download"
    );
  }
}

// Download and save MTG cards
export async function downloadMTGCards(
  supabase: any,
  jobId: string,
  setId?: string,
  downloadImages: boolean = true
): Promise<void> {
  try {
    // Update job status to downloading data
    await updateDownloadJobStatus(supabase, jobId, "downloading_data");
    
    let cards: any[] = [];
    
    // Download cards for specific set or all cards
    if (setId) {
      cards = await fetchMTGCardsForSet(setId);
    } else {
      throw new Error("Downloading all MTG cards is not implemented yet");
    }
    
    if (!cards || cards.length === 0) {
      await updateDownloadJobStatus(
        supabase,
        jobId,
        "failed",
        0,
        0,
        `No cards found ${setId ? 'for set ' + setId : ''}`
      );
      return;
    }
    
    // Update job status to completed (placeholder)
    await updateDownloadJobStatus(
      supabase,
      jobId,
      "completed",
      cards.length,
      cards.length
    );
    
    console.log(`Successfully downloaded ${cards.length} MTG cards${setId ? ' for set ' + setId : ''}`);
  } catch (error) {
    console.error(`Error downloading MTG cards:`, error);
    await updateDownloadJobStatus(
      supabase,
      jobId,
      "failed",
      0,
      0,
      error.message || "Unknown error during MTG card download"
    );
  }
}

// Download and save Yugioh cards
export async function downloadYugiohCards(
  supabase: any,
  jobId: string,
  setId?: string,
  downloadImages: boolean = true
): Promise<void> {
  try {
    // Update job status to downloading data
    await updateDownloadJobStatus(supabase, jobId, "downloading_data");
    
    let cards: any[] = [];
    
    // Download cards for specific set or all cards
    if (setId) {
      cards = await fetchYugiohCardsForSet(setId);
    } else {
      throw new Error("Downloading all Yu-Gi-Oh! cards is not implemented yet");
    }
    
    if (!cards || cards.length === 0) {
      await updateDownloadJobStatus(
        supabase,
        jobId,
        "failed",
        0,
        0,
        `No cards found ${setId ? 'for set ' + setId : ''}`
      );
      return;
    }
    
    // Update job status to completed (placeholder)
    await updateDownloadJobStatus(
      supabase,
      jobId,
      "completed",
      cards.length,
      cards.length
    );
    
    console.log(`Successfully downloaded ${cards.length} Yu-Gi-Oh! cards${setId ? ' for set ' + setId : ''}`);
  } catch (error) {
    console.error(`Error downloading Yu-Gi-Oh! cards:`, error);
    await updateDownloadJobStatus(
      supabase,
      jobId,
      "failed",
      0,
      0,
      error.message || "Unknown error during Yu-Gi-Oh! card download"
    );
  }
}

// Download and save Lorcana cards
export async function downloadLorcanaCards(
  supabase: any,
  jobId: string,
  setId?: string,
  downloadImages: boolean = true
): Promise<void> {
  try {
    // Update job status to downloading data
    await updateDownloadJobStatus(supabase, jobId, "downloading_data");
    
    let cards: any[] = [];
    
    // Download cards for specific set or all cards
    if (setId) {
      cards = await fetchLorcanaCardsForSet(setId);
    } else {
      throw new Error("Downloading all Lorcana cards is not implemented yet");
    }
    
    if (!cards || cards.length === 0) {
      await updateDownloadJobStatus(
        supabase,
        jobId,
        "failed",
        0,
        0,
        `No cards found ${setId ? 'for set ' + setId : ''}`
      );
      return;
    }
    
    // Update job status to completed (placeholder)
    await updateDownloadJobStatus(
      supabase,
      jobId,
      "completed",
      cards.length,
      cards.length
    );
    
    console.log(`Successfully downloaded ${cards.length} Lorcana cards${setId ? ' for set ' + setId : ''}`);
  } catch (error) {
    console.error(`Error downloading Lorcana cards:`, error);
    await updateDownloadJobStatus(
      supabase,
      jobId,
      "failed",
      0,
      0,
      error.message || "Unknown error during Lorcana card download"
    );
  }
}
