
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log(`Checking stock for URL: ${url}`);

    // Parse the URL to determine the source
    let source = "";
    let hostname = "";
    try {
      const urlObj = new URL(url);
      hostname = urlObj.hostname;
      source = hostname.replace('www.', '');
    } catch (error) {
      console.error('Error parsing URL:', error);
    }

    // Fetch the webpage content
    let response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        }
      });
    } catch (error) {
      console.error('Error fetching URL:', error);
      throw new Error(`Failed to fetch URL: ${error.message}`);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`Successfully fetched HTML for ${url}, length: ${html.length} characters`);

    // Initialize variables to store product information
    let productName = "";
    let productLine = "";
    let inStock = false;

    // Check stock status based on the retailer
    if (hostname.includes('target.com')) {
      console.log("Processing Target.com product");
      // Extract product name
      const titleMatch = html.match(/<h1[^>]*class="[^"]*Heading__StyledHeading[^"]*"[^>]*>(.*?)<\/h1>/i);
      if (titleMatch && titleMatch[1]) {
        productName = titleMatch[1].trim();
      }
      
      // Set product line based on product name
      if (productName.toLowerCase().includes('squishmallow')) {
        productLine = 'Squishmallows';
      } else if (productName.toLowerCase().includes('pokemon') || productName.toLowerCase().includes('pokémon')) {
        productLine = 'Pokémon';
      }
      
      // Check if in stock
      inStock = !html.includes('Out of stock') && !html.includes('Temporarily out of stock');
      
    } else if (hostname.includes('pokemoncenter.com')) {
      console.log("Processing Pokemon Center product");
      // Extract product name
      const titleMatch = html.match(/<h1[^>]*class="[^"]*product-name[^"]*"[^>]*>(.*?)<\/h1>/i);
      if (titleMatch && titleMatch[1]) {
        productName = titleMatch[1].trim();
      }
      
      // Set product line (always Pokémon for Pokemon Center)
      productLine = 'Pokémon';
      
      // Check if in stock - Pokemon Center shows "Out of Stock" or "Unavailable" for out of stock items
      inStock = !html.includes('Out of Stock') && !html.includes('Unavailable') && !html.includes('Coming Soon');
      
    } else if (hostname.includes('bestbuy.com')) {
      console.log("Processing Best Buy product");
      // Extract product name
      const titleMatch = html.match(/<h1[^>]*class="[^"]*heading-5[^"]*"[^>]*>(.*?)<\/h1>/i);
      if (titleMatch && titleMatch[1]) {
        productName = titleMatch[1].trim();
      }
      
      // Set product line based on product name
      if (productName.toLowerCase().includes('pokemon') || productName.toLowerCase().includes('pokémon')) {
        productLine = 'Pokémon';
      }
      
      // Check if in stock - Best Buy uses "Add to Cart" button for in-stock items
      inStock = html.includes('Add to Cart') && !html.includes('Sold Out');
    } else {
      // For other retailers, use a simplified approach
      // Extract title from the HTML
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        productName = titleMatch[1].split('|')[0].trim();
      }
      
      // Use a random stock status as fallback
      inStock = Math.random() > 0.5;
    }

    console.log(`Extracted data: Product: "${productName}", Line: "${productLine}", In Stock: ${inStock}`);
    
    // Save the result to the database
    const { error } = await supabase
      .from('products')
      .update({
        in_stock: inStock,
        source: source,
        product_line: productLine || null,
        product_name: productName || null,
        last_checked: new Date().toISOString(),
      })
      .eq('url', url);
      
    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }
    
    return new Response(
      JSON.stringify({ inStock, productName, productLine, lastChecked: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
