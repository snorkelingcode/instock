
// Job Status Management Module

export interface JobStatus {
  id?: string;
  job_id: string;
  source: string;
  status: 'pending' | 'fetching_data' | 'processing_data' | 'saving_to_database' | 'completed' | 'failed';
  progress: number;
  total_items: number;
  completed_items: number;
  error: string | null;
}

// Update job status helper
export async function updateJobStatus(
  supabase: any,
  jobId: string, 
  status: JobStatus['status'], 
  progress: number,
  totalItems: number = 0,
  completedItems: number = 0,
  error: string | null = null
) {
  const updateData: any = { 
    status, 
    progress,
    updated_at: new Date().toISOString()
  };
  
  if (totalItems > 0) {
    updateData.total_items = totalItems;
  }
  
  if (completedItems > 0) {
    updateData.completed_items = completedItems;
  }
  
  if (error) {
    updateData.error = error;
  }
  
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }
  
  const { error: updateError } = await supabase
    .from('api_job_status')
    .update(updateData)
    .eq('job_id', jobId);
    
  if (updateError) {
    console.error(`Error updating job status for ${jobId}:`, updateError);
  }
}
