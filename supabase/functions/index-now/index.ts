
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Main handler for the IndexNow edge function
serve(async (req) => {
  try {
    // Parse the request body
    const { key, url, host, urlList } = await req.json();
    
    // Validate required parameters
    if (!key) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: key" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    if (!url && !urlList) {
      return new Response(
        JSON.stringify({ error: "Either url or urlList parameter is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Set headers for the request to search engines
    const headers = {
      "Content-Type": "application/json",
      "User-Agent": "Supabase Edge Function"
    };
    
    // Prepare the IndexNow request body
    let indexNowBody;
    
    if (url) {
      // Single URL submission
      indexNowBody = {
        host: host || new URL(url).hostname,
        key: key,
        url: url
      };
    } else {
      // Multiple URL submission
      indexNowBody = {
        host: host || new URL(urlList[0]).hostname,
        key: key,
        urlList: urlList
      };
    }
    
    // Send request to IndexNow API (Bing)
    const response = await fetch("https://www.bing.com/indexnow", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(indexNowBody)
    });
    
    const result = await response.text();
    
    return new Response(
      JSON.stringify({ 
        success: response.ok, 
        status: response.status, 
        statusText: response.statusText,
        result: result 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
