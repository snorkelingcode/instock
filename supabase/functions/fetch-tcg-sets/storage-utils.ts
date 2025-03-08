
// Function to check if a storage bucket exists and create it if not
export async function ensureStorageBucket(bucketName, supabase) {
  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error(`Error checking storage buckets:`, bucketsError);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Creating storage bucket: ${bucketName}`);
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
      });
      
      if (error) {
        console.error(`Error creating storage bucket ${bucketName}:`, error);
        return false;
      }
      
      console.log(`Successfully created bucket: ${bucketName}`);
    } else {
      console.log(`Bucket ${bucketName} already exists`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error ensuring storage bucket ${bucketName}:`, error);
    return false;
  }
}

// Function to download and upload an image to Supabase storage
export async function storeImageInSupabase(imageUrl, category, filename, supabase) {
  if (!imageUrl) return null;
  
  try {
    console.log(`Downloading image from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      console.error(`Failed to download image: ${imageUrl}, status: ${imageResponse.status}`);
      return imageUrl; // Fallback to original URL on error
    }
    
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = new Uint8Array(imageArrayBuffer);
    
    // Ensure the tcg-images bucket exists
    const bucketExists = await ensureStorageBucket('tcg-images', supabase);
    if (!bucketExists) {
      console.error('Failed to ensure the tcg-images bucket exists');
      return imageUrl; // Fallback to original URL
    }
    
    // Create a unique path in the storage bucket
    const storagePath = `${category}/${filename}`;
    console.log(`Uploading image to path: ${storagePath}`);
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('tcg-images')
      .upload(storagePath, imageBuffer, {
        contentType: imageResponse.headers.get('content-type') || 'image/jpeg',
        upsert: true
      });
    
    if (uploadError) {
      console.error(`Error uploading image to Supabase:`, uploadError);
      return imageUrl; // Fallback to original URL on error
    }
    
    // Get the public URL for the uploaded image
    const { data: { publicUrl } } = supabase
      .storage
      .from('tcg-images')
      .getPublicUrl(storagePath);
    
    console.log(`Image uploaded successfully to: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`Error storing image:`, error);
    return imageUrl; // Fallback to original URL on error
  }
}
