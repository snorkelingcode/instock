
// Image downloader utility

// Function to download an image from a URL and upload it to Supabase Storage
export async function downloadImage(
  imageUrl: string,
  storagePath: string,
  supabase: any
): Promise<void> {
  try {
    console.log(`Downloading image from ${imageUrl} to ${storagePath}`);
    
    // Fetch the image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    // Get the image as binary data
    const imageBlob = await response.arrayBuffer();
    
    // Upload to Supabase Storage
    const { error } = await supabase
      .storage
      .from('tcg-images')
      .upload(storagePath, imageBlob, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      throw error;
    }
    
    console.log(`Successfully downloaded and stored image at ${storagePath}`);
  } catch (error) {
    console.error(`Error downloading image ${imageUrl}:`, error);
    throw error;
  }
}

// Get file extension from URL
export function getImageExtension(url: string): string {
  try {
    // Extract the filename from the URL
    const filename = url.split('/').pop() || '';
    // Get the extension
    const ext = filename.split('.').pop()?.toLowerCase();
    
    // Return appropriate extension or default to jpg
    if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return ext;
    }
    return 'jpg'; // Default to jpg
  } catch (error) {
    console.error('Error getting image extension:', error);
    return 'jpg'; // Default to jpg if there's an error
  }
}

// Process and save card images for a set of cards
export async function saveCardImages(
  supabase: any,
  source: string,
  cards: any[],
  jobId: string
): Promise<void> {
  console.log(`Starting to download images for ${cards.length} ${source} cards`);
  let processedCount = 0;
  
  try {
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      processedCount++;
      
      // Log progress every 10 cards
      if (processedCount % 10 === 0 || processedCount === cards.length) {
        console.log(`Processed ${processedCount}/${cards.length} card images`);
        
        // Update job status
        await supabase
          .from('tcg_download_jobs')
          .update({
            processed_items: processedCount,
            status: 'downloading_images',
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      }
      
      try {
        await processCardImages(supabase, source, card, jobId);
      } catch (error) {
        console.error(`Error processing images for card ${card.id || card.card_id}:`, error);
        // Continue with the next card even if this one fails
      }
    }
    
    console.log(`Successfully downloaded images for ${processedCount} cards`);
  } catch (error) {
    console.error('Error in saveCardImages:', error);
    throw error;
  }
}

// Process images for a single card
async function processCardImages(
  supabase: any,
  source: string,
  card: any,
  jobId: string
): Promise<void> {
  const cardId = card.id || card.card_id;
  
  if (!cardId) {
    console.error('Card ID not found, skipping image download');
    return;
  }
  
  try {
    let imageUrl: string | null = null;
    let largeImageUrl: string | null = null;
    
    // Extract image URLs based on the card source
    switch (source) {
      case 'pokemon':
        if (card.images) {
          const images = typeof card.images === 'string' 
            ? JSON.parse(card.images) 
            : card.images;
          
          imageUrl = images.small;
          largeImageUrl = images.large;
        }
        break;
        
      case 'mtg':
        if (card.image_uris) {
          const imageUris = typeof card.image_uris === 'string'
            ? JSON.parse(card.image_uris)
            : card.image_uris;
          
          imageUrl = imageUris.normal;
          largeImageUrl = imageUris.large || imageUris.png;
        }
        break;
        
      case 'yugioh':
        if (card.card_images && Array.isArray(card.card_images)) {
          const images = typeof card.card_images === 'string'
            ? JSON.parse(card.card_images)
            : card.card_images;
          
          if (images[0]) {
            imageUrl = images[0].image_url;
            largeImageUrl = images[0].image_url_cropped;
          }
        }
        break;
        
      case 'lorcana':
        imageUrl = card.image_url;
        largeImageUrl = card.image_url;
        break;
        
      default:
        console.error(`Unknown source: ${source}`);
        return;
    }
    
    // Download small image if available
    if (imageUrl) {
      const smallImagePath = `${source}/small/${cardId}.${getImageExtension(imageUrl)}`;
      
      // Check if the image already exists in database
      const { data: existingSmallImage } = await supabase
        .from('tcg_image_downloads')
        .select('id')
        .eq('card_id', cardId)
        .eq('game', source)
        .eq('image_type', 'small')
        .maybeSingle();
      
      if (!existingSmallImage) {
        try {
          // Download and save the image
          await downloadImage(imageUrl, smallImagePath, supabase);
          
          // Record the download in the database
          await supabase
            .from('tcg_image_downloads')
            .insert({
              card_id: cardId,
              game: source,
              image_type: 'small',
              storage_path: smallImagePath,
              original_url: imageUrl,
              status: 'completed'
            });
            
          console.log(`Small image for ${cardId} downloaded successfully`);
        } catch (error) {
          console.error(`Error downloading small image for ${cardId}:`, error);
        }
      }
    }
    
    // Download large image if available
    if (largeImageUrl) {
      const largeImagePath = `${source}/large/${cardId}.${getImageExtension(largeImageUrl)}`;
      
      // Check if the image already exists in database
      const { data: existingLargeImage } = await supabase
        .from('tcg_image_downloads')
        .select('id')
        .eq('card_id', cardId)
        .eq('game', source)
        .eq('image_type', 'large')
        .maybeSingle();
      
      if (!existingLargeImage) {
        try {
          // Download and save the image
          await downloadImage(largeImageUrl, largeImagePath, supabase);
          
          // Record the download in the database
          await supabase
            .from('tcg_image_downloads')
            .insert({
              card_id: cardId,
              game: source,
              image_type: 'large',
              storage_path: largeImagePath,
              original_url: largeImageUrl,
              status: 'completed'
            });
            
          console.log(`Large image for ${cardId} downloaded successfully`);
        } catch (error) {
          console.error(`Error downloading large image for ${cardId}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Error in processCardImages for ${cardId}:`, error);
  }
}
