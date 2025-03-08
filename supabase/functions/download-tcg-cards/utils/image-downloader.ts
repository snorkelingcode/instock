
// Image Downloader Utility Module

// Download an image from URL and save to storage
export async function downloadImage(
  url: string,
  storagePath: string,
  supabase: any
): Promise<void> {
  try {
    console.log(`Downloading image from ${url} to ${storagePath}`);
    
    // Fetch the image
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    // Get the image as an arrayBuffer
    const imageBuffer = await response.arrayBuffer();
    
    // Check if the tcg-images bucket exists, if not create it
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'tcg-images');
    
    if (!bucketExists) {
      console.log("Creating tcg-images bucket");
      const { error: createError } = await supabase.storage.createBucket('tcg-images', {
        public: true
      });
      
      if (createError) {
        console.error("Error creating bucket:", createError);
        throw createError;
      }
    }
    
    // Upload the image to storage
    const { error } = await supabase
      .storage
      .from('tcg-images')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
      
    if (error) {
      console.error(`Error uploading image to ${storagePath}:`, error);
      throw error;
    }
    
    console.log(`Successfully saved image to ${storagePath}`);
  } catch (error) {
    console.error(`Error in downloadImage for ${url}:`, error);
    throw error;
  }
}

// Get image file extension from URL
export function getImageExtension(url: string): string {
  try {
    // Extract the file extension from the URL
    const extension = url.split('.').pop()?.toLowerCase();
    
    // Check if it's a valid image extension
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return extension;
    }
    
    // Default to jpg if extension can't be determined
    return 'jpg';
  } catch (error) {
    console.error(`Error getting image extension from ${url}:`, error);
    return 'jpg';
  }
}

// Process and save card images from API responses
export async function saveCardImages(
  supabase: any,
  game: string,
  cards: any[],
  jobId: string
): Promise<void> {
  try {
    console.log(`Starting to save ${cards.length} ${game} card images`);
    
    // Define image field mapping for different games
    const imageMapping = {
      pokemon: (card: any) => card.images?.small && card.images?.large ? [
        { url: card.images.small, type: 'small' },
        { url: card.images.large, type: 'large' }
      ] : [],
      mtg: (card: any) => card.image_uris?.normal ? [
        { url: card.image_uris.normal, type: 'normal' }
      ] : [],
      yugioh: (card: any) => card.card_images && card.card_images[0]?.image_url ? [
        { url: card.card_images[0].image_url, type: 'normal' }
      ] : [],
      lorcana: (card: any) => card.image_url ? [
        { url: card.image_url, type: 'normal' }
      ] : []
    };
    
    // Process cards in batches
    const batchSize = 10;
    let processedCount = 0;
    
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize);
      
      // Process each card in the batch
      for (const card of batch) {
        try {
          const cardId = card.id || card.card_id;
          if (!cardId) {
            console.warn(`Card without ID found, skipping`);
            continue;
          }
          
          // Get image URLs for this card based on game type
          const imagesToDownload = imageMapping[game as keyof typeof imageMapping]?.(card) || [];
          
          for (const image of imagesToDownload) {
            try {
              // Check if we already have this image
              const { data: existingImage } = await supabase
                .from('tcg_image_downloads')
                .select('*')
                .eq('card_id', cardId)
                .eq('game', game)
                .eq('image_type', image.type)
                .single();
                
              if (!existingImage && image.url) {
                // Define storage path
                const storagePath = `${game}/${image.type}/${cardId}.${getImageExtension(image.url)}`;
                
                // Download the image
                await downloadImage(image.url, storagePath, supabase);
                
                // Record the download
                await supabase
                  .from('tcg_image_downloads')
                  .upsert({
                    card_id: cardId,
                    game,
                    image_type: image.type,
                    storage_path: storagePath,
                    original_url: image.url,
                    status: 'completed'
                  }, {
                    onConflict: 'card_id,game,image_type'
                  });
              }
            } catch (imageError) {
              console.error(`Error downloading image for card ${cardId}:`, imageError);
              // Continue with next image
            }
          }
        } catch (cardError) {
          console.error(`Error processing card:`, cardError);
          // Continue with next card
        }
      }
      
      processedCount += batch.length;
      
      // Update job progress
      try {
        const progressPercent = Math.round((processedCount / cards.length) * 100);
        await supabase
          .from('tcg_download_jobs')
          .update({
            status: 'downloading_images',
            total_items: cards.length,
            processed_items: processedCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
          
        console.log(`Updated job ${jobId} progress: ${processedCount}/${cards.length} (${progressPercent}%)`);
      } catch (updateError) {
        console.error(`Error updating job status:`, updateError);
      }
    }
    
    console.log(`Completed saving ${processedCount} ${game} card images`);
  } catch (error) {
    console.error(`Error in saveCardImages:`, error);
    throw error;
  }
}
