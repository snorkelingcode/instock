
// Define CORS headers
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Table names and constants
export const RATE_LIMIT_SECONDS = 60; // 1 minute between syncs
export const RATE_LIMIT_TABLE = "api_rate_limits";
export const JOB_STATUS_TABLE = "api_job_status";

// Main request handler
export async function handleRequest(req, supabase) {
  console.log("Parsing request body");
  const requestData = await req.json();
  console.log("Request data:", requestData);
  
  const { source, jobId } = requestData;
  const responseHeaders = { ...corsHeaders, "Content-Type": "application/json" };
  
  // If jobId is provided, this is a job status check
  if (jobId) {
    return await checkJobStatus(jobId, supabase, responseHeaders);
  }
  
  if (!source) {
    console.log("Missing source parameter");
    return new Response(
      JSON.stringify({ error: "Missing source parameter" }),
      {
        status: 400,
        headers: responseHeaders,
      }
    );
  }

  // Check if there's an existing job in progress
  const existingJob = await checkForExistingJob(source, supabase);
  
  // If there's an existing job in progress, we should resume it instead of creating a new one
  if (existingJob) {
    console.log(`Found existing job ${existingJob.job_id} for ${source} in status ${existingJob.status}`);
    
    // If the job is in a resumable state, resume it
    if (existingJob.status === 'processing_data' || existingJob.status === 'fetching_data') {
      console.log(`Resuming existing job ${existingJob.job_id} from ${existingJob.completed_items}/${existingJob.total_items} items`);
      
      // Start the resume process in the background
      await resumeExistingJob(existingJob, source, supabase);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Resuming job for ${source}`,
          jobId: existingJob.job_id
        }),
        {
          status: 202,
          headers: responseHeaders,
        }
      );
    }
  }

  // Check rate limit before proceeding
  const rateLimitCheck = await checkRateLimit(source, supabase);
  if (rateLimitCheck.limited) {
    console.log(`Rate limit hit for ${source}`);
    responseHeaders["Retry-After"] = rateLimitCheck.retryAfter.toString();
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Rate limited", 
        retryAfter: rateLimitCheck.retryAfter 
      }),
      {
        status: 429, // Too Many Requests
        headers: responseHeaders,
      }
    );
  }
  
  // Set rate limit for this request
  await setRateLimit(source, supabase);
  
  // Create a new job for this request
  const newJobId = await createJob(source, supabase);
  if (!newJobId) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Failed to create job" 
      }),
      {
        status: 500,
        headers: responseHeaders,
      }
    );
  }
  
  // Start background processing based on the source
  let processingFunction;
  
  const { processPokemonSets } = await import("./pokemon.ts");
  const { processMTGSets } = await import("./mtg.ts");
  const { processYugiohSets } = await import("./yugioh.ts");
  const { processLorcanaSets } = await import("./lorcana.ts");
  const { processWithChunking } = await import("./job-utils.ts");
  
  switch (source) {
    case "pokemon":
      const { processChunkedPokemonSets } = await import("./pokemon.ts");
      processingFunction = (jobId) => processWithChunking(processChunkedPokemonSets, jobId, source, supabase, 10);
      break;
    case "mtg":
      processingFunction = (jobId) => processMTGSets(jobId, supabase);
      break;
    case "yugioh":
      processingFunction = (jobId) => processYugiohSets(jobId, supabase);
      break;
    case "lorcana":
      processingFunction = (jobId) => processLorcanaSets(jobId, supabase);
      break;
    default:
      return new Response(
        JSON.stringify({ 
          error: "Invalid source. Use 'pokemon', 'mtg', 'yugioh', or 'lorcana'" 
        }),
        {
          status: 400,
          headers: responseHeaders,
        }
      );
  }
  
  // Use EdgeRuntime's waitUntil for background processing
  const { processInBackground } = await import("./job-utils.ts");
  EdgeRuntime.waitUntil(processInBackground(processingFunction, newJobId, source, supabase));
  
  // Immediately return the job ID to the client
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Job started for ${source}`,
      jobId: newJobId
    }),
    {
      status: 202, // Accepted
      headers: responseHeaders,
    }
  );
}

// New function to check for existing jobs in progress
async function checkForExistingJob(source, supabase) {
  try {
    const { data, error } = await supabase
      .from(JOB_STATUS_TABLE)
      .select("*")
      .eq("source", source)
      .in("status", ["pending", "fetching_data", "processing_data"])
      .order("created_at", { ascending: false })
      .limit(1);
      
    if (error) {
      console.error(`Error checking for existing job for ${source}:`, error);
      return null;
    }
    
    if (data && data.length > 0) {
      return data[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Error in checkForExistingJob for ${source}:`, error);
    return null;
  }
}

// New function to resume an existing job
async function resumeExistingJob(job, source, supabase) {
  try {
    console.log(`Resuming job ${job.job_id} for ${source}`);
    
    // Update the job status to show we're resuming
    await supabase
      .from(JOB_STATUS_TABLE)
      .update({
        status: 'processing_data',
        updated_at: new Date().toISOString()
      })
      .eq("job_id", job.job_id);
      
    // Start the appropriate processing function based on the source
    let resumeFunction;
    
    switch (source) {
      case "pokemon":
        const { processChunkedPokemonSets } = await import("./pokemon.ts");
        resumeFunction = () => processChunkedPokemonSets(job.job_id, job.completed_items || 0, job.total_items || 0);
        break;
      default:
        console.error(`Resuming not implemented for ${source}`);
        return;
    }
    
    // Run the resume function in the background
    EdgeRuntime.waitUntil(resumeFunction());
    
  } catch (error) {
    console.error(`Error resuming job ${job.job_id} for ${source}:`, error);
  }
}

// Function to check job status
async function checkJobStatus(jobId, supabase, responseHeaders) {
  console.log(`Checking status for job: ${jobId}`);
  const { data, error } = await supabase
    .from(JOB_STATUS_TABLE)
    .select('*')
    .eq('job_id', jobId)
    .single();
    
  if (error) {
    console.error(`Error fetching job status for ${jobId}:`, error);
    return new Response(
      JSON.stringify({ error: `Job not found: ${jobId}` }),
      {
        status: 404,
        headers: responseHeaders,
      }
    );
  }
  
  return new Response(
    JSON.stringify({ success: true, job: data }),
    {
      status: 200,
      headers: responseHeaders,
    }
  );
}

// Function to check rate limit in the database
export async function checkRateLimit(source, supabase) {
  try {
    console.log(`Checking rate limit for ${source}`);
    
    // Try to create the rate limit table if it doesn't exist
    await supabase.rpc("create_rate_limit_table_if_not_exists").catch(e => {
      console.log("Rate limit table creation RPC error (may already exist):", e);
    });
    
    // Check if rate limit exists
    const { data, error } = await supabase
      .from(RATE_LIMIT_TABLE)
      .select("expires_at")
      .eq("api_key", source)
      .single();
      
    if (error && error.code !== "PGRST116") { // PGRST116 is "No rows returned"
      console.error("Error checking rate limit:", error);
      return { limited: false, retryAfter: 0 }; // Fail open if error
    }
    
    if (!data) {
      return { limited: false, retryAfter: 0 };
    }
    
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    
    if (now < expiresAt) {
      const retryAfter = Math.ceil((expiresAt.getTime() - now.getTime()) / 1000);
      console.log(`Rate limit active for ${source}, retry after ${retryAfter}s`);
      return { limited: true, retryAfter };
    }
    
    return { limited: false, retryAfter: 0 };
  } catch (error) {
    console.error("Error in rate limit check:", error);
    return { limited: false, retryAfter: 0 }; // Fail open if error
  }
}

// Function to set rate limit in the database
export async function setRateLimit(source, supabase) {
  try {
    console.log(`Setting rate limit for ${source}`);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RATE_LIMIT_SECONDS * 1000);
    
    // Upsert rate limit
    const { error } = await supabase
      .from(RATE_LIMIT_TABLE)
      .upsert({
        api_key: source,
        last_accessed: now.toISOString(),
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: "api_key"
      });
      
    if (error) {
      console.error("Error setting rate limit:", error);
    }
    
    return { expiresAt, retryAfter: RATE_LIMIT_SECONDS };
  } catch (error) {
    console.error("Error in set rate limit:", error);
    return { expiresAt: new Date(Date.now() + RATE_LIMIT_SECONDS * 1000), retryAfter: RATE_LIMIT_SECONDS };
  }
}

// Function to create a new job and return the job_id
export async function createJob(source, supabase) {
  try {
    const { createJobStatusTableIfNotExists } = await import("./job-utils.ts");
    await createJobStatusTableIfNotExists(supabase);
    
    const jobId = crypto.randomUUID();
    
    const { error } = await supabase
      .from(JOB_STATUS_TABLE)
      .insert({
        job_id: jobId,
        source: source,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      console.error("Error creating job:", error);
      return null;
    }
    
    return jobId;
  } catch (error) {
    console.error("Error in create job:", error);
    return null;
  }
}

// Update the last sync time for an API
export async function updateApiSyncTime(apiName, supabase) {
  console.log(`Updating last sync time for ${apiName}`);
  try {
    const { error } = await supabase.from("api_config").upsert(
      {
        api_name: apiName,
        last_sync_time: new Date().toISOString(),
      },
      {
        onConflict: "api_name",
      }
    );

    if (error) {
      console.error(`Error updating sync time for ${apiName}:`, error);
    } else {
      console.log(`Successfully updated sync time for ${apiName}`);
    }
  } catch (err) {
    console.error(`Exception updating sync time for ${apiName}:`, err);
  }
}
