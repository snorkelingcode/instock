
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

    // If target text is provided and found, use it as the primary indicator
    if (targetText && lowerHtml.includes(targetText.toLowerCase())) {
      console.log(`Found target text: "${targetText}"`);
      reason = `Custom target text: "${targetText}" was found`;
      
      // For Target.com, we need additional checks since "Add to cart" appears even for out-of-stock items
      if (domain.includes('target.com')) {
        // Check for Target-specific out-of-stock indicators even if target text was found
        if (lowerHtml.includes('out of stock online') || 
            lowerHtml.includes('out of stock at') || 
            lowerHtml.includes('sold out') || 
            lowerHtml.includes('temporarily out of stock')) {
          status = 'out-of-stock';
          reason = 'Found "out of stock" indicators on Target.com';
          console.log('Target.com specific: Found out-of-stock indicators');
          return { status, reason };
        }
        
        // Check if the "Add to Cart" button is disabled
        if (lowerHtml.includes('disabled') && lowerHtml.includes('add to cart')) {
          status = 'out-of-stock';
          reason = 'Target.com: "Add to Cart" button is disabled';
          console.log('Target.com specific: Add to Cart button is disabled');
          return { status, reason };
        }
        
        // Look for shipping availability indicators
        if (lowerHtml.includes('shipping not available')) {
          status = 'out-of-stock';
          reason = 'Target.com: "Shipping not available" was found';
          console.log('Target.com specific: Shipping not available');
          return { status, reason };
        }
        
        // Check for positive in-stock indicators for Target
        if ((lowerHtml.includes('shipping') && lowerHtml.includes('get it by')) || 
            (lowerHtml.includes('pickup') && !lowerHtml.includes('not available'))) {
          status = 'in-stock';
          reason = 'Target.com: Found positive in-stock indicators (shipping/pickup available)';
          console.log('Target.com specific: Found positive in-stock indicators');
          return { status, reason };
        }
        
        // Default to unknown for Target.com if no clear indicators
        status = 'unknown';
        reason = 'Target.com: Contradictory or unclear stock indicators';
        return { status, reason };
      }
      
      // For other sites, finding the target text is sufficient
      status = 'in-stock';
      return { status, reason };
    }
    
    // Domain-specific checks
    if (domain.includes('target.com')) {
      // Check for out-of-stock indicators for Target
      if (lowerHtml.includes('out of stock online') || 
          lowerHtml.includes('out of stock at') || 
          lowerHtml.includes('sold out') || 
          lowerHtml.includes('temporarily out of stock')) {
        status = 'out-of-stock';
        reason = 'Target.com: Found "out of stock" text';
        return { status, reason };
      }
      
      // Check for "Add to Cart" button
      if (lowerHtml.includes('add to cart')) {
        // Check if it's disabled
        if (lowerHtml.includes('disabled') && lowerHtml.includes('add to cart')) {
          status = 'out-of-stock';
          reason = 'Target.com: "Add to Cart" button is disabled';
          return { status, reason };
        }
        
        // Check for shipping availability
        if (lowerHtml.includes('shipping') && lowerHtml.includes('get it by')) {
          status = 'in-stock';
          reason = 'Target.com: Product appears to be shippable';
          return { status, reason };
        }
        
        // Check for store pickup availability
        if (lowerHtml.includes('pickup') && !lowerHtml.includes('not available')) {
          status = 'in-stock';
          reason = 'Target.com: Product appears to be available for pickup';
          return { status, reason };
        }
        
        // Couldn't determine clearly for Target
        status = 'unknown';
        reason = 'Target.com: Found "Add to Cart" but couldn't determine availability clearly';
        return { status, reason };
      }
    }
    
    // Generic checks for all other sites if no domain-specific logic applied
    
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
