
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
    throw new Error("Missing Supabase environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Anti-detection measures
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.183",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 OPR/101.0.0.0",
  "Mozilla/5.0 (iPad; CPU OS 16_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
];

interface CheckUrlRequest {
  id: string;
  url: string;
  targetText?: string;
}

// Helper function to stringify error objects fully
const stringifyErrorDetails = (error: any): string => {
  try {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    } else if (typeof error === 'object' && error !== null) {
      try {
        // Check if it's a Response object
        if (error.status && error.statusText) {
          return `HTTP Error: ${error.status} ${error.statusText}`;
        }
        
        // Try to stringify the entire object for more details
        const jsonStr = JSON.stringify(error);
        return jsonStr === '{}' ? 'Empty error object' : jsonStr;
      } catch (e) {
        // If circular reference or other JSON error
        return `[Complex error object: ${Object.keys(error).join(', ')}]`;
      }
    }
  } catch (e) {
    return `[Error stringifying error: ${e}]`;
  }
  return String(error);
};

// Sanitize URL to avoid common tracking parameters
const sanitizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    
    // Common tracking parameters to remove
    const paramsToRemove = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', 'zanpid', 'dclid', 'igshid'
    ];
    
    // Remove tracking parameters
    paramsToRemove.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    return urlObj.toString();
  } catch (e) {
    console.error("Error sanitizing URL:", e);
    return url; // Return original URL if parsing fails
  }
};

serve(async (req: Request) => {
  console.log("Edge function received request");
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
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
        JSON.stringify({ 
          success: false, 
          error: `Invalid request format: ${parseError instanceof Error ? parseError.message : String(parseError)}` 
        }),
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
      const missingFields = [];
      if (!body) missingFields.push("body");
      else {
        if (!body.url) missingFields.push("url");
        if (!body.id) missingFields.push("id");
      }
      
      console.error(`Missing required fields: ${missingFields.join(", ")}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Missing required fields: ${missingFields.join(", ")}` 
        }),
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
      console.log("Supabase client created successfully");
    } catch (dbError) {
      console.error("Failed to create Supabase client:", dbError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Database connection error: ${stringifyErrorDetails(dbError)}` 
        }),
        {
          status: 200, // Use 200 to avoid client errors
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // First update the database to show we're checking
    try {
      const { error: updateError } = await supabase
        .from("stock_monitors")
        .update({
          status: "unknown",
          error_message: null
        })
        .eq("id", body.id);
        
      if (updateError) {
        console.error("Failed to update initial status:", updateError);
      }
    } catch (e) {
      console.error("Error updating initial status:", e);
    }
    
    // Sanitize URL to avoid tracking parameters
    const sanitizedUrl = sanitizeUrl(body.url);
    
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
      "Referer": new URL(sanitizedUrl).origin,
    };
    
    console.log(`Checking URL: ${sanitizedUrl}`);
    
    // Small random delay to avoid detection patterns
    const timeout = Math.floor(Math.random() * 1000) + 500;
    await new Promise(resolve => setTimeout(resolve, timeout));
    
    // Make the request with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    let response = null;
    let html = "";
    let fetchError = null;
    
    try {
      console.log("Sending fetch request...");
      // Make the request
      response = await fetch(sanitizedUrl, {
        method: "GET",
        headers,
        redirect: "follow",
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Fetch response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Response(response);
      }
      
      // Get the HTML content
      html = await response.text();
      console.log(`Received HTML content (${html.length} characters)`);
      
    } catch (error) {
      clearTimeout(timeoutId);
      fetchError = error;
      console.error("Fetch error:", error);
      
      // Create detailed error message
      let errorMessage;
      
      if (error instanceof DOMException && error.name === "AbortError") {
        errorMessage = "Request timeout: took longer than 15 seconds to respond";
      } else if (error instanceof Response) {
        errorMessage = `HTTP error: ${error.status} ${error.statusText}`;
        try {
          const errorText = await error.text();
          if (errorText) {
            errorMessage += ` - ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
          }
        } catch (e) {
          // Ignore error getting text
        }
      } else {
        errorMessage = stringifyErrorDetails(error);
      }
      
      // Update database with error status
      try {
        if (supabase) {
          console.log("Updating database with fetch error");
          await supabase
            .from("stock_monitors")
            .update({
              last_checked: new Date().toISOString(),
              status: "error",
              error_message: `Failed to fetch: ${errorMessage}`,
              consecutive_errors: supabase.rpc('increment_field', { 
                row_id: body.id,
                table_name: 'stock_monitors',
                field_name: 'consecutive_errors'
              })
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
          error: errorMessage,
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
    let stockStatusReason = ""; // For debugging
    
    try {
      console.log("Analyzing HTML content for stock status");
      
      const lowerHtml = html.toLowerCase();
      
      // First check for specific target text if provided
      if (body.targetText && body.targetText.trim() !== '') {
        console.log(`Checking for custom target text: "${body.targetText}"`);
        isInStock = html.includes(body.targetText);
        stockStatusReason = `Custom target text: "${body.targetText}" was ${isInStock ? 'found' : 'not found'}`;
        console.log(stockStatusReason);
      } else {
        // EXTRACT BUTTONS: Find all <button> elements
        const buttonRegex = /<button[^>]*>(.*?)<\/button>/gis;
        let match;
        const buttons = [];
        
        while ((match = buttonRegex.exec(html)) !== null) {
          buttons.push(match[0].toLowerCase());
        }
        
        console.log(`Found ${buttons.length} buttons in HTML`);
        
        // Look for Add to Cart buttons and check if they're disabled
        let hasEnabledAddToCartButton = false;
        let hasDisabledAddToCartButton = false;

        // Common phrases in add-to-cart buttons
        const cartButtonPatterns = [
          'add to cart',
          'add to basket',
          'buy now',
          'purchase',
          'checkout',
          'preorder',
          'shop now',
          'get it now'
        ];
        
        // Patterns that indicate a button is disabled
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
              console.log("Found disabled cart button:", button.substring(0, 100));
            } else {
              hasEnabledAddToCartButton = true;
              console.log("Found enabled cart button:", button.substring(0, 100));
            }
          }
        }
        
        // Also look for 'add to cart' forms which are common in ecommerce sites
        const hasAddToCartForm = lowerHtml.includes('form') && 
          (lowerHtml.includes('add to cart') || lowerHtml.includes('add-to-cart'));
          
        if (hasAddToCartForm) {
          console.log("Found add to cart form");
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
        
        // Check for out-of-stock indicators
        let hasOutOfStockIndicator = false;
        let foundOutOfStockPattern = "";
        
        for (const pattern of outOfStockPatterns) {
          if (lowerHtml.includes(pattern)) {
            hasOutOfStockIndicator = true;
            foundOutOfStockPattern = pattern;
            break;
          }
        }

        if (hasOutOfStockIndicator) {
          console.log(`Found out-of-stock text indicator: "${foundOutOfStockPattern}"`);
        }
        
        // In stock indicators in the entire page
        const inStockPatterns = [
          'in stock',
          'in-stock',
          'available',
          'ready to ship',
          'ships today',
          'add to cart'
        ];

        // Check for in-stock indicators
        let hasInStockIndicator = false;
        let foundInStockPattern = "";
        
        for (const pattern of inStockPatterns) {
          if (lowerHtml.includes(pattern)) {
            hasInStockIndicator = true;
            foundInStockPattern = pattern;
            break;
          }
        }
        
        if (hasInStockIndicator) {
          console.log(`Found in-stock text indicator: "${foundInStockPattern}"`);
        }
        
        // E-commerce site detection (refines stock detection logic)
        const urlObj = new URL(sanitizedUrl);
        const hostname = urlObj.hostname.toLowerCase();
        
        const isTargetSite = hostname.includes('target.com');
        const isAmazonSite = hostname.includes('amazon.com');
        const isWalmartSite = hostname.includes('walmart.com');
        const isBestBuySite = hostname.includes('bestbuy.com');
        const isGamestopSite = hostname.includes('gamestop.com');
        
        // Site-specific logic
        if (isTargetSite) {
          // Target-specific stock detection
          const soldOutIndicator = lowerHtml.includes('sold out');
          const addToCartEnabled = lowerHtml.includes('pickup button') || lowerHtml.includes('shipit-button');
          
          if (soldOutIndicator) {
            isInStock = false;
            stockStatusReason = "Target: 'Sold out' indicator found";
          } else if (addToCartEnabled || lowerHtml.includes('add to cart')) {
            isInStock = true;
            stockStatusReason = "Target: Add to cart functionality detected";
          } else {
            isInStock = false;
            stockStatusReason = "Target: No clear stock indicators";
          }
        } else if (isAmazonSite) {
          // Amazon-specific stock detection
          if (lowerHtml.includes('add to cart') && !lowerHtml.includes('currently unavailable')) {
            isInStock = true;
            stockStatusReason = "Amazon: Add to cart available and not listed as unavailable";
          } else {
            isInStock = false;
            stockStatusReason = "Amazon: Product unavailable or no add to cart option";
          }
        } else if (isWalmartSite) {
          // Walmart-specific detection
          if (lowerHtml.includes('add to cart') && !hasOutOfStockIndicator) {
            isInStock = true;
            stockStatusReason = "Walmart: Add to cart available without out-of-stock indicators";
          } else if (hasOutOfStockIndicator) {
            isInStock = false;
            stockStatusReason = `Walmart: Out of stock indicator found: "${foundOutOfStockPattern}"`;
          } else {
            isInStock = false;
            stockStatusReason = "Walmart: No clear stock indicators";
          }
        } else if (isBestBuySite) {
          // BestBuy-specific detection
          if (lowerHtml.includes('add to cart') && !lowerHtml.includes('sold out')) {
            isInStock = true;
            stockStatusReason = "BestBuy: Add to cart available without sold out indicator";
          } else if (lowerHtml.includes('sold out')) {
            isInStock = false;
            stockStatusReason = "BestBuy: Sold out indicator found";
          } else {
            isInStock = false;
            stockStatusReason = "BestBuy: No clear stock indicators";
          }
        } else if (isGamestopSite) {
          // GameStop-specific detection
          if (lowerHtml.includes('add to cart') && !lowerHtml.includes('not available')) {
            isInStock = true;
            stockStatusReason = "GameStop: Add to cart available without unavailable indicator";
          } else if (lowerHtml.includes('not available') || lowerHtml.includes('out of stock')) {
            isInStock = false;
            stockStatusReason = "GameStop: Not available or out of stock indicator found";
          } else {
            isInStock = false;
            stockStatusReason = "GameStop: No clear stock indicators";
          }
        } else {
          // General stock detection logic for other sites
          // 1. Enabled "Add to Cart" button is the strongest indicator for in-stock
          // 2. Disabled "Add to Cart" button is a strong indicator for out-of-stock
          // 3. General text indicators as fallback
          
          if (hasEnabledAddToCartButton && !hasDisabledAddToCartButton) {
            isInStock = true;
            stockStatusReason = "Found enabled Add to Cart button, considering item IN STOCK";
          } else if (hasAddToCartForm && !hasOutOfStockIndicator) {
            isInStock = true;
            stockStatusReason = "Found Add to Cart form without out-of-stock indicators";
          } else if (hasDisabledAddToCartButton) {
            isInStock = false;
            stockStatusReason = "Found disabled Add to Cart button, considering item OUT OF STOCK";
          } else if (hasOutOfStockIndicator) {
            isInStock = false;
            stockStatusReason = `Found out-of-stock text indicator: "${foundOutOfStockPattern}"`;
          } else if (hasInStockIndicator) {
            isInStock = true;
            stockStatusReason = `Found in-stock text indicator: "${foundInStockPattern}"`;
          } else {
            isInStock = false;
            stockStatusReason = "No clear indicators found, defaulting to OUT OF STOCK to avoid false positives";
          }
        }
      }
      
      console.log(`Final stock determination: ${isInStock ? 'IN STOCK' : 'OUT OF STOCK'} - Reason: ${stockStatusReason}`);
      
    } catch (analysisError) {
      console.error('Error during stock pattern detection:', analysisError);
      errorMessage = analysisError instanceof Error ? analysisError.message : String(analysisError);
      isInStock = false; // Default to out of stock on error
      stockStatusReason = `Error during analysis: ${errorMessage}`;
    }
    
    // Update the database with results
    try {
      console.log(`Updating database with check results: status=${isInStock ? "in-stock" : "out-of-stock"}, reason=${stockStatusReason}`);
      
      const updateData = {
        last_checked: new Date().toISOString(),
        status: isInStock ? "in-stock" : "out-of-stock",
        error_message: errorMessage || stockStatusReason, // Store the reason for transparency
        consecutive_errors: 0 // Reset consecutive errors on success
      };
      
      const { error: updateError } = await supabase
        .from("stock_monitors")
        .update(updateData)
        .eq("id", body.id);
      
      if (updateError) {
        console.error(`Database update error:`, updateError);
        throw new Error(`Database update error: ${stringifyErrorDetails(updateError)}`);
      } else {
        console.log("Database updated successfully");
      }
    } catch (dbError) {
      console.error("Failed to update database:", dbError);
      
      // Create a detailed error message
      const detailedError = stringifyErrorDetails(dbError);
      
      // Try one more update with error status
      try {
        await supabase
          .from("stock_monitors")
          .update({
            last_checked: new Date().toISOString(),
            status: "error",
            error_message: `Database error: ${detailedError}`
          })
          .eq("id", body.id);
      } catch (e) {
        console.error("Second attempt to update database failed:", e);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Database update error: ${detailedError}`,
          stockStatusReason
        }),
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
        lastChecked: new Date().toISOString(),
        stockStatusReason
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
    
    const errorMessage = stringifyErrorDetails(error);
    
    // Try to update the database with error status
    try {
      if (supabase && body && body.id) {
        await supabase
          .from("stock_monitors")
          .update({
            last_checked: new Date().toISOString(),
            status: "error",
            error_message: `Unhandled error: ${errorMessage}`,
            consecutive_errors: supabase.rpc('increment_field', { 
              row_id: body.id,
              table_name: 'stock_monitors',
              field_name: 'consecutive_errors'
            })
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
        error: errorMessage,
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
