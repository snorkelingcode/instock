
// Follow Deno's module system for imports
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { handleTCGRequest, corsHeaders } from "./handlers/request-handler.ts";

// Initialize environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log("Edge Function 'fetch-tcg-sets' is starting...");

serve(async (req) => {
  console.log("Received request to fetch-tcg-sets edge function");
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    return await handleTCGRequest(req, supabase);
  } catch (error) {
    console.error("Unhandled error in fetch-tcg-sets edge function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Unhandled error: ${error.message || "Unknown error"}`,
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
});
