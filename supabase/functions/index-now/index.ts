
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
      "User-Agent": "TCG Updates Bot"
    };
    
    // Prepare the IndexNow request body
    let indexNowBody;
    let bingResponse, googleResponse, yandexResponse;
    
    if (url) {
      // Single URL submission
      indexNowBody = {
        host: host || new URL(url).hostname,
        key: key,
        url: url
      };
      
      // Send URL to Bing using IndexNow API
      bingResponse = await fetch("https://www.bing.com/indexnow", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(indexNowBody)
      });
      
      // Send to Google Indexing API (simplified - in real implementation would require OAuth2)
      const pingGoogleUrl = `https://www.google.com/ping?sitemap=https://tcgupdates.com/sitemap.xml`;
      googleResponse = await fetch(pingGoogleUrl, {
        method: "GET",
        headers: {
          "User-Agent": "TCG Updates Bot"
        }
      });
      
      // Also submit to Yandex (another search engine that supports IndexNow)
      yandexResponse = await fetch("https://yandex.com/indexnow", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(indexNowBody)
      });
      
    } else {
      // Multiple URL submission
      indexNowBody = {
        host: host || new URL(urlList[0]).hostname,
        key: key,
        urlList: urlList
      };
      
      // Send URLs to Bing using IndexNow API
      bingResponse = await fetch("https://www.bing.com/indexnow", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(indexNowBody)
      });
      
      // Send to Google Indexing API (simplified)
      const pingGoogleUrl = `https://www.google.com/ping?sitemap=https://tcgupdates.com/sitemap.xml`;
      googleResponse = await fetch(pingGoogleUrl, {
        method: "GET",
        headers: {
          "User-Agent": "TCG Updates Bot"
        }
      });
      
      // Also submit to Yandex
      yandexResponse = await fetch("https://yandex.com/indexnow", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(indexNowBody)
      });
    }
    
    // Log results
    console.log("Bing IndexNow submission status:", bingResponse.status);
    console.log("Google ping submission status:", googleResponse.status);
    console.log("Yandex IndexNow submission status:", yandexResponse.status);
    
    const bingResult = await bingResponse.text();
    
    return new Response(
      JSON.stringify({ 
        success: bingResponse.ok, 
        bingStatus: bingResponse.status,
        bingStatusText: bingResponse.statusText,
        googleStatus: googleResponse.status,
        yandexStatus: yandexResponse.status,
        bingResult: bingResult
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in IndexNow function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
