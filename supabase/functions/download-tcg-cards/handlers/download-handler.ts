
import { corsHeaders } from "../handlers/cors-headers.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.0";
import { 
  downloadPokemonCards,
  downloadMTGCards,
  downloadYugiohCards,
  downloadLorcanaCards
} from "../processors/download-processor.ts";
import { createDownloadJob, updateDownloadJobStatus, getDownloadJobStatus } from "../database/job-status.ts";

export { corsHeaders };

// Validate request access
const validateAccess = (accessKey: string) => {
  const validKey = Deno.env.get("TCG_SYNC_ACCESS_KEY");
  
  if (!validKey) {
    console.warn("TCG_SYNC_ACCESS_KEY is not set in the environment variables");
    return false;
  }
  
  return accessKey === validKey;
};

// Main handler function for TCG card downloads
export async function handleTCGCardDownload(req: Request, supabase: any): Promise<Response> {
  // Parse request body
  let body;
  try {
    body = await req.json();
  } catch (error) {
    console.error("Error parsing request body:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid request body",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  // Handle job status check request
  if (body.jobId && !body.source) {
    console.log("Checking status for job:", body.jobId);
    
    try {
      const job = await getDownloadJobStatus(body.jobId, supabase);
      
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
    } catch (error) {
      console.error("Error checking job status:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Error checking job status: ${error.message}`,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  }

  // Validate access for download requests
  if (!validateAccess(body.accessKey)) {
    console.error("Invalid access key");
    return new Response(
      JSON.stringify({
        success: false,
        error: "Access denied: Invalid access key",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  // Extract parameters
  const { source, setId, downloadImages = true } = body;

  if (!source) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing required parameter: source",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  // Create a job ID and start the download process in a separate thread
  try {
    const jobId = uuidv4();
    console.log(`Starting ${source} card download job: ${jobId}`);
    
    // Create job record in database
    await createDownloadJob(supabase, jobId, source, setId ? 'set_cards' : 'all_cards');

    // Start the download process asynchronously
    (async () => {
      try {
        switch (source) {
          case "pokemon":
            await downloadPokemonCards(supabase, jobId, setId, downloadImages);
            break;
          case "mtg":
            await downloadMTGCards(supabase, jobId, setId, downloadImages);
            break;
          case "yugioh":
            await downloadYugiohCards(supabase, jobId, setId, downloadImages);
            break;
          case "lorcana":
            await downloadLorcanaCards(supabase, jobId, setId, downloadImages);
            break;
          default:
            await updateDownloadJobStatus(
              supabase,
              jobId,
              "failed",
              0,
              0,
              `Unsupported source: ${source}`
            );
            return;
        }
      } catch (error) {
        console.error(`Error in ${source} card download:`, error);
        await updateDownloadJobStatus(
          supabase,
          jobId,
          "failed",
          0,
          0,
          error.message || "Unknown error during download"
        );
      }
    })();

    // Return success response with job ID
    return new Response(
      JSON.stringify({
        success: true,
        message: `${source} card download job started`,
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
    console.error("Error starting download job:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Error starting download job: ${error.message}`,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
}
