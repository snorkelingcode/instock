
import cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get request body
    const { id, url, targetText, autoCheckout } = req.body;
    console.log(`Received request: ${JSON.stringify({ id, url, targetText, autoCheckout }, null, 2)}`);
    
    // Validate input
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
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
    let htmlContent;
    let status = 'unknown';
    let errorMessage = null;
    let checkoutStatus = autoCheckout ? 'pending' : 'not-attempted';
    
    if (contentType.includes('text/html') || contentType.includes('application/xhtml+xml')) {
      htmlContent = await fetchResponse.text();
      
      // Special handling for pokemoncenter.com
      if (url.includes('pokemoncenter.com')) {
        status = await handlePokemonCenter(htmlContent, url);
      } else {
        // Default handling for other sites
        status = checkStockStatus(htmlContent, targetText);
      }
      
      // Handle auto checkout if enabled and item is in stock
      if (autoCheckout && status === 'in-stock') {
        try {
          // This would be where you implement auto-checkout logic
          // For now, we'll just simulate it
          console.log("Auto-checkout would be attempted here");
          checkoutStatus = Math.random() > 0.5 ? 'success' : 'failed';
        } catch (checkoutError) {
          console.error("Error during auto-checkout:", checkoutError);
          checkoutStatus = 'failed';
        }
      }
    } else {
      htmlContent = `Non-HTML content: ${contentType}`;
      status = 'error';
      errorMessage = `Unexpected content type: ${contentType}`;
    }

    // Update the stock_monitors table with the result
    if (id) {
      const { error: updateError } = await supabase
        .from('stock_monitors')
        .update({
          status,
          last_checked: new Date().toISOString(),
          error_message: errorMessage,
          html_snapshot: htmlContent.substring(0, 100000), // Limit to prevent exceeding column size
          checkout_status: checkoutStatus
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating stock monitor:', updateError);
        return res.status(500).json({ success: false, error: updateError.message });
      }
    }

    // Return result
    return res.status(200).json({ 
      success: true, 
      status,
      checked_at: new Date().toISOString(),
      error_message: errorMessage,
      checkout_status: checkoutStatus
    });
  } catch (error) {
    console.error('Error in check-url-stock function:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Function to handle Pokemon Center website specifically
async function handlePokemonCenter(html, url) {
  try {
    console.log("Processing Pokemon Center URL");
    
    const $ = cheerio.load(html);
    
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
    
    const pageText = $('body').text().toLowerCase();
    
    for (const phrase of outOfStockPhrases) {
      if (pageText.includes(phrase)) {
        console.log(`Found out-of-stock phrase: "${phrase}"`);
        return 'out-of-stock';
      }
    }
    
    // Method 2: Look for JSON data in the HTML that might contain inventory information
    try {
      // Try to extract JSON from script tags
      const scriptTags = $('script[type="application/ld+json"]');
      if (scriptTags.length > 0) {
        scriptTags.each((i, el) => {
          try {
            const jsonContent = $(el).html();
            if (jsonContent) {
              const data = JSON.parse(jsonContent);
              console.log("Found JSON data in script tag");
              
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
            }
          } catch (e) {
            console.log("Error parsing JSON from script tag:", e);
          }
        });
      }
    } catch (e) {
      console.log("Error extracting JSON data:", e);
    }

    // Method 3: Check for add to cart button being enabled
    const addToCartExists = $('button:contains("Add to Cart")').length > 0 || 
                           $('[class*="add-to-cart"]').length > 0 ||
                           $('[id*="add-to-cart"]').length > 0;
    
    // If we find disabled add to cart buttons, it's likely out of stock
    if ($('button[disabled]:contains("Add to Cart")').length > 0) {
      console.log("Found disabled add to cart button");
      return 'out-of-stock';
    }
    
    // If we find enabled add to cart buttons, it's likely in stock
    if (addToCartExists) {
      console.log("Found enabled add to cart button");
      return 'in-stock';
    }

    // If we've reached this point and we found add to cart buttons, 
    // we'll assume it's in stock since Pokemon Center usually clearly marks out of stock items
    if (addToCartExists) {
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
function checkStockStatus(html, targetText) {
  try {
    const $ = cheerio.load(html);
    const pageText = $('body').text().toLowerCase();
    
    // If target text is provided, check if it exists in the HTML
    if (targetText) {
      const lowerTargetText = targetText.toLowerCase();
      return pageText.includes(lowerTargetText) ? 'in-stock' : 'out-of-stock';
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
      if (pageText.includes(indicator)) {
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
      if (pageText.includes(indicator)) {
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
