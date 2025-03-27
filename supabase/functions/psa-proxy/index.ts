
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// PSA API base URL
const PSA_API_BASE_URL = "https://api.psacard.com/api";

// CORS headers to allow requests from our frontend
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse the request body
    let requestBody;
    if (req.method !== "GET") {
      try {
        requestBody = await req.json();
      } catch (e) {
        requestBody = null;
      }
    }

    // Get the target PSA endpoint from the URL
    const url = new URL(req.url);
    const endpoint = url.pathname.replace("/psa-proxy", "");
    const query = url.search;
    
    // Forward the token from the request headers if available
    const psaToken = req.headers.get("psa-token");
    
    if (!psaToken) {
      return new Response(
        JSON.stringify({ error: "PSA token is required" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }
    
    console.log(`Proxying request to PSA API: ${PSA_API_BASE_URL}${endpoint}${query}`);
    
    // Set up request options
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        "Authorization": `Bearer ${psaToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    };
    
    // Add request body for non-GET requests
    if (req.method !== "GET" && requestBody) {
      fetchOptions.body = JSON.stringify(requestBody);
    }
    
    // Set up timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    fetchOptions.signal = controller.signal;
    
    // Make the request to the PSA API
    const response = await fetch(`${PSA_API_BASE_URL}${endpoint}${query}`, fetchOptions);
    clearTimeout(timeoutId);
    
    // Get the response data
    const data = await response.json();
    
    // Return the response with CORS headers
    return new Response(
      JSON.stringify(data),
      { 
        status: response.status, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error) {
    console.error("Error in PSA proxy:", error);
    
    // Handle timeout errors
    if (error instanceof DOMException && error.name === "AbortError") {
      return new Response(
        JSON.stringify({ error: "Request timed out" }),
        { 
          status: 504, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }
    
    // Handle other errors
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error", 
        details: error instanceof Error ? error.stack : null
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
