
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

    // Create a User-Agent that looks like a real browser to avoid being blocked
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.google.com/'
    };

    // Fetch the URL content
    const fetchResponse = await fetch(url, { headers });
    const contentType = fetchResponse.headers.get('content-type') || '';
    
    // Process based on content type
    let htmlContent: string;
    let status: 'in-stock' | 'out-of-stock' | 'unknown' | 'error' = 'unknown';
    let errorMessage: string | null = null;
    
    if (contentType.includes('text/html') || contentType.includes('application/xhtml+xml')) {
      htmlContent = await fetchResponse.text();
      
      // Special handling for pokemoncenter.com
      if (url.includes('pokemoncenter.com')) {
        status = await handlePokemonCenter(htmlContent, url);
      } else {
        // Default handling for other sites
        status = checkStockStatus(htmlContent, targetText);
      }
    } else {
      htmlContent = `Non-HTML content: ${contentType}`;
      status = 'error';
      errorMessage = `Unexpected content type: ${contentType}`;
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

// Function to handle Pokemon Center website specifically
async function handlePokemonCenter(html: string, url: string): Promise<'in-stock' | 'out-of-stock' | 'unknown' | 'error'> {
  try {
    console.log("Processing Pokemon Center URL");
    
    // Method 1: Check for common out-of-stock indicators
    const outOfStockPhrases = [
      'out of stock',
      'sold out',
      'currently unavailable',
      'no longer available',
      'out-of-stock',
      'not available',
      'cannot be purchased'
    ];
    
    const lowerHtml = html.toLowerCase();
    
    for (const phrase of outOfStockPhrases) {
      if (lowerHtml.includes(phrase)) {
        console.log(`Found out-of-stock phrase: "${phrase}"`);
        return 'out-of-stock';
      }
    }
    
    // Method 2: Look for JSON data in the HTML that might contain inventory information
    try {
      // Try to extract JSON from script tags
      const jsonDataMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
      if (jsonDataMatches) {
        for (const match of jsonDataMatches) {
          try {
            const jsonContent = match.replace(/<script type="application\/ld\+json">/, '')
                                     .replace(/<\/script>/, '')
                                     .trim();
            const data = JSON.parse(jsonContent);
            console.log("Found JSON data in script tag:", JSON.stringify(data).substring(0, 200) + "...");
            
            // Check for availability information
            if (data.offers && data.offers.availability) {
              const availability = data.offers.availability.toLowerCase();
              if (availability.includes('instock') || availability.includes('in_stock')) {
                console.log("Product marked as in stock in JSON data");
                return 'in-stock';
              } else if (availability.includes('outofstock') || availability.includes('out_of_stock')) {
                console.log("Product marked as out of stock in JSON data");
                return 'out-of-stock';
              }
            }
          } catch (e) {
            console.log("Error parsing JSON from script tag:", e);
          }
        }
      }
    } catch (e) {
      console.log("Error extracting JSON data:", e);
    }

    // Method 3: Check for add to cart button being enabled
    const addToCartButtonExists = lowerHtml.includes('add to cart') || 
                                 lowerHtml.includes('add-to-cart') ||
                                 lowerHtml.includes('addtocart');
    
    // If we find disabled add to cart buttons, it's likely out of stock
    if (lowerHtml.includes('disabled') && addToCartButtonExists) {
      console.log("Found disabled add to cart button");
      return 'out-of-stock';
    }
    
    // If we find enabled add to cart buttons, it's likely in stock
    if (addToCartButtonExists && !lowerHtml.includes('disabled class="add-to-cart"') && 
        !lowerHtml.includes('button disabled') && !lowerHtml.includes('disabled button')) {
      console.log("Found enabled add to cart button");
      return 'in-stock';
    }

    // Method 4: Make a direct API call to the product API
    try {
      // Extract product ID from URL
      const productId = url.split('/').pop();
      if (productId) {
        console.log(`Extracted product ID: ${productId}`);
        const apiUrl = `https://www.pokemoncenter.com/api/products/${productId}`;
        const apiResponse = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        if (apiResponse.ok) {
          const productData = await apiResponse.json();
          console.log("API response:", JSON.stringify(productData).substring(0, 200) + "...");
          
          // Check stock status
          if (productData.stock && productData.stock.stockLevel) {
            if (productData.stock.stockLevel > 0 || productData.stock.stockLevel === "IN_STOCK") {
              console.log("Product in stock according to API");
              return 'in-stock';
            } else {
              console.log("Product out of stock according to API");
              return 'out-of-stock';
            }
          }
        } else {
          console.log(`API request failed with status: ${apiResponse.status}`);
        }
      }
    } catch (e) {
      console.log("Error making API request:", e);
    }

    // If we've reached this point and we found add to cart buttons, 
    // we'll assume it's in stock since Pokemon Center usually clearly marks out of stock items
    if (addToCartButtonExists) {
      console.log("Found add to cart button, assuming in stock");
      return 'in-stock';
    }
    
    // If we can't determine, return unknown
    console.log("Could not determine stock status for Pokemon Center");
    return 'unknown';
  } catch (error) {
    console.error("Error processing Pokemon Center URL:", error);
    return 'error';
  }
}

// Function to check stock status for general websites
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
      'not available'
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
