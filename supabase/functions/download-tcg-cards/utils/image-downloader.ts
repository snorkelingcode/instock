
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
