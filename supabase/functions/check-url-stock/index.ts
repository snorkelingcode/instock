
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Set up CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Handle CORS preflight requests
const handleCors = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
};

// Create Supabase client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Get Bright Data credentials from environment variables
const BRIGHT_DATA_USERNAME = Deno.env.get('BRIGHT_DATA_USERNAME') || '';
const BRIGHT_DATA_PASSWORD = Deno.env.get('BRIGHT_DATA_PASSWORD') || '';
const BRIGHT_DATA_ZONE = Deno.env.get('BRIGHT_DATA_ZONE') || 'unlocker';

Deno.serve(async (req) => {
  try {
    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    // Validate Bright Data credentials
    if (!BRIGHT_DATA_USERNAME || !BRIGHT_DATA_PASSWORD) {
      console.error('BRIGHT_DATA credentials not set in environment variables');
      return new Response(
        JSON.stringify({ success: false, error: 'API credentials configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Get request body
    const { id, url, targetText } = await req.json();
    console.log(`Received request: ${JSON.stringify({ id, url, targetText }, null, 2)}`);
    
    // Validate input
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Update the stock_monitors table to indicate check in progress
    if (id) {
      await supabaseAdmin
        .from('stock_monitors')
        .update({
          status: 'checking',
          last_checked: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', id);
    }

    // Format auth for Bright Data
    const auth = btoa(`${BRIGHT_DATA_USERNAME}:${BRIGHT_DATA_PASSWORD}`);
    
    // Build proxy URL for Bright Data Web Unlocker
    const proxyUrl = `https://brd.superproxy.io:22225`;
    
    // Set the proxy agent options for fetch
    const proxyOptions = {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    };

    // Create the special Bright Data URL with desired parameters
    const brightDataUrl = new URL(proxyUrl);
    brightDataUrl.searchParams.append('url', url);
    brightDataUrl.searchParams.append('zone', BRIGHT_DATA_ZONE);
    brightDataUrl.searchParams.append('render', 'true');
    brightDataUrl.searchParams.append('wait_for', '2000');

    console.log(`Fetching URL through Bright Data: ${url}`);
    
    const response = await fetch(brightDataUrl.toString(), proxyOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Bright Data Error (${response.status}): ${errorText}`);
      
      // Update the stock_monitors table with error
      if (id) {
        await supabaseAdmin
          .from('stock_monitors')
          .update({
            status: 'error',
            last_checked: new Date().toISOString(),
            error_message: `Failed to fetch: ${errorText.substring(0, 500)}`,
            html_snapshot: `Error: ${errorText.substring(0, 1000)}`
          })
          .eq('id', id);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: 'error',
          error: `Fetch error: ${response.status}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Get HTML content
    const htmlContent = await response.text();
    console.log(`Received HTML content (length: ${htmlContent.length})`);
    
    // Process the result
    let status: 'in-stock' | 'out-of-stock' | 'unknown' | 'error' = 'unknown';
    let errorMessage: string | null = null;
    let stockStatusReason: string | null = null;
    
    if (htmlContent) {
      console.log(`Analyzing HTML content for stock status`);
      
      // Extract domain from URL for site-specific checks
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Check stock status using the HTML content with domain-specific logic
      const result = checkStockStatus(htmlContent, domain, targetText);
      status = result.status;
      stockStatusReason = result.reason;
      console.log(`Determined stock status: ${status}, reason: ${stockStatusReason}`);
    } else {
      status = 'error';
      errorMessage = 'Failed to get page content';
      console.error(errorMessage);
    }

    // Update the stock_monitors table with the result
    if (id) {
      const { error: updateError } = await supabaseAdmin
        .from('stock_monitors')
        .update({
          status,
          last_checked: new Date().toISOString(),
          error_message: errorMessage,
          stock_status_reason: stockStatusReason,
          html_snapshot: htmlContent.substring(0, 100000) // Limit to prevent exceeding column size
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating stock monitor:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // Return result
    return new Response(
      JSON.stringify({ 
        success: true, 
        status,
        checked_at: new Date().toISOString(),
        error_message: errorMessage,
        stockStatusReason
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-url-stock function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

interface StockCheckResult {
  status: 'in-stock' | 'out-of-stock' | 'unknown' | 'error';
  reason: string | null;
}

// Function to check stock status based on HTML content with domain-specific logic
function checkStockStatus(html: string, domain: string, targetText?: string): StockCheckResult {
  try {
    const lowerHtml = html.toLowerCase();
    
    // Special debug logging for development
    console.log(`Checking stock status for domain: ${domain}`);
    
    // For Target.com, we need specific handling
    if (domain.includes('target.com')) {
      return checkTargetStock(html, lowerHtml, targetText);
    }
    
    // If target text is provided and found, use it as the primary indicator
    if (targetText && lowerHtml.includes(targetText.toLowerCase())) {
      console.log(`Found target text: "${targetText}"`);
      return { 
        status: 'in-stock', 
        reason: `Custom target text: "${targetText}" was found` 
      };
    }
    
    // Generic checks for all other sites
    
    // Check for common out-of-stock indicators
    const outOfStockIndicators = [
      'out of stock',
      'out-of-stock',
      'sold out',
      'currently unavailable',
      'no longer available',
      'not available',
      'cannot be purchased',
      'back in stock soon',
      'coming soon',
      'temporarily out of stock',
      'temporarily unavailable'
    ];
    
    for (const indicator of outOfStockIndicators) {
      if (lowerHtml.includes(indicator)) {
        return { 
          status: 'out-of-stock', 
          reason: `Found out-of-stock indicator: "${indicator}"` 
        };
      }
    }
    
    // Check for common in-stock indicators
    const inStockIndicators = [
      'in stock',
      'in-stock',
      'add to cart',
      'add-to-cart',
      'buy now',
      'add to basket',
      'addtocart',
      'available for purchase',
      'available now',
      'get it by'
    ];
    
    for (const indicator of inStockIndicators) {
      if (lowerHtml.includes(indicator)) {
        return { 
          status: 'in-stock', 
          reason: `Found in-stock indicator: "${indicator}"` 
        };
      }
    }
    
    // Check for price or quantity selectors which typically indicate in-stock
    if ((lowerHtml.includes('price') || lowerHtml.includes('$')) && 
        (lowerHtml.includes('quantity') || lowerHtml.includes('qty'))) {
      return {
        status: 'in-stock',
        reason: 'Found price and quantity selectors'
      };
    }
    
    // If we can't determine, return unknown
    return { 
      status: 'unknown', 
      reason: 'No clear stock indicators found' 
    };
  } catch (error) {
    console.error("Error checking stock status:", error);
    return { 
      status: 'error', 
      reason: `Error analyzing page: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

// Specific function to check Target.com stock status with enhanced detection
function checkTargetStock(originalHtml: string, lowerHtml: string, targetText?: string): StockCheckResult {
  console.log("Running Target.com specific stock check...");
  
  // Log key HTML sections for debugging
  const extractAndLogSection = (startMarker: string, endMarker: string, label: string) => {
    try {
      if (lowerHtml.includes(startMarker)) {
        const startIdx = lowerHtml.indexOf(startMarker);
        const endIdx = lowerHtml.indexOf(endMarker, startIdx);
        if (startIdx >= 0 && endIdx > startIdx) {
          const section = lowerHtml.substring(startIdx, endIdx + endMarker.length);
          console.log(`Found ${label} section (${section.length} chars)`);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.log(`Error extracting ${label} section:`, e);
      return false;
    }
  };
  
  // Log key sections for better debugging
  extractAndLogSection('<button', '</button>', 'button');
  extractAndLogSection('add to cart', '</button>', 'add to cart button');
  extractAndLogSection('class="h-full pb-', '</div>', 'shipping section');
  extractAndLogSection('shipping', '</div>', 'shipping text');
  
  // First check if the original HTML contains JSON-LD data
  const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  const jsonMatches = [...originalHtml.matchAll(jsonLdRegex)];
  
  for (const match of jsonMatches) {
    try {
      const jsonData = JSON.parse(match[1]);
      
      // Check if it contains product information with stock status
      if (jsonData && jsonData['@type'] === 'Product') {
        console.log("Found Product JSON-LD data");
        
        if (jsonData.offers && jsonData.offers.availability) {
          const availability = jsonData.offers.availability;
          console.log(`Found availability in JSON-LD: ${availability}`);
          
          if (availability.includes('InStock')) {
            return { 
              status: 'in-stock', 
              reason: 'Target.com: Product JSON-LD indicates in stock' 
            };
          } else if (availability.includes('OutOfStock')) {
            return { 
              status: 'out-of-stock', 
              reason: 'Target.com: Product JSON-LD indicates out of stock' 
            };
          }
        }
      }
    } catch (e) {
      console.log("Error parsing JSON-LD:", e);
    }
  }
  
  // Check for explicit "in stock" text in different variations
  const inStockPhrases = [
    'in stock at',
    'in stock online',
    'in store stock',
    'get it by',
    'get it as soon as',
    'shipping',
    'delivery',
    'pick up at'
  ];
  
  for (const phrase of inStockPhrases) {
    if (lowerHtml.includes(phrase)) {
      console.log(`Found in-stock phrase: "${phrase}"`);
      
      // Check if this phrase is accompanied by a negative term
      const nearText = lowerHtml.substring(
        Math.max(0, lowerHtml.indexOf(phrase) - 50),
        Math.min(lowerHtml.length, lowerHtml.indexOf(phrase) + phrase.length + 50)
      );
      
      if (!nearText.includes('not available') && 
          !nearText.includes('unavailable') && 
          !nearText.includes('out of stock')) {
        return { 
          status: 'in-stock', 
          reason: `Target.com: Found "${phrase}" text` 
        };
      }
    }
  }
  
  // Check for out-of-stock phrases
  const outOfStockPhrases = [
    'out of stock online',
    'out of stock at',
    'sold out',
    'temporarily out of stock',
    'not available',
    'unavailable',
    'shipping not available',
    'pickup not available'
  ];
  
  for (const phrase of outOfStockPhrases) {
    if (lowerHtml.includes(phrase)) {
      console.log(`Found out-of-stock phrase: "${phrase}"`);
      return { 
        status: 'out-of-stock', 
        reason: `Target.com: Found "${phrase}" text` 
      };
    }
  }
  
  // Look specifically for the add to cart button
  const addToCartIndex = lowerHtml.indexOf('add to cart');
  if (addToCartIndex !== -1) {
    // Extract the button HTML
    const buttonStart = lowerHtml.lastIndexOf('<button', addToCartIndex);
    const buttonEnd = lowerHtml.indexOf('</button>', addToCartIndex) + 9;
    
    if (buttonStart !== -1 && buttonEnd !== -1) {
      const buttonHtml = lowerHtml.substring(buttonStart, buttonEnd);
      console.log(`Found add to cart button: ${buttonHtml.length} chars`);
      
      // Check if the button is disabled
      if (buttonHtml.includes('disabled') || 
          buttonHtml.includes('aria-disabled="true"') ||
          buttonHtml.includes('btn-disabled')) {
        return { 
          status: 'out-of-stock', 
          reason: 'Target.com: "Add to Cart" button is disabled' 
        };
      } else {
        return { 
          status: 'in-stock', 
          reason: 'Target.com: "Add to Cart" button is enabled' 
        };
      }
    }
  }
  
  // Check for quantity selector
  const quantitySelectors = [
    'quantity',
    'qty',
    'data-test="spinbox"'
  ];
  
  for (const selector of quantitySelectors) {
    if (lowerHtml.includes(selector)) {
      console.log(`Found quantity selector: "${selector}"`);
      
      // Get surrounding context
      const selectorIndex = lowerHtml.indexOf(selector);
      const surroundingText = lowerHtml.substring(
        Math.max(0, selectorIndex - 100),
        Math.min(lowerHtml.length, selectorIndex + 100)
      );
      
      // Check if disabled
      if (surroundingText.includes('disabled')) {
        return { 
          status: 'out-of-stock', 
          reason: `Target.com: Quantity selector is disabled` 
        };
      } else {
        return { 
          status: 'in-stock', 
          reason: `Target.com: Quantity selector is present and enabled` 
        };
      }
    }
  }
  
  // Check for shipping options section
  if (lowerHtml.includes('shipping')) {
    if (lowerHtml.includes('shipping not available')) {
      return { 
        status: 'out-of-stock', 
        reason: 'Target.com: Shipping is not available' 
      };
    }
    
    if (lowerHtml.includes('ready within') || 
        lowerHtml.includes('arrives by') || 
        lowerHtml.includes('get it by')) {
      return { 
        status: 'in-stock', 
        reason: 'Target.com: Shipping/Delivery date is available' 
      };
    }
  }
  
  // Check for Target's specific "only X left" indicators
  const limitedStockRegex = /only\s+(\d+)\s+left|(\d+)\s+items?\s+left/i;
  const limitedStockMatch = lowerHtml.match(limitedStockRegex);
  if (limitedStockMatch) {
    return { 
      status: 'in-stock', 
      reason: `Target.com: Limited quantity available - "${limitedStockMatch[0]}"` 
    };
  }
  
  // Check for purchase limit indicators which typically only appear for in-stock items
  if (lowerHtml.includes('limit') && 
     (lowerHtml.includes('per order') || lowerHtml.includes('per household'))) {
    return {
      status: 'in-stock',
      reason: 'Target.com: Purchase limit indicator found (typically only shown for in-stock items)'
    };
  }
  
  // If the target text was specifically requested and found
  if (targetText && lowerHtml.includes(targetText.toLowerCase())) {
    return { 
      status: 'in-stock', 
      reason: `Target.com: Found target text "${targetText}"` 
    };
  }
  
  // Additional Target-specific checks for the product page HTML structure
  if (lowerHtml.includes('fulfillment-fulfillment-shipping')) {
    return {
      status: 'in-stock',
      reason: 'Target.com: Shipping fulfillment options are displayed'
    };
  }
  
  // Check for "check stores" without "add to cart" which likely indicates out of stock online
  if (lowerHtml.includes('check stores') && !lowerHtml.includes('add to cart')) {
    return {
      status: 'out-of-stock',
      reason: 'Target.com: "Check stores" indicator without "Add to cart" option'
    };
  }
  
  // If we can't determine with certainty, but the page loaded
  if (lowerHtml.includes('target.com') && lowerHtml.length > 10000) {
    // If the page is a product page but we couldn't find clear stock status
    if (lowerHtml.includes('product details') || lowerHtml.includes('product features')) {
      // Check for product price - if price is shown prominently it's often in stock
      if (lowerHtml.includes('current price $')) {
        return {
          status: 'in-stock',
          reason: 'Target.com: Product page shows current price'
        };
      }
    }
  }
  
  // If we've gone through all checks and can't determine
  return { 
    status: 'unknown', 
    reason: 'Target.com: Could not determine stock status from page content with confidence' 
  };
}
