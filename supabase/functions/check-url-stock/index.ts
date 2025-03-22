
// @ts-ignore
import { serve } from "std/http/server.ts";
// Using direct import URL for Supabase client
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Initialize Supabase client
const createSupabaseClient = (req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Anti-detection measures
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:90.0) Gecko/20100101 Firefox/90.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
];

interface CheckUrlRequest {
  id: string;
  url: string;
  targetText?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  
  let body: CheckUrlRequest | null = null;
  let supabase = null;
  
  try {
    // Try to parse request body
    try {
      body = await req.json() as CheckUrlRequest;
      console.log("Received request:", JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid request format" }),
        {
          status: 200, // Use 200 to avoid client errors
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Validate required fields
    if (!body || !body.url || !body.id) {
      console.error("Missing required fields in request body");
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        {
          status: 200, // Use 200 to avoid client errors
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Create Supabase client
    try {
      supabase = createSupabaseClient(req);
    } catch (dbError) {
      console.error("Failed to create Supabase client:", dbError);
      return new Response(
        JSON.stringify({ success: false, error: "Database connection error" }),
        {
          status: 200, // Use 200 to avoid client errors
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Select a random user agent
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    
    // Set up headers for the request
    const headers = {
      "User-Agent": userAgent,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "DNT": "1",
    };
    
    console.log(`Checking URL: ${body.url}`);
    
    // Small random delay to avoid detection patterns (reduced to prevent long waits)
    const timeout = Math.floor(Math.random() * 1000) + 500;
    await new Promise(resolve => setTimeout(resolve, timeout));
    
    // Make the request with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout
    
    let response = null;
    let html = "";
    let fetchError = null;
    
    try {
      // Make the request
      response = await fetch(body.url, {
        method: "GET",
        headers,
        redirect: "follow",
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }
      
      // Get the HTML content
      html = await response.text();
      
    } catch (error) {
      clearTimeout(timeoutId);
      fetchError = error;
      console.error("Fetch error:", error);
      
      // Update database with error status
      try {
        if (supabase) {
          await supabase
            .from("stock_monitors")
            .update({
              last_checked: new Date().toISOString(),
              status: "error",
              error_message: error.message || "Failed to fetch URL"
            })
            .eq("id", body.id);
        }
      } catch (updateError) {
        console.error("Failed to update error status:", updateError);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          isInStock: false,
          error: error.message || "Failed to fetch URL",
          id: body.id,
          lastChecked: new Date().toISOString()
        }),
        {
          status: 200, // Return 200 even for fetch errors to prevent client errors
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // If we got the HTML content successfully, analyze it
    let isInStock = false;
    let errorMessage = null;
    
    try {
      // First check for specific target text if provided
      if (body.targetText && body.targetText.trim() !== '') {
        console.log(`Checking for custom target text: "${body.targetText}"`);
        isInStock = html.includes(body.targetText);
        console.log(`Custom target text check "${body.targetText}": ${isInStock ? 'found' : 'not found'}`);
      } else {
        // Universal stock check with improved button state detection
        const lowerHtml = html.toLowerCase();
        
        // IMPROVED BUTTON DETECTION:
        // Extract all buttons from the HTML for detailed analysis
        const buttonRegex = /<button[^>]*>(.*?)<\/button>/gis;
        let match;
        const buttons = [];
        
        while ((match = buttonRegex.exec(html)) !== null) {
          buttons.push(match[0].toLowerCase());
        }
        
        // Look for Add to Cart buttons and check if they're disabled
        let hasEnabledAddToCartButton = false;
        let hasDisabledAddToCartButton = false;

        const cartButtonPatterns = [
          'add to cart',
          'add to basket',
          'buy now',
          'purchase',
          'checkout',
          'preorder'
        ];
        
        const disabledPatterns = [
          'disabled',
          'out-of-stock',
          'sold-out',
          'unavailable',
          'btn-disabled',
          'disabled="true"',
          'disabled=""',
          'class="[^"]*disabled[^"]*"'
        ];
        
        // Analyze each button
        for (const button of buttons) {
          const isCartButton = cartButtonPatterns.some(pattern => button.includes(pattern));
          
          if (isCartButton) {
            const isDisabled = disabledPatterns.some(pattern => button.includes(pattern));
            
            if (isDisabled) {
              hasDisabledAddToCartButton = true;
              console.log("Found disabled cart button:", button);
            } else {
              hasEnabledAddToCartButton = true;
              console.log("Found enabled cart button:", button);
            }
          }
        }
        
        // Out of stock indicators in the entire page
        const outOfStockPatterns = [
          'out of stock',
          'out-of-stock',
          'sold out',
          'sold-out',
          'currently unavailable',
          'not available',
          'notify me when',
          'email when available',
          'back in stock',
          'back-in-stock',
          'temporarily out of stock'
        ];
        
        const hasOutOfStockIndicator = outOfStockPatterns.some(pattern => 
          lowerHtml.includes(pattern)
        );

        // In stock indicators in the entire page
        const inStockPatterns = [
          'in stock',
          'in-stock',
          'available',
          'ready to ship',
          'ships today'
        ];

        const hasInStockIndicator = inStockPatterns.some(pattern =>
          lowerHtml.includes(pattern)
        );
        
        // Make the final determination:
        // 1. Enabled "Add to Cart" button is the strongest indicator for in-stock
        // 2. Disabled "Add to Cart" button is a strong indicator for out-of-stock
        // 3. General text indicators as fallback
        
        if (hasEnabledAddToCartButton && !hasDisabledAddToCartButton) {
          isInStock = true;
          console.log("Found enabled Add to Cart button, considering item IN STOCK");
        } else if (hasDisabledAddToCartButton) {
          isInStock = false;
          console.log("Found disabled Add to Cart button, considering item OUT OF STOCK");
        } else if (hasOutOfStockIndicator) {
          isInStock = false;
          console.log("Found out-of-stock text indicator, considering item OUT OF STOCK");
        } else if (hasInStockIndicator) {
          isInStock = true;
          console.log("Found in-stock text indicator, considering item IN STOCK");
        } else {
          isInStock = false;
          console.log("No clear indicators found, defaulting to OUT OF STOCK to avoid false positives");
        }
      }
      
      console.log(`Final stock determination: ${isInStock ? 'IN STOCK' : 'OUT OF STOCK'}`);
      
    } catch (analysisError) {
      console.error('Error during stock pattern detection:', analysisError);
      errorMessage = analysisError.message;
      isInStock = false; // Default to out of stock on error
    }
    
    // Update the database with results
    try {
      const { error: updateError } = await supabase
        .from("stock_monitors")
        .update({
          last_checked: new Date().toISOString(),
          status: isInStock ? "in-stock" : "out-of-stock",
          html_snapshot: html.substring(0, 5000), // Store partial HTML for verification (reduced to save space)
          error_message: errorMessage
        })
        .eq("id", body.id);
      
      if (updateError) {
        console.error(`Database update error: ${updateError.message}`);
        throw updateError;
      }
    } catch (dbError) {
      console.error("Failed to update database:", dbError);
      return new Response(
        JSON.stringify({ success: false, error: "Database update error" }),
        {
          status: 200, // Return 200 even for db errors to prevent client errors
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        isInStock,
        id: body.id,
        lastChecked: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
    
  } catch (error) {
    // Top-level error handler
    console.error("Unhandled error in check-url-stock function:", error);
    
    // Try to update the database with error status
    try {
      if (supabase && body && body.id) {
        await supabase
          .from("stock_monitors")
          .update({
            last_checked: new Date().toISOString(),
            status: "error",
            error_message: error.message || "Unknown error occurred during check"
          })
          .eq("id", body.id);
      }
    } catch (dbError) {
      console.error("Failed to update error status in database:", dbError);
    }
    
    // Return error response with 200 status to avoid client errors
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unknown error occurred",
        id: body?.id,
        lastChecked: new Date().toISOString()
      }),
      {
        status: 200, 
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});
