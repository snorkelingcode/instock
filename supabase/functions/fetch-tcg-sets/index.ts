
// @ts-ignore
import { serve } from "std/http/server.ts";
// @ts-ignore
import { createClient } from "@supabase/supabase-js";
import { handleTCGRequest, corsHeaders } from "./handlers/request-handler.ts";

// Initialize environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  return await handleTCGRequest(req, supabase);
});
