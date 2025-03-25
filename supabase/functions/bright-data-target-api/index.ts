
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

// Create Supabase client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Get the Bright Data Target API token
const BRIGHT_DATA_TARGET_API_TOKEN = Deno.env.get('BRIGHT_DATA_TARGET_API_TOKEN') || '';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Validate API token
    if (!BRIGHT_DATA_TARGET_API_TOKEN) {
      console.error('BRIGHT_DATA_TARGET_API_TOKEN not set in environment variables');
      return new Response(
        JSON.stringify({ success: false, error: 'API token configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Get request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { id, url, monitorName } = requestData;
    console.log(`Received request to check: ${url}`);

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Update the stock_monitors table to indicate check in progress
    if (id) {
      try {
        await supabaseAdmin
          .from('stock_monitors')
          .update({
            status: 'checking',
            last_checked: new Date().toISOString(),
            error_message: null,
          })
          .eq('id', id);
      } catch (error) {
        console.error('Error updating monitor status:', error);
        // Continue with API call even if update fails
      }
    }

    // Prepare the data for Bright Data Target API
    const payload = {
      deliver: {
        type: "s3",
        filename: "[[snapshot_id]]",
        extension: "json"
      },
      urls: [url]
    };

    console.log('Sending request to Bright Data Target API');
    
    // Call Bright Data Target API to collect data
    let response;
    try {
      response = await fetch('https://api.brightdata.com/datasets/v3/trigger', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BRIGHT_DATA_TARGET_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Network error calling Bright Data API:', error);
      
      // Update monitor with error status
      if (id) {
        await supabaseAdmin
          .from('stock_monitors')
          .update({
            status: 'error',
            last_checked: new Date().toISOString(),
            error_message: `Network error: ${error.message}`,
          })
          .eq('id', id);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Network error: ${error.message}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Process API response
    let apiData;
    try {
      apiData = await response.json();
      console.log('Bright Data API response:', apiData);
    } catch (error) {
      console.error('Error parsing Bright Data API response:', error);
      
      // Update monitor with error status
      if (id) {
        await supabaseAdmin
          .from('stock_monitors')
          .update({
            status: 'error',
            last_checked: new Date().toISOString(),
            error_message: `Error parsing API response: ${error.message}`,
          })
          .eq('id', id);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error parsing API response: ${error.message}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!response.ok || !apiData.snapshot_id) {
      const errorMessage = apiData.message || 'Unknown error occurred';
      console.error(`API Error: ${errorMessage}`);
      
      // Update monitor with error status
      if (id) {
        await supabaseAdmin
          .from('stock_monitors')
          .update({
            status: 'error',
            last_checked: new Date().toISOString(),
            error_message: `Bright Data API error: ${errorMessage}`,
          })
          .eq('id', id);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Data collection triggered successfully - get snapshot ID
    const snapshotId = apiData.snapshot_id;
    
    // Store snapshot ID in the database
    if (id) {
      await supabaseAdmin
        .from('stock_monitors')
        .update({
          status: 'pending',
          last_checked: new Date().toISOString(),
          stock_status_reason: `Data collection initiated with snapshot ID: ${snapshotId}`,
        })
        .eq('id', id);
    }

    // Now we need to poll for results
    // Create a job to check results in the background
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('api_job_status')
      .insert({
        job_id: snapshotId,
        source: 'bright-data-target',
        status: 'fetching_data',
        progress: 0,
        total_items: 1,
        completed_items: 0
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
    } else {
      console.log('Created job to monitor Target API data:', jobData);
      
      // Start the background process to check for results
      try {
        EdgeRuntime.waitUntil(checkResultsBackground(snapshotId, id, jobData.id));
      } catch (error) {
        console.error('Error starting background task:', error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Product data collection initiated',
        snapshot_id: snapshotId,
        status: 'pending'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in bright-data-target-api function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Background task to check for Target API results
async function checkResultsBackground(snapshotId: string, monitorId: string | undefined, jobId: string) {
  try {
    // Wait a bit before first check (Target API needs time to collect data)
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    let isComplete = false;
    let attempts = 0;
    const maxAttempts = 20; // 5 minutes max (15s intervals)
    
    while (!isComplete && attempts < maxAttempts) {
      attempts++;
      
      // Update job progress
      try {
        await supabaseAdmin
          .from('api_job_status')
          .update({
            progress: attempts / maxAttempts * 100,
            status: 'fetching_data'
          })
          .eq('id', jobId);
      } catch (updateError) {
        console.error('Error updating job progress:', updateError);
      }
      
      try {
        // Check if results are ready
        const checkResponse = await fetch(`https://api.brightdata.com/datasets/v3/results/${snapshotId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${BRIGHT_DATA_TARGET_API_TOKEN}`
          }
        });
        
        if (checkResponse.ok) {
          const resultData = await checkResponse.json();
          console.log(`Target API Results (Attempt ${attempts}):`, resultData);
          
          if (resultData.state === 'completed') {
            isComplete = true;
            
            // Process Target data to determine stock status
            const inStock = processTargetData(resultData);
            
            // Update monitor with result
            if (monitorId) {
              const status = inStock ? 'in-stock' : 'out-of-stock';
              
              try {
                await supabaseAdmin
                  .from('stock_monitors')
                  .update({
                    status,
                    last_checked: new Date().toISOString(),
                    last_seen_in_stock: inStock ? new Date().toISOString() : undefined,
                    stock_status_reason: `Product ${inStock ? 'is' : 'is not'} in stock according to Target API data`
                  })
                  .eq('id', monitorId);
              } catch (updateError) {
                console.error('Error updating monitor status:', updateError);
              }
            }
            
            // Complete the job
            try {
              await supabaseAdmin
                .from('api_job_status')
                .update({
                  status: 'completed',
                  progress: 100,
                  completed_items: 1,
                  completed_at: new Date().toISOString()
                })
                .eq('id', jobId);
            } catch (updateError) {
              console.error('Error completing job:', updateError);
            }
          } else if (resultData.state === 'failed') {
            isComplete = true;
            
            // Update job status
            try {
              await supabaseAdmin
                .from('api_job_status')
                .update({
                  status: 'failed',
                  error: resultData.error || 'Target API data collection failed',
                  completed_at: new Date().toISOString()
                })
                .eq('id', jobId);
            } catch (updateError) {
              console.error('Error updating job status to failed:', updateError);
            }
              
            // Update monitor status
            if (monitorId) {
              try {
                await supabaseAdmin
                  .from('stock_monitors')
                  .update({
                    status: 'error',
                    error_message: resultData.error || 'Target API data collection failed'
                  })
                  .eq('id', monitorId);
              } catch (updateError) {
                console.error('Error updating monitor status to error:', updateError);
              }
            }
          }
        } else {
          console.error(`Error checking results: ${checkResponse.status}`);
          
          try {
            const errorText = await checkResponse.text();
            console.error('Error response body:', errorText);
          } catch (e) {
            // Ignore error when trying to log error
          }
        }
      } catch (error) {
        console.error('Error polling for results:', error);
      }
      
      if (!isComplete) {
        // Wait 15 seconds before trying again
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    }
    
    // If we exceeded max attempts
    if (!isComplete) {
      // Update job status
      try {
        await supabaseAdmin
          .from('api_job_status')
          .update({
            status: 'failed',
            error: 'Timeout waiting for Target API results',
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId);
      } catch (updateError) {
        console.error('Error updating job status on timeout:', updateError);
      }
        
      // Update monitor status
      if (monitorId) {
        try {
          await supabaseAdmin
            .from('stock_monitors')
            .update({
              status: 'error',
              error_message: 'Timeout waiting for Target API results'
            })
            .eq('id', monitorId);
        } catch (updateError) {
          console.error('Error updating monitor status on timeout:', updateError);
        }
      }
    }
  } catch (error) {
    console.error('Error in result checking background process:', error);
    
    // Update job status
    try {
      await supabaseAdmin
        .from('api_job_status')
        .update({
          status: 'failed',
          error: `Error checking results: ${error.message}`,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
    } catch (updateError) {
      console.error('Error updating job status on exception:', updateError);
    }
      
    // Update monitor status
    if (monitorId) {
      try {
        await supabaseAdmin
          .from('stock_monitors')
          .update({
            status: 'error',
            error_message: `Error checking results: ${error.message}`
          })
          .eq('id', monitorId);
      } catch (updateError) {
        console.error('Error updating monitor status on exception:', updateError);
      }
    }
  }
}

// Process Target data to determine stock status
function processTargetData(resultData: any): boolean {
  try {
    if (!resultData.data || !resultData.data.length) {
      return false;
    }
    
    const productData = resultData.data[0];
    
    // Check if product exists
    if (!productData) {
      return false;
    }
    
    // Debug log the product data
    console.log('Processing product data:', JSON.stringify(productData, null, 2));
    
    // Check for "in stock" indicators (adjust based on actual Target API response structure)
    
    // Check for explicit stock status field
    if (productData.availability && typeof productData.availability === 'string') {
      const availability = productData.availability.toLowerCase();
      if (availability.includes('in stock') || availability.includes('available')) {
        return true;
      }
      if (availability.includes('out of stock') || availability.includes('unavailable')) {
        return false;
      }
    }
    
    // Check shipping options - if shipping is available, usually in stock
    if (productData.shipping_options && productData.shipping_options.length > 0) {
      return true;
    }
    
    // Check "add to cart" button status
    if (productData.add_to_cart_available === true) {
      return true;
    }
    
    // Look at price - if price is shown, often in stock
    if (productData.price && productData.price > 0) {
      return true;
    }
    
    // No clear indicators found
    return false;
  } catch (error) {
    console.error('Error processing Target data:', error);
    return false;
  }
}
