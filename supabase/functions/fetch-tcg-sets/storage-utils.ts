
// Check if Supabase buckets exist and create if needed
async function ensureBucketExists(bucketName, supabase) {
  try {
    console.log(`Checking if bucket ${bucketName} exists`);
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`Error listing buckets:`, listError);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Creating bucket ${bucketName}`);
      
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true, // Set bucket to public
        fileSizeLimit: 5242880 // 5MB limit
      });
      
      if (createError) {
        console.error(`Error creating bucket ${bucketName}:`, createError);
        return false;
      }
      
      console.log(`Bucket ${bucketName} created successfully`);
    } else {
      console.log(`Bucket ${bucketName} already exists`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error ensuring bucket ${bucketName} exists:`, error);
    return false;
  }
}

// Extract bucket and path from full path
function extractBucketAndPath(fullPath) {
  const parts = fullPath.split('/');
  const bucket = parts[0];
  const path = parts.slice(1).join('/');
  return { bucket, path };
}

// Store an image from URL in Supabase Storage
export async function storeImageInSupabase(imageUrl, bucketPath, fileName, supabase) {
  try {
    if (!imageUrl) {
      console.log(`Skipping empty image URL for ${fileName}`);
      return null;
    }
    
    console.log(`Storing image from ${imageUrl} to ${bucketPath}/${fileName}`);
    
    // Extract bucket name from the path
    const parts = bucketPath.split('/');
    const bucketName = parts[0];
    const folderPath = parts.slice(1).join('/');
    
    // Ensure bucket exists
    const bucketExists = await ensureBucketExists(bucketName, supabase);
    if (!bucketExists) {
      throw new Error(`Bucket ${bucketName} doesn't exist and couldn't be created`);
    }
    
    // Check if file already exists
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
    const { data: existingFile, error: checkError } = await supabase.storage
      .from(bucketName)
      .list(folderPath || '', {
        limit: 100,
        search: fileName
      });
      
    if (!checkError && existingFile && existingFile.some(file => file.name === fileName)) {
      console.log(`File ${filePath} already exists in bucket ${bucketName}`);
      
      // Return the public URL of the existing file
      const { data: publicUrl } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
        
      return publicUrl.publicUrl;
    }
    
    // Fetch the image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${imageUrl}: ${response.status} ${response.statusText}`);
    }
    
    // Get image as array buffer
    const arrayBuffer = await response.arrayBuffer();
    
    // Upload the image to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, arrayBuffer, {
        contentType: response.headers.get('content-type') || 'image/jpeg',
        upsert: true
      });
      
    if (error) {
      console.error(`Error uploading image to ${bucketPath}/${fileName}:`, error);
      throw error;
    }
    
    console.log(`Successfully uploaded image to ${bucketPath}/${fileName}`);
    
    // Get the public URL of the uploaded file
    const { data: publicUrl } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
      
    return publicUrl.publicUrl;
    
  } catch (error) {
    console.error(`Error storing image in Supabase:`, error);
    
    // Return the original URL as fallback
    console.log(`Falling back to original image URL: ${imageUrl}`);
    return imageUrl;
  }
}
