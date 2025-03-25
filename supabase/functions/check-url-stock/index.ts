
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

// Scraper API key
const SCRAPER_API_KEY = '2914c1d8b7396dc054cf2a5a72612576';

Deno.serve(async (req) => {
  try {
    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

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
    
    if (jobResult.response && jobResult.response.body) {
      htmlContent = jobResult.response.body;
      console.log(`Received HTML content (length: ${htmlContent.length})`);
      
      // Check stock status using the HTML content
      status = checkStockStatus(htmlContent, targetText);
      console.log(`Determined stock status: ${status}`);
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
        error_message: errorMessage
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

// Function to check stock status based on HTML content
function checkStockStatus(html: string, targetText?: string): 'in-stock' | 'out-of-stock' | 'unknown' | 'error' {
  try {
    const lowerHtml = html.toLowerCase();
    
    // If target text is provided, check if it exists in the HTML
    if (targetText) {
      const lowerTargetText = targetText.toLowerCase();
      return lowerHtml.includes(lowerTargetText) ? 'in-stock' : 'out-of-stock';
    }
    
    // Check for common out-of-stock indicators
    const outOfStockIndicators = [
      'out of stock',
      'sold out',
      'currently unavailable',
      'no longer available',
      'out-of-stock',
      'not available',
      'cannot be purchased'
    ];
    
    for (const indicator of outOfStockIndicators) {
      if (lowerHtml.includes(indicator)) {
        return 'out-of-stock';
      }
    }
    
    // Check for common in-stock indicators
    const inStockIndicators = [
      'in stock',
      'add to cart',
      'buy now',
      'add to basket',
      'add-to-cart',
      'addtocart'
    ];
    
    for (const indicator of inStockIndicators) {
      if (lowerHtml.includes(indicator)) {
        return 'in-stock';
      }
    }
    
    // If we can't determine, return unknown
    return 'unknown';
  } catch (error) {
    console.error("Error checking stock status:", error);
    return 'error';
  }
}
