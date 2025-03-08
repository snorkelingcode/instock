
// Utility for downloading and saving card images to storage

export async function saveCardImages(
  supabase: any,
  source: string,
  cards: any[],
  jobId: string
) {
  console.log(`Starting image download for ${cards.length} ${source} cards`);
  
  let processedCount = 0;
  
  // Process in smaller batches to avoid overwhelming the system
  const batchSize = 5;
  
  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize);
    
    // Process each card in the batch concurrently
    await Promise.all(
      batch.map(async (card) => {
        try {
          await processCardImages(supabase, source, card);
        } catch (error) {
          console.error(`Error processing images for card ${card.card_id}:`, error);
        }
      })
    );
    
    processedCount += batch.length;
    
    // Update the download job status
    const { error } = await supabase
      .from('tcg_download_jobs')
      .update({
        processed_items: processedCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    if (error) {
      console.error("Error updating download job progress:", error);
    }
    
    console.log(`Processed ${processedCount}/${cards.length} card images`);
  }
  
  console.log(`Completed image download for ${cards.length} ${source} cards`);
}

// Process images for a single card
async function processCardImages(
  supabase: any,
  source: string,
  card: any
) {
  // Get image URLs based on the card type
  const imageUrls = getCardImageUrls(source, card);
  
  // Process each image URL
  for (const [imageType, imageUrl] of Object.entries(imageUrls)) {
    if (!imageUrl) continue;
    
    // Check if this image has already been downloaded
    const { data, error } = await supabase
      .from('tcg_image_downloads')
      .select('*')
      .eq('card_id', card.card_id)
      .eq('game', source)
      .eq('image_type', imageType)
      .maybeSingle();
    
    // Skip if already downloaded successfully
    if (data && data.status === 'success') {
      continue;
    }
    
    try {
      // Generate storage path
      const storagePath = `${source}/${imageType}/${card.set_id || 'unknown'}/${card.card_id}.${getImageExtension(imageUrl)}`;
      
      // Record the download attempt
      const downloadId = await recordImageDownload(
        supabase,
        card.card_id,
        source,
        imageType,
        storagePath,
        imageUrl
      );
      
      // Download the image
      const imageResponse = await fetch(imageUrl);
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Upload to storage
      const { error: uploadError } = await supabase
        .storage
        .from('tcg-images')
        .upload(storagePath, imageBuffer, {
          contentType: imageResponse.headers.get('content-type') || 'image/jpeg',
          upsert: true
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Update the download record as successful
      await updateImageDownloadStatus(supabase, downloadId, 'success');
      
    } catch (error) {
      console.error(`Error downloading image for ${card.card_id} (${imageType}):`, error);
      
      // Update the download record as failed
      if (downloadId) {
        await updateImageDownloadStatus(supabase, downloadId, 'failed', error.message);
      }
    }
  }
}

// Record an image download attempt
async function recordImageDownload(
  supabase: any,
  cardId: string,
  game: string,
  imageType: string,
  storagePath: string,
  originalUrl: string
) {
  try {
    const { data, error } = await supabase
      .from('tcg_image_downloads')
      .upsert({
        card_id: cardId,
        game,
        image_type: imageType,
        storage_path: storagePath,
        original_url: originalUrl,
        downloaded_at: new Date().toISOString(),
        status: 'processing'
      }, { onConflict: ['card_id', 'game', 'image_type'], returning: true })
      .select()
      .single();
    
    if (error) {
      console.error("Error recording image download:", error);
      throw error;
    }
    
    return data.id;
  } catch (error) {
    console.error("Error in recordImageDownload:", error);
    throw error;
  }
}

// Update the status of an image download
async function updateImageDownloadStatus(
  supabase: any,
  downloadId: number,
  status: string,
  error?: string
) {
  try {
    const updateData: any = {
      status,
      downloaded_at: new Date().toISOString()
    };
    
    if (error) {
      updateData.error = error;
    }
    
    const { error: updateError } = await supabase
      .from('tcg_image_downloads')
      .update(updateData)
      .eq('id', downloadId);
    
    if (updateError) {
      console.error("Error updating image download status:", updateError);
    }
  } catch (error) {
    console.error("Error in updateImageDownloadStatus:", error);
  }
}

// Get image extension from URL
function getImageExtension(url: string): string {
  // Default to jpg if we can't determine extension
  if (!url) return 'jpg';
  
  // Extract the file extension from the URL
  const matches = url.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  if (matches && matches[1]) {
    return matches[1].toLowerCase();
  }
  
  // For URLs without file extensions, try to guess based on common patterns
  if (url.includes('scryfall')) return 'jpg';
  if (url.includes('pokemontcg')) return 'png';
  if (url.includes('ygoprodeck')) return 'jpg';
  
  return 'jpg';
}

// Get card image URLs based on card type
function getCardImageUrls(source: string, card: any): Record<string, string> {
  switch (source) {
    case "pokemon":
      return {
        small: card.images?.small,
        large: card.images?.large
      };
    case "mtg":
      if (card.image_uris) {
        return {
          small: card.image_uris?.small,
          normal: card.image_uris?.normal,
          large: card.image_uris?.large,
          art_crop: card.image_uris?.art_crop
        };
      } else if (card.card_faces && card.card_faces[0].image_uris) {
        // For double-faced cards
        return {
          front_small: card.card_faces[0].image_uris?.small,
          front_normal: card.card_faces[0].image_uris?.normal,
          back_small: card.card_faces[1]?.image_uris?.small,
          back_normal: card.card_faces[1]?.image_uris?.normal
        };
      }
      return {};
    case "yugioh":
      if (card.card_images && card.card_images.length > 0) {
        return {
          image: card.card_images[0]?.image_url,
          image_small: card.card_images[0]?.image_url_small,
          image_cropped: card.card_images[0]?.image_url_cropped
        };
      }
      return {};
    case "lorcana":
      return {
        image: card.image_url
      };
    default:
      return {};
  }
}
