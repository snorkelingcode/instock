
// Function to download an image and save it to Supabase Storage
export async function downloadImage(
  url: string,
  game: string,
  cardId: string,
  imageType: string,
  supabase: any
): Promise<string | null> {
  try {
    console.log(`Downloading image from ${url}`);
    
    // Get the image extension
    const extension = getImageExtension(url);
    if (!extension) {
      console.error(`Could not determine image extension for ${url}`);
      return null;
    }
    
    // Define the storage path
    const storagePath = `${game}/${cardId}/${imageType}.${extension}`;
    
    // Download the image
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to download image: ${response.status} ${response.statusText}`);
      return null;
    }
    
    // Convert the image to a buffer/blob
    const imageBuffer = await response.arrayBuffer();
    
    // Check if the storage bucket exists
    const { data: buckets } = await supabase
      .storage
      .listBuckets();
    
    const bucketName = 'tcg-images';
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    // Create the bucket if it doesn't exist
    if (!bucketExists) {
      const { error: createBucketError } = await supabase
        .storage
        .createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        });
      
      if (createBucketError) {
        console.error(`Error creating bucket: ${createBucketError.message}`);
        return null;
      }
    }
    
    // Upload the image to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .upload(storagePath, imageBuffer, {
        contentType: `image/${extension}`,
        upsert: true,
      });
    
    if (error) {
      console.error(`Error uploading image: ${error.message}`);
      return null;
    }
    
    console.log(`Successfully uploaded image to ${storagePath}`);
    
    // Return the public URL
    const { data: publicURL } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(storagePath);
    
    // Save the image download record
    await saveImageDownloadRecord(
      supabase,
      cardId,
      game,
      imageType,
      storagePath,
      url,
      'completed'
    );
    
    return publicURL?.publicUrl || null;
  } catch (error) {
    console.error(`Error downloading image: ${error.message}`);
    
    // Save the failed image download record
    await saveImageDownloadRecord(
      supabase,
      cardId,
      game,
      imageType,
      '',
      url,
      'failed'
    );
    
    return null;
  }
}

// Function to save the image download record to the database
async function saveImageDownloadRecord(
  supabase: any,
  cardId: string,
  game: string,
  imageType: string,
  storagePath: string,
  originalUrl: string,
  status: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('tcg_image_downloads')
      .upsert({
        card_id: cardId,
        game,
        image_type: imageType,
        storage_path: storagePath,
        original_url: originalUrl,
        status,
        downloaded_at: new Date().toISOString(),
      }, {
        onConflict: 'card_id, game, image_type',
      });
    
    if (error) {
      console.error(`Error saving image download record: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error saving image download record: ${error.message}`);
  }
}

// Function to get the image extension from a URL
function getImageExtension(url: string): string | null {
  try {
    // Extract the file extension from the URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extension = pathname.split('.').pop()?.toLowerCase();
    
    // Check if it's a valid image extension
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    if (extension && validExtensions.includes(extension)) {
      return extension === 'jpg' ? 'jpeg' : extension;
    }
    
    // If no valid extension found, try to infer from content-type
    return 'png'; // Default to png if can't determine
  } catch (error) {
    console.error(`Error getting image extension: ${error.message}`);
    return null;
  }
}

// Function to save card images for a batch of cards
export async function saveCardImages(
  cards: any[],
  game: string,
  supabase: any,
  jobId: string,
  updateJobStatus: (supabase: any, jobId: string, status: string, processedItems: number, totalItems: number, error?: string) => Promise<void>
): Promise<void> {
  const totalCards = cards.length;
  
  try {
    await updateJobStatus(supabase, jobId, 'downloading_images', 0, totalCards);
    
    for (let i = 0; i < totalCards; i++) {
      const card = cards[i];
      const cardId = card.id || card.card_id;
      
      if (!cardId) {
        console.error(`Card missing ID: ${JSON.stringify(card)}`);
        continue;
      }
      
      try {
        // Handle different image structures based on the TCG
        if (game === 'pokemon') {
          if (card.images?.small) {
            await downloadImage(card.images.small, game, cardId, 'small', supabase);
          }
          if (card.images?.large) {
            await downloadImage(card.images.large, game, cardId, 'large', supabase);
          }
        } else if (game === 'mtg') {
          if (card.image_uris?.small) {
            await downloadImage(card.image_uris.small, game, cardId, 'small', supabase);
          }
          if (card.image_uris?.normal) {
            await downloadImage(card.image_uris.normal, game, cardId, 'normal', supabase);
          }
          if (card.image_uris?.large) {
            await downloadImage(card.image_uris.large, game, cardId, 'large', supabase);
          }
        } else if (game === 'yugioh') {
          if (card.card_images && card.card_images.length > 0) {
            await downloadImage(card.card_images[0].image_url, game, cardId, 'image', supabase);
            await downloadImage(card.card_images[0].image_url_small, game, cardId, 'small', supabase);
          }
        } else if (game === 'lorcana') {
          if (card.image_url) {
            await downloadImage(card.image_url, game, cardId, 'image', supabase);
          }
        }
      } catch (error) {
        console.error(`Error processing card ${cardId}: ${error.message}`);
      }
      
      // Update job status every 10 cards or at the end
      if ((i + 1) % 10 === 0 || i === totalCards - 1) {
        await updateJobStatus(supabase, jobId, 'downloading_images', i + 1, totalCards);
      }
    }
  } catch (error) {
    console.error(`Error saving card images: ${error.message}`);
    await updateJobStatus(supabase, jobId, 'failed', 0, totalCards, `Error saving card images: ${error.message}`);
    throw error;
  }
}
