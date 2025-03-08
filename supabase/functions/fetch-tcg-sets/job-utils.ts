
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

// Add new function to handle chunked processing
export async function processWithChunking(chunkedFn, jobId, source, supabase, chunkSize = 30) {
  try {
    console.log(`Starting chunked processing for ${source} job ${jobId} with chunk size ${chunkSize}`);
    
    // First, get current job status to check if we're resuming
    const { data: jobData } = await supabase
      .from(JOB_STATUS_TABLE)
      .select('*')
      .eq('job_id', jobId)
      .single();
    
    if (!jobData) {
      throw new Error(`Job ${jobId} not found`);
    }
    
    // If job is already completed or failed, don't process again
    if (jobData.status === 'completed' || jobData.status === 'failed') {
      console.log(`Job ${jobId} is already in status ${jobData.status}, skipping processing`);
      return;
    }
    
    // Get current progress
    const completedItems = jobData.completed_items || 0;
    const totalItems = jobData.total_items || 0;
    
    console.log(`Job ${jobId} status: ${jobData.status}, progress: ${completedItems}/${totalItems} items (${jobData.progress || 0}%)`);
    
    // Update status to processing if it's not already
    if (jobData.status !== 'processing_data') {
      await updateJobStatus(jobId, 'processing_data', null, null, null, null, supabase);
    }
    
    // Process in chunks
    await chunkedFn(jobId, completedItems, totalItems, supabase);
    
    // Mark as completed if we got here without errors
    await updateJobStatus(jobId, 'completed', 100, null, null, null, supabase);
    console.log(`Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`Chunked processing error for job ${jobId}:`, error);
    
    // Check if this is a timeout error or a regular error
    if (error.message && (
      error.message.includes('timeout') || 
      error.message.includes('execution time limit') ||
      error.message.includes('function shutdown')
    )) {
      console.log(`Job ${jobId} timed out, but can be resumed on next request`);
      // We don't mark as failed for timeouts, as it can be resumed
    } else {
      // For other errors, mark as failed
      await updateJobStatus(jobId, 'failed', null, null, null, error.message || "Unknown error", supabase);
    }
  }
}

// Register shutdown handler to log when the function is terminated
try {
  // This is wrapped in try/catch because it's only available in Deno edge runtime
  addEventListener('beforeunload', (ev) => {
    console.log('Function shutdown triggered due to:', ev.detail?.reason || 'unknown reason');
  });
} catch (e) {
  console.log('Could not register shutdown handler, not running in edge runtime');
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
          error TEXT,
          current_chunk INT DEFAULT 0,
          chunk_size INT DEFAULT 10
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

// Add function to update job progress
export async function updateJobProgress(jobId, completedItems, totalItems, supabase) {
  try {
    if (!completedItems && completedItems !== 0 || !totalItems) {
      console.log(`Skipping progress update due to invalid values: completed=${completedItems}, total=${totalItems}`);
      return;
    }
    
    const progress = Math.floor((completedItems / totalItems) * 100);
    
    const updateData = {
      progress,
      completed_items: completedItems,
      total_items: totalItems,
      updated_at: new Date().toISOString()
    };
    
    console.log(`Updating job progress for ${jobId}: ${completedItems}/${totalItems} (${progress}%)`);
    
    const { error } = await supabase
      .from(JOB_STATUS_TABLE)
      .update(updateData)
      .eq('job_id', jobId);
      
    if (error) {
      console.error(`Error updating job progress for ${jobId}:`, error);
    }
  } catch (error) {
    console.error(`Error in update job progress for ${jobId}:`, error);
  }
}

// Add function to check if a job is still running
export async function isJobStillRunning(jobId, supabase) {
  try {
    const { data, error } = await supabase
      .from(JOB_STATUS_TABLE)
      .select('status')
      .eq('job_id', jobId)
      .single();
      
    if (error) {
      console.error(`Error checking job status for ${jobId}:`, error);
      return false;
    }
    
    return data && (data.status === 'processing_data' || data.status === 'fetching_data' || data.status === 'pending');
  } catch (error) {
    console.error(`Error in isJobStillRunning for ${jobId}:`, error);
    return false;
  }
}
