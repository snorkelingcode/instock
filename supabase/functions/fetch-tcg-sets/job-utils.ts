
import { JOB_STATUS_TABLE } from "./utils.ts";

// Function to process in the background
export async function processInBackground(fn, jobId, source, supabase) {
  try {
    console.log(`Processing ${source} job ${jobId} in background`);
    await updateJobStatus(jobId, 'processing', null, null, null, null, supabase);
    await fn(jobId);
    await updateJobStatus(jobId, 'completed', 100, null, null, null, supabase);
    console.log(`Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`Background processing error for job ${jobId}:`, error);
    await updateJobStatus(jobId, 'failed', null, null, null, error.message || "Unknown error", supabase);
  }
}

// Function to create the job status table if it doesn't exist
export async function createJobStatusTableIfNotExists(supabase) {
  try {
    // Check if table exists, create it if not
    const { error } = await supabase.rpc('create_job_status_table_if_not_exists').catch(e => {
      console.log("Job status table creation RPC error (may attempt SQL):", e);
      
      // Try direct SQL if RPC fails
      return supabase.from('_manual_sql').select('*').eq('statement', `
        CREATE TABLE IF NOT EXISTS public.${JOB_STATUS_TABLE} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id TEXT UNIQUE NOT NULL,
          source TEXT NOT NULL,
          status TEXT NOT NULL,
          progress NUMERIC DEFAULT 0,
          total_items NUMERIC DEFAULT 0,
          completed_items NUMERIC DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          completed_at TIMESTAMP WITH TIME ZONE,
          error TEXT
        );
      `);
    });
    
    if (error) {
      console.error("Error creating job status table:", error);
    }
  } catch (error) {
    console.error("Error in create job status table:", error);
  }
}

// Function to update job status
export async function updateJobStatus(jobId, status, progress = null, totalItems = null, completedItems = null, error = null, supabase) {
  try {
    const updateData = {
      status: status,
      updated_at: new Date().toISOString()
    };
    
    if (progress !== null) updateData.progress = progress;
    if (totalItems !== null) updateData.total_items = totalItems;
    if (completedItems !== null) updateData.completed_items = completedItems;
    if (error) updateData.error = error;
    
    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    console.log(`Updating job status for ${jobId}:`, JSON.stringify(updateData));
    
    const { error: updateError } = await supabase
      .from(JOB_STATUS_TABLE)
      .update(updateData)
      .eq('job_id', jobId);
      
    if (updateError) {
      console.error(`Error updating job status for ${jobId}:`, updateError);
    }
  } catch (error) {
    console.error(`Error in update job status for ${jobId}:`, error);
  }
}
