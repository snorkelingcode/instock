
// Use direct URL imports for consistency
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { processCardDownload } from "../processors/download-processor.ts";
import { createDownloadJob, updateDownloadJobStatus, getDownloadJobStatus } from "../database/job-status.ts";

// CORS headers
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

export interface DownloadTCGRequest {
  source: "pokemon" | "mtg" | "yugioh" | "lorcana";
  setId?: string;
  downloadImages?: boolean;
  accessKey?: string;
  jobId?: string;
}

export interface DownloadTCGResponse {
  success: boolean;
  message: string;
  jobId?: string;
  job?: any;
  error?: string;
}

// Create a standardized error response
function createErrorResponse(message: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}

// Main handler for the download-tcg-cards edge function
export async function handleTCGCardDownload(req: Request, supabase: any): Promise<Response> {
  try {
    const requestData: DownloadTCGRequest = await req.json();
    
    // Get access key from environment
    const authKey = Deno.env.get("TCG_SYNC_ACCESS_KEY") as string;
    const pokemonApiKey = Deno.env.get("POKEMON_TCG_API_KEY") as string;
    const mtgApiKey = Deno.env.get("MTG_API_KEY") as string;
    
    console.log("Access key provided:", !!requestData.accessKey);
    console.log("Job ID provided:", !!requestData.jobId);

    // Simple authorization check
    if (requestData.accessKey !== authKey && !requestData.jobId) {
      console.log("Authorization failed - invalid access key");
      return createErrorResponse("Unauthorized. Authentication required.", 401);
    }

    // If jobId is provided, return the status of that job
    if (requestData.jobId) {
      console.log("Fetching status for job ID:", requestData.jobId);
      const job = await getDownloadJobStatus(requestData.jobId, supabase);
      return new Response(
        JSON.stringify({
          success: true,
          job,
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

    // Validate required parameters
    if (!requestData.source) {
      return createErrorResponse("Missing required parameter: source");
    }

    // Create a new job and start processing
    console.log(`Creating download job for source: ${requestData.source}, setId: ${requestData.setId || 'all sets'}`);
    
    // Create a job record
    const jobId = crypto.randomUUID();
    await createDownloadJob(
      supabase, 
      jobId, 
      requestData.source, 
      requestData.setId ? "set_cards" : "all_cards"
    );

    // Start background processing
    console.log("Starting background processing for job:", jobId);
    EdgeRuntime.waitUntil(
      processCardDownload(
        supabase, 
        requestData.source, 
        jobId, 
        { 
          pokemon: pokemonApiKey,
          mtg: mtgApiKey
        },
        {
          setId: requestData.setId,
          downloadImages: requestData.downloadImages === undefined ? true : requestData.downloadImages
        }
      )
    );

    // Return immediate success response with job ID
    return new Response(
      JSON.stringify({
        success: true,
        message: `Download job created for ${requestData.source} ${requestData.setId ? `set ${requestData.setId}` : 'all sets'}`,
        jobId,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error("Error processing download request:", error);
    return createErrorResponse(`Error processing request: ${error.message}`);
  }
}
