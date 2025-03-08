
// Job Status Management Module

export interface JobStatus {
  job_id: string;
  source: string;
  status: 'pending' | 'fetching_data' | 'processing_data' | 'saving_to_database' | 'completed' | 'failed';
  progress: number;
  total_items: number;
  completed_items: number;
  error: string | null;
}

// Update job status
export async function updateJobStatus(
  supabase: any, 
  jobId: string, 
  status: JobStatus['status'], 
  progress: number = 0, 
  totalItems: number = 0, 
  completedItems: number = 0,
  error: string | null = null
) {
  const updateData: any = {
    status,
    progress,
    total_items: totalItems,
    completed_items: completedItems,
    updated_at: new Date().toISOString(),
  };
  
  if (error) {
    updateData.error = error;
  }
  
  // Add completed_at timestamp if job is completed or failed
  if (status === 'completed' || status === 'failed') {
    updateData.completed_at = new Date().toISOString();
  }
  
  try {
    const { error: updateError } = await supabase
      .from('api_job_status')
      .update(updateData)
      .eq('job_id', jobId);
      
    if (updateError) {
      console.error(`Error updating job status for ${jobId}:`, updateError);
      throw updateError;
    }
    
    console.log(`Updated job ${jobId} status to ${status} with progress ${progress}%`);
  } catch (error) {
    console.error(`Failed to update job status for ${jobId}:`, error);
  }
}
