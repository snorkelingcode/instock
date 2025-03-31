
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// PSA API base URL
const PSA_API_BASE_URL = "https://api.psacard.com/api";

// CORS headers to allow requests from any origin
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, psa-token",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  console.log(`PSA proxy received ${req.method} request to ${req.url}`);
  
  // Handle CORS preflight requests - must return 200 OK for OPTIONS
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
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
    
    // Forward the token from the request headers
    const psaToken = req.headers.get("psa-token");
    
    // Check if token is available
    if (!psaToken) {
      console.error("PSA token is missing from request headers");
      return new Response(
        JSON.stringify({ error: "PSA token is required" }),
        { 
          status: 401, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }
    
    console.log(`Proxying request to PSA API: ${PSA_API_BASE_URL}${endpoint}${query}`);
    
    // Set up request options with the token
    const fetchOptions = {
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
    
    console.log(`PSA API responded with status ${response.status}`);
    
    // If we're getting a cert, try to also get the population report
    if (endpoint.startsWith("/cert/") && data && data.PSACert) {
      try {
        console.log(`Getting detailed population data for cert ${data.PSACert.CertNumber}`);
        
        // Make a separate call to get the detailed population data
        const specId = data.PSACert.SpecID;
        if (specId) {
          const popController = new AbortController();
          const popTimeoutId = setTimeout(() => popController.abort(), 15000);
          
          const popResponse = await fetch(`${PSA_API_BASE_URL}/spec/pop/${specId}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${psaToken}`,
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            signal: popController.signal
          });
          
          clearTimeout(popTimeoutId);
          
          if (popResponse.ok) {
            const popData = await popResponse.json();
            
            // Enhance the original response with the detailed population data
            data.popReport = {
              totalPop: data.PSACert.TotalPopulation,
              popHigher: data.PSACert.PopulationHigher,
              popSame: 0, // Will be calculated from detailed data
              popLower: 0, // Will be calculated from detailed data
              details: {}
            };
            
            if (popData && popData.PSAPop) {
              const psaPop = popData.PSAPop;
              
              // Store detailed population data
              data.popReport.details = {
                pop10: psaPop.Grade10 || 0,
                pop9: psaPop.Grade9 || 0,
                pop8: psaPop.Grade8 || 0,
                pop7: psaPop.Grade7 || 0,
                pop6: psaPop.Grade6 || 0,
                pop5: psaPop.Grade5 || 0,
                pop4: psaPop.Grade4 || 0,
                pop3: psaPop.Grade3 || 0,
                pop2: psaPop.Grade2 || 0,
                pop1: psaPop.Grade1 || 0,
                popA: psaPop.Auth || 0
              };
              
              // Calculate popSame based on the grade of this card
              const cardGrade = parseFloat(data.PSACert.CardGrade.replace(/\D/g, ''));
              if (!isNaN(cardGrade)) {
                if (cardGrade === 10) {
                  data.popReport.popSame = psaPop.Grade10 || 0;
                } else if (cardGrade === 9) {
                  data.popReport.popSame = psaPop.Grade9 || 0;
                } else if (cardGrade === 8) {
                  data.popReport.popSame = psaPop.Grade8 || 0;
                } else if (cardGrade === 7) {
                  data.popReport.popSame = psaPop.Grade7 || 0;
                } else if (cardGrade === 6) {
                  data.popReport.popSame = psaPop.Grade6 || 0;
                } else if (cardGrade === 5) {
                  data.popReport.popSame = psaPop.Grade5 || 0;
                } else if (cardGrade === 4) {
                  data.popReport.popSame = psaPop.Grade4 || 0;
                } else if (cardGrade === 3) {
                  data.popReport.popSame = psaPop.Grade3 || 0;
                } else if (cardGrade === 2) {
                  data.popReport.popSame = psaPop.Grade2 || 0;
                } else if (cardGrade === 1) {
                  data.popReport.popSame = psaPop.Grade1 || 0;
                }
              }
              
              // Calculate popLower
              let lowerGrades = 0;
              if (cardGrade === 10) {
                // No lower grades for PSA 10
                lowerGrades = 0;
              } else if (cardGrade === 9) {
                lowerGrades = psaPop.Grade10 || 0;
              } else if (cardGrade === 8) {
                lowerGrades = (psaPop.Grade10 || 0) + (psaPop.Grade9 || 0);
              } else if (cardGrade === 7) {
                lowerGrades = (psaPop.Grade10 || 0) + (psaPop.Grade9 || 0) + (psaPop.Grade8 || 0);
              } else if (cardGrade === 6) {
                lowerGrades = (psaPop.Grade10 || 0) + (psaPop.Grade9 || 0) + (psaPop.Grade8 || 0) + (psaPop.Grade7 || 0);
              } else if (cardGrade === 5) {
                lowerGrades = (psaPop.Grade10 || 0) + (psaPop.Grade9 || 0) + (psaPop.Grade8 || 0) + (psaPop.Grade7 || 0) + (psaPop.Grade6 || 0);
              } else if (cardGrade === 4) {
                lowerGrades = (psaPop.Grade10 || 0) + (psaPop.Grade9 || 0) + (psaPop.Grade8 || 0) + (psaPop.Grade7 || 0) + (psaPop.Grade6 || 0) + (psaPop.Grade5 || 0);
              } else if (cardGrade === 3) {
                lowerGrades = (psaPop.Grade10 || 0) + (psaPop.Grade9 || 0) + (psaPop.Grade8 || 0) + (psaPop.Grade7 || 0) + (psaPop.Grade6 || 0) + (psaPop.Grade5 || 0) + (psaPop.Grade4 || 0);
              } else if (cardGrade === 2) {
                lowerGrades = (psaPop.Grade10 || 0) + (psaPop.Grade9 || 0) + (psaPop.Grade8 || 0) + (psaPop.Grade7 || 0) + (psaPop.Grade6 || 0) + (psaPop.Grade5 || 0) + (psaPop.Grade4 || 0) + (psaPop.Grade3 || 0);
              } else if (cardGrade === 1) {
                lowerGrades = (psaPop.Grade10 || 0) + (psaPop.Grade9 || 0) + (psaPop.Grade8 || 0) + (psaPop.Grade7 || 0) + (psaPop.Grade6 || 0) + (psaPop.Grade5 || 0) + (psaPop.Grade4 || 0) + (psaPop.Grade3 || 0) + (psaPop.Grade2 || 0);
              }
              
              data.popReport.popLower = lowerGrades;
            }
            
            console.log("Successfully enhanced response with population data");
          } else {
            console.warn(`Failed to get population data: ${popResponse.status}`);
          }
        }
      } catch (popError) {
        console.error("Error fetching detailed population data:", popError);
        // Continue with the original response even if the population data fetch fails
      }
    }
    
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
