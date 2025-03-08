
// @ts-ignore
import { serve } from "std/http/server.ts";
// @ts-ignore
import { createClient } from "@supabase/supabase-js";
import { processTCGData } from "./processor.ts";
import { JobStatus, updateJobStatus } from "./database/job-status.ts";

// Initialize environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const pokemonApiKey = Deno.env.get("POKEMON_TCG_API_KEY") as string;
const mtgApiKey = Deno.env.get("MTG_API_KEY") as string;
const authKey = Deno.env.get("TCG_SYNC_ACCESS_KEY") as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Enforced rate limiting
const RATE_LIMIT_SECONDS = 60; // 1 minute

interface FetchTCGRequest {
  source: "pokemon" | "mtg" | "yugioh" | "lorcana";
  jobId?: string;
  accessKey?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    // Parse request body
    const requestData: FetchTCGRequest = await req.json();
    console.log("Request received for source:", requestData.source);

    // Simple authorization check
    if (requestData.accessKey !== authKey && !requestData.jobId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized. Authentication required." 
        }),
        { 
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // If jobId is provided, return the status of that job
    if (requestData.jobId) {
      console.log("Fetching status for job:", requestData.jobId);
      const { data: jobData, error: jobError } = await supabase
        .from('api_job_status')
        .select('*')
        .eq('job_id', requestData.jobId)
        .single();

      if (jobError) {
        console.error("Error fetching job status:", jobError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to fetch job status: ${jobError.message}` 
          }),
          { 
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
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
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Check if we already have a running job for this source
    const { data: existingJobs, error: jobsError } = await supabase
      .from('api_job_status')
      .select('*')
      .eq('source', requestData.source)
      .not('status', 'in', '("completed","failed")')
      .order('created_at', { ascending: false });

    if (jobsError) {
      console.error("Error checking existing jobs:", jobsError);
    } else if (existingJobs && existingJobs.length > 0) {
      console.log(`Already have a running job for ${requestData.source}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `A synchronization job for ${requestData.source} is already in progress.`,
          jobId: existingJobs[0].job_id
        }),
        { 
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Check rate limiting against database
    const { data: apiConfig, error: configError } = await supabase
      .from('api_config')
      .select('last_sync_time')
      .eq('api_name', requestData.source)
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
              "Access-Control-Allow-Origin": "*",
              "Retry-After": retryAfter.toString()
            },
          }
        );
      }
    }
    
    // Create a job ID for tracking
    const jobId = crypto.randomUUID();
    
    // Create a new job status record
    const newJob: JobStatus = {
      job_id: jobId,
      source: requestData.source,
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
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create job status: ${insertError.message}` 
        }),
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
    
    // Start background processing with API keys
    processTCGData(supabase, requestData.source, jobId, {
      pokemon: pokemonApiKey,
      mtg: mtgApiKey
    });
    
    // Return success with the job ID
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synchronization of ${requestData.source} data has started.`,
        jobId: jobId
      }),
      { 
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Failed to process request: ${error.message}` 
      }),
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
