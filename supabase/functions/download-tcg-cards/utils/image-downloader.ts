
/**
 * Utility functions for downloading and saving card images
 */

/**
 * Get the file extension from a URL
 */
export function getImageExtension(url: string): string {
  // Extract file extension from URL
  const urlParts = url.split('.');
  if (urlParts.length > 1) {
    const extension = urlParts[urlParts.length - 1].split('?')[0].toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return extension;
    }
  }
  // Default to jpg if no valid extension found
  return 'jpg';
}

/**
 * Download and save card images to Supabase storage
 */
export async function saveCardImages(
  supabase: any,
  gameType: string,
  cardId: string,
  imageUrls: string[],
  setId?: string
): Promise<string[]> {
  if (!imageUrls || imageUrls.length === 0) {
    console.log(`No image URLs provided for card ${cardId}`);
    return [];
  }

  const savedImagePaths: string[] = [];
  
  try {
    // Ensure the tcg-images bucket exists
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketError) {
      console.error("Error checking buckets:", bucketError);
      throw bucketError;
    }
    
    const bucketExists = buckets.some((bucket: any) => bucket.name === 'tcg-images');
    
    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      const { error: createError } = await supabase
        .storage
        .createBucket('tcg-images', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        });
        
      if (createError) {
        console.error("Error creating tcg-images bucket:", createError);
        throw createError;
      }
      
      console.log("Created tcg-images bucket successfully");
    }
    
    // Save each image
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      if (!imageUrl) continue;
      
      try {
        console.log(`Downloading image: ${imageUrl}`);
        
        // Fetch the image
        const imageResponse = await fetch(imageUrl);
        
        if (!imageResponse.ok) {
          console.error(`Failed to fetch image: ${imageUrl}`, imageResponse.status, imageResponse.statusText);
          continue;
        }
        
        // Get image data as arraybuffer
        const imageData = await imageResponse.arrayBuffer();
        
        // Get file extension
        const extension = getImageExtension(imageUrl);
        
        // Create storage path
        const folderPath = setId 
          ? `${gameType}/${setId}`
          : gameType;
          
        const filename = `${cardId}_${i}.${extension}`;
        const storagePath = `${folderPath}/${filename}`;
        
        // Upload to Supabase
        const { error: uploadError } = await supabase
          .storage
          .from('tcg-images')
          .upload(storagePath, imageData, {
            contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
            upsert: true,
          });
          
        if (uploadError) {
          console.error(`Error uploading image ${imageUrl}:`, uploadError);
          continue;
        }
        
        // Get public URL
        const { data: publicUrlData } = await supabase
          .storage
          .from('tcg-images')
          .getPublicUrl(storagePath);
          
        const publicUrl = publicUrlData?.publicUrl;
        
        if (publicUrl) {
          savedImagePaths.push(publicUrl);
          console.log(`Successfully saved image to ${storagePath}`);
        }
      } catch (imageError) {
        console.error(`Error processing image ${imageUrl}:`, imageError);
      }
    }
    
    return savedImagePaths;
  } catch (error) {
    console.error(`Error saving images for card ${cardId}:`, error);
    return [];
  }
}
