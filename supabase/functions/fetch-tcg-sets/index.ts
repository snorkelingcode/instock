
// Import necessary modules
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.1.1";
import { corsHeaders, handleRequest } from "./utils.ts";
import { createRpcFunctionsIfNeeded } from "./db-setup.ts";

// Define environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Main edge function handler
Deno.serve(async (req) => {
  console.log("Edge function received request:", req.method, req.url);
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request for CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== "POST") {
    console.log(`Method not allowed: ${req.method}`);
    return new Response(
      JSON.stringify({ error: "Method not allowed" }), 
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Try to create RPC functions if needed
    await createRpcFunctionsIfNeeded(supabase);
    
    // Handle the main request processing
    return await handleRequest(req, supabase);
  } catch (error) {
    console.error("Unhandled error in edge function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred",
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
