
// @ts-ignore
import { createClient } from "@supabase/supabase-js";
import { processTCGData } from "../processor.ts";
import { JobStatus } from "../database/job-status.ts";

// CORS headers for all responses
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export interface FetchTCGRequest {
  source: "pokemon" | "mtg" | "yugioh" | "lorcana";
  jobId?: string;
  accessKey?: string;
}

export async function handleTCGRequest(req: Request, supabase: any) {
  try {
    // Parse request body
    const requestData: FetchTCGRequest = await req.json();
    console.log("Request received for source:", requestData.source);

    // Get environment variables
    const authKey = Deno.env.get("TCG_SYNC_ACCESS_KEY") as string;
    const pokemonApiKey = Deno.env.get("POKEMON_TCG_API_KEY") as string;
    const mtgApiKey = Deno.env.get("MTG_API_KEY") as string;

    // Simple authorization check
    if (requestData.accessKey !== authKey && !requestData.jobId) {
      return createErrorResponse("Unauthorized. Authentication required.", 401);
    }

    // If jobId is provided, return the status of that job
    if (requestData.jobId) {
      return await getJobStatus(requestData.jobId, supabase);
    }

    // Check for existing jobs
    const existingJobResponse = await checkExistingJobs(requestData.source, supabase);
    if (existingJobResponse) {
      return existingJobResponse;
    }

    // Check rate limiting
    const rateLimitResponse = await checkRateLimit(requestData.source, supabase);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Create a new job and start processing
    return await createAndStartJob(requestData.source, supabase, {
      pokemon: pokemonApiKey,
      mtg: mtgApiKey
    });
  } catch (error) {
    console.error("Error processing request:", error);
    
    return createErrorResponse(`Failed to process request: ${error.message}`, 500);
  }
}

async function getJobStatus(jobId: string, supabase: any) {
  console.log("Fetching status for job:", jobId);
  const { data: jobData, error: jobError } = await supabase
    .from('api_job_status')
    .select('*')
    .eq('job_id', jobId)
    .single();

  if (jobError) {
    console.error("Error fetching job status:", jobError);
    return createErrorResponse(`Failed to fetch job status: ${jobError.message}`, 500);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      job: jobData
    }),
    { 
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}

async function checkExistingJobs(source: string, supabase: any) {
  const { data: existingJobs, error: jobsError } = await supabase
    .from('api_job_status')
    .select('*')
    .eq('source', source)
    .not('status', 'in', '("completed","failed")')
    .order('created_at', { ascending: false });

  if (jobsError) {
    console.error("Error checking existing jobs:", jobsError);
    return null;
  } 
  
  if (existingJobs && existingJobs.length > 0) {
    console.log(`Already have a running job for ${source}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `A synchronization job for ${source} is already in progress.`,
        jobId: existingJobs[0].job_id
      }),
      { 
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
  
  return null;
}

async function checkRateLimit(source: string, supabase: any) {
  const RATE_LIMIT_SECONDS = 60; // 1 minute
  
  const { data: apiConfig, error: configError } = await supabase
    .from('api_config')
    .select('last_sync_time')
    .eq('api_name', source)
    .single();

  if (!configError && apiConfig && apiConfig.last_sync_time) {
    const lastSyncTime = new Date(apiConfig.last_sync_time).getTime();
    const currentTime = Date.now();
    const elapsedSeconds = (currentTime - lastSyncTime) / 1000;
    
    if (elapsedSeconds < RATE_LIMIT_SECONDS) {
      const retryAfter = Math.ceil(RATE_LIMIT_SECONDS - elapsedSeconds);
      console.log(`Rate limited. Try again in ${retryAfter} seconds.`);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Rate limited. Please try again later.`,
          retryAfter 
        }),
        { 
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
            "Retry-After": retryAfter.toString()
          },
        }
      );
    }
  }
  
  return null;
}

async function createAndStartJob(source: string, supabase: any, apiKeys: any) {
  // Create a job ID for tracking
  const jobId = crypto.randomUUID();
  
  // Create a new job status record
  const newJob: JobStatus = {
    job_id: jobId,
    source: source,
    status: 'pending',
    progress: 0,
    total_items: 0,
    completed_items: 0,
    error: null
  };
  
  const { error: insertError } = await supabase
    .from('api_job_status')
    .insert(newJob);
    
  if (insertError) {
    console.error("Error creating job status:", insertError);
    return createErrorResponse(`Failed to create job status: ${insertError.message}`, 500);
  }
  
  // Start background processing with API keys
  processTCGData(supabase, source, jobId, apiKeys);
  
  // Return success with the job ID
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Synchronization of ${source} data has started.`,
      jobId: jobId
    }),
    { 
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}

export function createErrorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: message 
    }),
    { 
      status: status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}
