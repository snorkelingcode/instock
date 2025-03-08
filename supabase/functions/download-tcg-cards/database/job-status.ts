
// Job status database operations

export interface DownloadJobStatus {
  id: string;
  game: string;
  job_type: string;
  status: 'pending' | 'downloading_data' | 'processing_data' | 'downloading_images' | 'completed' | 'failed';
  total_items: number;
  processed_items: number;
  error: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// Create a new download job
export async function createDownloadJob(
  supabase: any, 
  jobId: string, 
  game: string, 
  jobType: string
): Promise<void> {
  try {
    console.log(`Creating download job record: ${jobId} for ${game} - ${jobType}`);
    
    const { error } = await supabase
      .from('tcg_download_jobs')
      .insert({
        id: jobId,
        game,
        job_type: jobType,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error("Error creating download job:", error);
      throw error;
    }
    
    console.log(`Successfully created download job record: ${jobId}`);
  } catch (error) {
    console.error("Error in createDownloadJob:", error);
    throw error;
  }
}

// Update download job status
export async function updateDownloadJobStatus(
  supabase: any,
  jobId: string,
  status: string,
  totalItems: number = 0,
  processedItems: number = 0,
  error: string | null = null
): Promise<void> {
  try {
    console.log(`Updating job ${jobId} status to ${status}, processed: ${processedItems}/${totalItems}`);
    
    const updateData: any = {
      status,
      total_items: totalItems,
      processed_items: processedItems,
      updated_at: new Date().toISOString()
    };
    
    // Add error if present
    if (error) {
      updateData.error = error;
    }
    
    // If job is completed or failed, add completed_at timestamp
    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    const { error: updateError } = await supabase
      .from('tcg_download_jobs')
      .update(updateData)
      .eq('id', jobId);
    
    if (updateError) {
      console.error("Error updating download job:", updateError);
      throw updateError;
    }
  } catch (error) {
    console.error("Error in updateDownloadJobStatus:", error);
    throw error;
  }
}

// Get the status of a download job
export async function getDownloadJobStatus(
  jobId: string,
  supabase: any
): Promise<DownloadJobStatus | null> {
  try {
    console.log(`Fetching status for job: ${jobId}`);
    
    const { data, error } = await supabase
      .from('tcg_download_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error) {
      console.error("Error fetching job status:", error);
      throw error;
    }
    
    return data as DownloadJobStatus;
  } catch (error) {
    console.error("Error in getDownloadJobStatus:", error);
    throw error;
  }
}
