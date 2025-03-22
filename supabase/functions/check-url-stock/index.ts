
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
    const body = await req.json() as CheckUrlRequest;
    
    console.log("Received request:", JSON.stringify(body, null, 2));
    
    if (!body || !body.url || !body.id) {
      console.error("Missing required fields in request body");
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
    
    const supabase = createSupabaseClient(req);
    
    // Random user agent selection
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    
    // Randomized headers to avoid patterns
    const headers = {
      "User-Agent": userAgent,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "DNT": "1",
    };
    
    console.log(`Checking URL: ${body.url}`);
    
    // Random timeout to avoid regular patterns (reduced to prevent long waits)
    const timeout = Math.floor(Math.random() * 1000) + 500;
    await new Promise(resolve => setTimeout(resolve, timeout));
    
    // Make the request with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      // Make the request
      const response = await fetch(body.url, {
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
      const html = await response.text();
      
      // Check if product is in stock
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
          
          // Check for disabled buttons which often indicate out-of-stock
          const disabledButtonPatterns = [
            'button[disabled',
            'button disabled',
            'disabled="disabled"',
            'class="disabled',
            'btn disabled',
            'btn-disabled',
            'out-of-stock-button',
            'sold-out-button',
            '<button[^>]*disabled[^>]*>add to cart<\/button>',
            '<button[^>]*disabled[^>]*>buy now<\/button>',
            '<button[^>]*class="[^"]*disabled[^"]*"[^>]*>'
          ];
          
          // Common "Add to Cart" patterns across e-commerce sites
          const inStockPatterns = [
            'add to cart',
            'add to basket',
            'buy now',
            'add-to-cart',
            'in stock',
            'instock',
            'in-stock',
            'available'
          ];
          
          // Out of stock indicators
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
            'temporarily out of stock',
            'pre-order',
            'preorder'
          ];
          
          // Find all buttons in the HTML
          const buttonRegex = /<button[^>]*>(.*?)<\/button>/gis;
          let match;
          let buttons = [];
          
          while ((match = buttonRegex.exec(html)) !== null) {
            buttons.push(match[0].toLowerCase());
          }
          
          // Check if any buttons contain "add to cart" or similar phrases
          let hasInStockButton = false;
          let hasDisabledInStockButton = false;
          
          for (const button of buttons) {
            const isDisabled = disabledButtonPatterns.some(pattern => button.includes(pattern));
            
            // Check if this button has in-stock text
            const hasInStockText = inStockPatterns.some(pattern => button.includes(pattern));
            
            if (hasInStockText) {
              if (isDisabled) {
                hasDisabledInStockButton = true;
                console.log("Found disabled in-stock button:", button);
              } else {
                hasInStockButton = true;
                console.log("Found enabled in-stock button:", button);
              }
            }
          }
          
          // Check for out-of-stock patterns
          const hasOutOfStockText = outOfStockPatterns.some(pattern => lowerHtml.includes(pattern));
          
          // Determine stock status based on patterns found
          if (hasInStockButton && !hasDisabledInStockButton) {
            isInStock = true;
            console.log('Found enabled in-stock button, considering in stock');
          } else if (hasDisabledInStockButton) {
            isInStock = false;
            console.log('Found disabled in-stock button, considering out of stock');
          } else if (hasOutOfStockText) {
            isInStock = false;
            console.log('Found out-of-stock text, considering out of stock');
          } else {
            // If we can't determine, check if ANY in-stock patterns exist in the HTML
            isInStock = inStockPatterns.some(pattern => lowerHtml.includes(pattern));
            console.log(`No clear indicators, found in-stock patterns: ${isInStock}`);
          }
        }
        
        console.log(`Final stock determination: ${isInStock ? 'IN STOCK' : 'OUT OF STOCK'}`);
        
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
          html_snapshot: html.substring(0, 5000), // Store partial HTML for verification (reduced to save space)
          error_message: errorMessage
        })
        .eq("id", body.id);
      
      if (updateError) {
        console.error(`Database update error: ${updateError.message}`);
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
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error:", fetchError);
      throw fetchError;
    }
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
        error: error.message || "An unknown error occurred"
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
