
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
  
  try {
    const supabase = createSupabaseClient(req);
    const body = await req.json() as CheckUrlRequest;
    
    if (!body || !body.url || !body.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Random user agent selection
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    
    // Randomized headers to avoid patterns
    const headers = {
      "User-Agent": userAgent,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Cache-Control": "no-cache",
      // Random referrers could be added here for greater stealth
      "Pragma": "no-cache",
      "DNT": "1",
    };
    
    console.log(`Checking URL: ${body.url}`);
    
    // Random timeout to avoid regular patterns
    const timeout = Math.floor(Math.random() * 5000) + 2000;
    await new Promise(resolve => setTimeout(resolve, timeout));
    
    // Make the request
    const response = await fetch(body.url, {
      method: "GET",
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    // Get the HTML content
    const html = await response.text();
    
    // Check if product is in stock using universal indicators
    let isInStock = false;
    let errorMessage = null;
    
    try {
      // First check for specific target text if provided
      if (body.targetText && body.targetText.trim() !== '') {
        isInStock = html.includes(body.targetText);
        console.log(`Custom target text check "${body.targetText}": ${isInStock ? 'found' : 'not found'}`);
      } else {
        // Universal stock check - look for "Add to Cart" text or button
        // Using lowercase for case-insensitive matching
        const lowerHtml = html.toLowerCase();
        
        // Common "Add to Cart" patterns across e-commerce sites
        const inStockPatterns = [
          'add to cart',
          'add to basket',
          'buy now',
          'add to bag',
          'addtocart',
          'add-to-cart',
          'data-button-action="add-to-cart"',
          'class="btn-cart"',
          'class="add-to-cart"'
        ];
        
        // Out of stock indicators
        const outOfStockPatterns = [
          'out of stock',
          'sold out',
          'currently unavailable',
          'not available',
          'out-of-stock',
          'notify me when available',
          'email when available',
          'temporarily out of stock'
        ];
        
        // Check for in-stock patterns
        let foundInStockPattern = false;
        for (const pattern of inStockPatterns) {
          if (lowerHtml.includes(pattern)) {
            foundInStockPattern = true;
            console.log(`Found in-stock pattern: ${pattern}`);
            break;
          }
        }
        
        // Check for out-of-stock patterns
        let foundOutOfStockPattern = false;
        for (const pattern of outOfStockPatterns) {
          if (lowerHtml.includes(pattern)) {
            foundOutOfStockPattern = true;
            console.log(`Found out-of-stock pattern: ${pattern}`);
            break;
          }
        }
        
        // Determine stock status based on patterns found
        if (foundInStockPattern && !foundOutOfStockPattern) {
          isInStock = true;
        } else if (foundOutOfStockPattern) {
          isInStock = false;
        } else if (foundInStockPattern) {
          // If we found in-stock pattern but also out-of-stock pattern, 
          // we'll still consider it in stock but log this ambiguity
          isInStock = true;
          console.log('Found both in-stock and out-of-stock patterns, defaulting to in-stock');
        } else {
          // If no patterns were found, default to out of stock
          isInStock = false;
          console.log('No stock indicators found, defaulting to out-of-stock');
        }
      }
    } catch (e) {
      console.error('Error during stock pattern detection:', e);
      errorMessage = e.message;
      isInStock = false; // Default to out of stock on error
    }
    
    // Update the database with results
    const { error: updateError } = await supabase
      .from("stock_monitors")
      .update({
        last_checked: new Date().toISOString(),
        status: isInStock ? "in-stock" : "out-of-stock",
        html_snapshot: html.substring(0, 10000), // Store partial HTML for verification
        error_message: errorMessage
      })
      .eq("id", body.id);
    
    if (updateError) {
      throw new Error(`Database update error: ${updateError.message}`);
    }
    
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
    console.error("Error checking URL:", error);
    
    // Try to update the database with error status
    try {
      const supabase = createSupabaseClient(req);
      const body = await req.json() as CheckUrlRequest;
      
      if (body && body.id) {
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
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});
