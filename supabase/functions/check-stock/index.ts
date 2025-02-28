
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
    
    // In a real implementation, you would:
    // 1. Fetch the webpage
    // 2. Parse the HTML
    // 3. Look for indicators that the product is in stock
    
    // For demo purposes, we'll randomly determine if it's in stock
    const inStock = Math.random() > 0.5;
    
    // Extract domain as the source
    let source = "";
    try {
      const urlObj = new URL(url);
      source = urlObj.hostname.replace('www.', '');
    } catch (error) {
      console.error('Error parsing URL:', error);
    }
    
    // Save the result to the database
    const { error } = await supabase
      .from('products')
      .update({
        in_stock: inStock,
        source: source,
        product_line: "Product Line", // Would be extracted from page in real implementation
        product_name: "Product", // Would be extracted from page in real implementation
        last_checked: new Date().toISOString(),
      })
      .eq('url', url);
      
    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }
    
    return new Response(
      JSON.stringify({ inStock, lastChecked: new Date().toISOString() }),
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
