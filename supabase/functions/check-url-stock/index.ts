
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

// Get Scraper API key from environment variable
const SCRAPER_API_KEY = Deno.env.get('SCRAPER_API_KEY') || '';

Deno.serve(async (req) => {
  try {
    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    // Validate Scraper API key
    if (!SCRAPER_API_KEY) {
      console.error('SCRAPER_API_KEY environment variable not set');
      return new Response(
        JSON.stringify({ success: false, error: 'API key configuration error' }),
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

    // Log the API key being used (only the last 4 characters for security)
    const keyLastFour = SCRAPER_API_KEY.slice(-4);
    console.log(`Using Scraper API key ending with: ${keyLastFour}`);

    // Submit async job to Scraper API
    console.log(`Submitting async job to Scraper API for URL: ${url}`);
    const asyncJobResponse = await fetch('https://async.scraperapi.com/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: SCRAPER_API_KEY,
        url: url,
        apiParams: {
          render: true,
        }
      })
    });
    
    if (!asyncJobResponse.ok) {
      const errorText = await asyncJobResponse.text();
      console.error(`Scraper API Error (${asyncJobResponse.status}): ${errorText}`);
      
      // Update the stock_monitors table with error
      if (id) {
        await supabaseAdmin
          .from('stock_monitors')
          .update({
            status: 'error',
            last_checked: new Date().toISOString(),
            error_message: `Failed to submit async job: ${errorText.substring(0, 500)}`,
            html_snapshot: `Error: ${errorText.substring(0, 1000)}`
          })
          .eq('id', id);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: 'error',
          error: `Scraper API error: ${asyncJobResponse.status}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const jobData = await asyncJobResponse.json();
    console.log(`Async job submitted successfully: ${JSON.stringify(jobData, null, 2)}`);
    
    // Poll for job completion (with timeout)
    let jobResult = null;
    let attempts = 0;
    const maxAttempts = 10; // Max polling attempts
    
    // Update the monitor to "checking" status
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
    
    // Poll for result with exponential backoff
    while (attempts < maxAttempts) {
      console.log(`Polling job status, attempt ${attempts + 1}/${maxAttempts}`);
      attempts++;
      
      // Wait before polling (exponential backoff)
      const waitTime = Math.min(2000 * Math.pow(1.5, attempts), 10000); // Cap at 10 seconds
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      const statusResponse = await fetch(jobData.statusUrl);
      if (!statusResponse.ok) {
        console.error(`Error checking job status: ${statusResponse.status}`);
        continue;
      }
      
      const statusData = await statusResponse.json();
      console.log(`Job status: ${statusData.status}`);
      
      if (statusData.status === 'finished') {
        jobResult = statusData;
        break;
      }
      
      if (statusData.status === 'failed') {
        console.error(`Job failed: ${JSON.stringify(statusData)}`);
        break;
      }
    }
    
    if (!jobResult) {
      console.error('Job timed out or failed');
      
      // Update the stock_monitors table with timeout error
      if (id) {
        await supabaseAdmin
          .from('stock_monitors')
          .update({
            status: 'error',
            last_checked: new Date().toISOString(),
            error_message: 'Scraper job timed out or failed',
            html_snapshot: 'Error: Scraper job timed out or failed'
          })
          .eq('id', id);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: 'error',
          error: 'Scraper job timed out or failed' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Process the result
    let htmlContent = '';
    let status: 'in-stock' | 'out-of-stock' | 'unknown' | 'error' = 'unknown';
    let errorMessage: string | null = null;
    let stockStatusReason: string | null = null;
    
    if (jobResult.response && jobResult.response.body) {
      htmlContent = jobResult.response.body;
      console.log(`Received HTML content (length: ${htmlContent.length})`);
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
      htmlContent = `Failed to get content: ${JSON.stringify(jobResult)}`;
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
    let status: 'in-stock' | 'out-of-stock' | 'unknown' | 'error' = 'unknown';
    let reason: string | null = null;

    // For Target.com, we need specific handling
    if (domain.includes('target.com')) {
      return checkTargetStock(html, lowerHtml, targetText);
    }
    
    // If target text is provided and found, use it as the primary indicator
    if (targetText && lowerHtml.includes(targetText.toLowerCase())) {
      console.log(`Found target text: "${targetText}"`);
      reason = `Custom target text: "${targetText}" was found`;
      status = 'in-stock';
      return { status, reason };
    }
    
    // Generic checks for all other sites
    
    // Check for common out-of-stock indicators
    const outOfStockIndicators = [
      'out of stock',
      'sold out',
      'currently unavailable',
      'no longer available',
      'out-of-stock',
      'not available',
      'cannot be purchased',
      'back in stock soon',
      'coming soon'
    ];
    
    for (const indicator of outOfStockIndicators) {
      if (lowerHtml.includes(indicator)) {
        status = 'out-of-stock';
        reason = `Found out-of-stock indicator: "${indicator}"`;
        return { status, reason };
      }
    }
    
    // Check for common in-stock indicators
    const inStockIndicators = [
      'in stock',
      'add to cart',
      'buy now',
      'add to basket',
      'add-to-cart',
      'addtocart',
      'available for purchase',
      'available now'
    ];
    
    for (const indicator of inStockIndicators) {
      if (lowerHtml.includes(indicator)) {
        status = 'in-stock';
        reason = `Found in-stock indicator: "${indicator}"`;
        return { status, reason };
      }
    }
    
    // If we can't determine, return unknown
    return { status: 'unknown', reason: 'No clear stock indicators found' };
  } catch (error) {
    console.error("Error checking stock status:", error);
    return { 
      status: 'error', 
      reason: `Error analyzing page: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

// Specific function to check Target.com stock status
function checkTargetStock(originalHtml: string, lowerHtml: string, targetText?: string): StockCheckResult {
  console.log("Running improved Target.com specific stock check...");
  
  // Debug: Log all possible stock indicators
  const debugKeywords = ["qty", "quantity", "in stock", "out of stock", "add to cart", "shipping", "pickup"];
  debugKeywords.forEach(keyword => {
    if (lowerHtml.includes(keyword)) {
      console.log(`DEBUG: Found keyword "${keyword}" in the HTML`);
    } else {
      console.log(`DEBUG: Keyword "${keyword}" NOT found in the HTML`);
    }
  });
  
  // Check for explicit "in stock" text which is the strongest indicator
  if (lowerHtml.includes('in stock at') || 
      lowerHtml.includes('in stock online') || 
      lowerHtml.includes('in store stock')) {
    return { 
      status: 'in-stock', 
      reason: 'Target.com: Found explicit "in stock" text' 
    };
  }
  
  // Check for explicit "out of stock" text
  if (lowerHtml.includes('out of stock online') || 
      lowerHtml.includes('out of stock at') || 
      lowerHtml.includes('sold out') || 
      lowerHtml.includes('temporarily out of stock')) {
    return { 
      status: 'out-of-stock', 
      reason: 'Target.com: Found explicit "out of stock" text' 
    };
  }
  
  // Check if "Add to cart" button is enabled
  if (lowerHtml.includes('add to cart')) {
    // Check if it's disabled - disabled buttons usually have specific classes or attributes
    if ((lowerHtml.includes('disabled') && lowerHtml.includes('add to cart')) ||
        lowerHtml.includes('btn disabled') ||
        lowerHtml.includes('button disabled') ||
        lowerHtml.includes('button-disabled') ||
        lowerHtml.includes('class="disabled')) {
      return { 
        status: 'out-of-stock', 
        reason: 'Target.com: "Add to Cart" button appears to be disabled' 
      };
    }
    
    // If we found "add to cart" and it doesn't appear to be disabled
    // let's check for delivery options as additional confirmation
    if (lowerHtml.includes('shipping') && 
       (lowerHtml.includes('get it by') || lowerHtml.includes('arrives by'))) {
      return { 
        status: 'in-stock', 
        reason: 'Target.com: "Add to Cart" button is enabled and shipping is available' 
      };
    }
    
    // If we have "add to cart" but no clear shipping indicators, still consider it in stock
    return { 
      status: 'in-stock', 
      reason: 'Target.com: "Add to Cart" button appears to be enabled' 
    };
  }
  
  // Check for both "qty" and "quantity" more aggressively
  // Let's try different case variations and surrounding text patterns
  const qtyPatterns = ['qty', 'Qty', 'QTY', 'quantity', 'Quantity', 'QUANTITY'];
  let foundQtyPattern = false;
  let qtyText = '';
  
  for (const pattern of qtyPatterns) {
    if (originalHtml.includes(pattern)) {
      foundQtyPattern = true;
      qtyText = pattern;
      console.log(`Found quantity indicator: "${pattern}"`);
      break;
    }
  }
  
  if (foundQtyPattern) {
    // If quantity selector exists, check if it's disabled
    if (lowerHtml.includes('disabled') && 
       (lowerHtml.includes(qtyText.toLowerCase()) || lowerHtml.includes('add to cart'))) {
      return { 
        status: 'out-of-stock', 
        reason: `Target.com: "${qtyText}" selector appears to be disabled` 
      };
    }
    
    // If quantity selector exists and doesn't appear disabled, it's likely in stock
    return { 
      status: 'in-stock', 
      reason: `Target.com: "${qtyText}" selector is present and appears to be enabled` 
    };
  }
  
  // Check for delivery/pickup options as independent indicators
  if (lowerHtml.includes('shipping') || lowerHtml.includes('delivery')) {
    // Check for specific shipping date information
    if (lowerHtml.includes('get it by') || 
        lowerHtml.includes('arrives by') || 
        lowerHtml.includes('delivery as soon as')) {
      return { 
        status: 'in-stock', 
        reason: 'Target.com: Product has shipping/delivery options with dates' 
      };
    }
    
    // Check for shipping not available message
    if (lowerHtml.includes('shipping not available') || 
        lowerHtml.includes('delivery not available')) {
      return { 
        status: 'out-of-stock', 
        reason: 'Target.com: Shipping/delivery is not available' 
      };
    }
  }
  
  // Check for store pickup options
  if (lowerHtml.includes('pickup')) {
    if (lowerHtml.includes('pickup not available') || 
        lowerHtml.includes('not available for pickup')) {
      return { 
        status: 'out-of-stock', 
        reason: 'Target.com: Store pickup is not available' 
      };
    }
    
    if (lowerHtml.includes('ready within') || 
        lowerHtml.includes('pick up today') || 
        lowerHtml.includes('pick up by')) {
      return { 
        status: 'in-stock', 
        reason: 'Target.com: Store pickup is available with timeframe' 
      };
    }
  }
  
  // Check for "only X left" or similar limited quantity indicators
  const stockCountRegex = /only\s+(\d+)\s+left|(\d+)\s+items?\s+left/i;
  const stockCountMatch = lowerHtml.match(stockCountRegex);
  if (stockCountMatch) {
    return { 
      status: 'in-stock', 
      reason: `Target.com: Limited quantity available - "${stockCountMatch[0]}"` 
    };
  }
  
  // Check for "Check stores" which often indicates online out-of-stock
  if (lowerHtml.includes('check stores') && !lowerHtml.includes('add to cart')) {
    return {
      status: 'out-of-stock',
      reason: 'Target.com: "Check stores" indicator without "Add to cart" option'
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
  
  // Look for common Target stock messages that might be easily missed
  if (lowerHtml.includes('on its way') ||
      lowerHtml.includes('ready within') ||
      lowerHtml.includes('buy it now')) {
    return {
      status: 'in-stock',
      reason: 'Target.com: Found positive availability message'
    };
  }
  
  // If we can't determine with certainty
  return { 
    status: 'unknown', 
    reason: 'Target.com: Could not determine stock status from page content with confidence' 
  };
}
