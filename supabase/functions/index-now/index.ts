
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Main function to handle requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, key, host, urlList, searchEngines } = await req.json();
    
    // Validate inputs
    if (!key || (!url && (!host || !urlList || !urlList.length))) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const engines = searchEngines || [
      "https://www.bing.com/indexnow",
      "https://api.indexnow.org/indexnow",
      "https://yandex.com/indexnow"
    ];

    // Handle single URL submission
    if (url) {
      console.log(`Submitting single URL: ${url}`);
      const results = await Promise.allSettled(
        engines.map(engine => 
          submitSingleUrl(engine, url, key)
        )
      );
      
      return new Response(
        JSON.stringify({ 
          message: "URL submitted to search engines", 
          results: formatResults(engines, results) 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Handle batch URL submission
    console.log(`Submitting ${urlList.length} URLs for ${host}`);
    const results = await Promise.allSettled(
      engines.map(engine => 
        submitBatchUrls(engine, host, key, urlList)
      )
    );

    return new Response(
      JSON.stringify({ 
        message: "URLs batch submitted to search engines", 
        results: formatResults(engines, results) 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing IndexNow request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Submit a single URL to a search engine
async function submitSingleUrl(engine: string, url: string, key: string): Promise<Response> {
  const targetUrl = `${engine}?url=${encodeURIComponent(url)}&key=${key}`;
  const response = await fetch(targetUrl, {
    method: 'GET',
  });
  
  return response;
}

// Submit multiple URLs to a search engine
async function submitBatchUrls(engine: string, host: string, key: string, urlList: string[]): Promise<Response> {
  const response = await fetch(engine, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      host,
      key,
      urlList
    })
  });
  
  return response;
}

// Format results for response
function formatResults(engines: string[], results: PromiseSettledResult<Response>[]) {
  return engines.map((engine, index) => {
    const result = results[index];
    if (result.status === 'fulfilled') {
      return {
        engine,
        status: result.value.status,
        ok: result.value.ok
      };
    } else {
      return {
        engine,
        error: result.reason.message
      };
    }
  });
}
