
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
    throw new Error("Missing Supabase environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Anti-detection measures
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.183",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 OPR/101.0.0.0",
  "Mozilla/5.0 (iPad; CPU OS 16_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
];

interface CheckUrlRequest {
  id: string;
  url: string;
  targetText?: string;
}

// Helper function to stringify error objects fully
const stringifyErrorDetails = (error: any): string => {
  try {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    } else if (typeof error === 'object' && error !== null) {
      try {
        // Check if it's a Response object
        if (error.status && error.statusText) {
          return `HTTP Error: ${error.status} ${error.statusText}`;
        }
        
        // Try to stringify the entire object for more details
        const jsonStr = JSON.stringify(error);
        return jsonStr === '{}' ? 'Empty error object' : jsonStr;
      } catch (e) {
        // If circular reference or other JSON error
        return `[Complex error object: ${Object.keys(error).join(', ')}]`;
      }
    }
  } catch (e) {
    return `[Error stringifying error: ${e}]`;
  }
  return String(error);
};

// Sanitize URL to avoid common tracking parameters
const sanitizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    
    // Common tracking parameters to remove
    const paramsToRemove = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', 'zanpid', 'dclid', 'igshid'
    ];
    
    // Remove tracking parameters
    paramsToRemove.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    return urlObj.toString();
  } catch (e) {
    console.error("Error sanitizing URL:", e);
    return url; // Return original URL if parsing fails
  }
};

serve(async (req: Request) => {
  console.log("Edge function received request");
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  
  let body: CheckUrlRequest | null = null;
  let supabase = null;
  
  try {
    // Try to parse request body
    try {
      body = await req.json() as CheckUrlRequest;
      console.log("Received request:", JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid request format: ${parseError instanceof Error ? parseError.message : String(parseError)}` 
        }),
        {
          status: 200, // Use 200 to avoid client errors
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Validate required fields
    if (!body || !body.url || !body.id) {
      const missingFields = [];
      if (!body) missingFields.push("body");
      else {
        if (!body.url) missingFields.push("url");
        if (!body.id) missingFields.push("id");
      }
      
      console.error(`Missing required fields: ${missingFields.join(", ")}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Missing required fields: ${missingFields.join(", ")}` 
        }),
        {
          status: 200, // Use 200 to avoid client errors
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Create Supabase client
    try {
      supabase = createSupabaseClient(req);
      console.log("Supabase client created successfully");
    } catch (dbError) {
      console.error("Failed to create Supabase client:", dbError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Database connection error: ${stringifyErrorDetails(dbError)}` 
        }),
        {
          status: 200, // Use 200 to avoid client errors
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // First update the database to show we're checking
    try {
      const { error: updateError } = await supabase
        .from("stock_monitors")
        .update({
          status: "unknown",
          error_message: null
        })
        .eq("id", body.id);
        
      if (updateError) {
        console.error("Failed to update initial status:", updateError);
      }
    } catch (e) {
      console.error("Error updating initial status:", e);
    }
    
    // Sanitize URL to avoid tracking parameters
    const sanitizedUrl = sanitizeUrl(body.url);
    
    // Select a random user agent
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    
    // Set up headers for the request
    const headers = {
      "User-Agent": userAgent,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "DNT": "1",
      "Referer": new URL(sanitizedUrl).origin,
    };
    
    console.log(`Checking URL: ${sanitizedUrl}`);
    
    // Small random delay to avoid detection patterns
    const timeout = Math.floor(Math.random() * 1000) + 500;
    await new Promise(resolve => setTimeout(resolve, timeout));
    
    // Make the request with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    let response = null;
    let html = "";
    let fetchError = null;
    
    try {
      console.log("Sending fetch request...");
      // Make the request
      response = await fetch(sanitizedUrl, {
        method: "GET",
        headers,
        redirect: "follow",
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Fetch response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Response(response);
      }
      
      // Get the HTML content
      html = await response.text();
      console.log(`Received HTML content (${html.length} characters)`);
      
    } catch (error) {
      clearTimeout(timeoutId);
      fetchError = error;
      console.error("Fetch error:", error);
      
      // Create detailed error message
      let errorMessage;
      
      if (error instanceof DOMException && error.name === "AbortError") {
        errorMessage = "Request timeout: took longer than 15 seconds to respond";
      } else if (error instanceof Response) {
        errorMessage = `HTTP error: ${error.status} ${error.statusText}`;
        try {
          const errorText = await error.text();
          if (errorText) {
            errorMessage += ` - ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
          }
        } catch (e) {
          // Ignore error getting text
        }
      } else {
        errorMessage = stringifyErrorDetails(error);
      }
      
      // Update database with error status
      try {
        if (supabase) {
          console.log("Updating database with fetch error");
          await supabase
            .from("stock_monitors")
            .update({
              last_checked: new Date().toISOString(),
              status: "error",
              error_message: `Failed to fetch: ${errorMessage}`,
              consecutive_errors: supabase.rpc('increment_field', { 
                row_id: body.id,
                table_name: 'stock_monitors',
                field_name: 'consecutive_errors'
              })
            })
            .eq("id", body.id);
        }
      } catch (updateError) {
        console.error("Failed to update error status:", updateError);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          isInStock: false,
          error: errorMessage,
          id: body.id,
          lastChecked: new Date().toISOString()
        }),
        {
          status: 200, // Return 200 even for fetch errors to prevent client errors
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // If we got the HTML content successfully, analyze it
    let isInStock = false;
    let errorMessage = null;
    let stockStatusReason = ""; // For debugging
    let targetTextStatus = null; // Status specific to the target text search
    
    try {
      console.log("Analyzing HTML content for stock status");
      
      const lowerHtml = html.toLowerCase();
      
      // First check for specific target text if provided
      if (body.targetText && body.targetText.trim() !== '') {
        console.log(`Checking for custom target text: "${body.targetText}"`);
        const targetTextLower = body.targetText.toLowerCase().trim();
        const targetTextFound = lowerHtml.includes(targetTextLower);
        
        // Store this result separately
        targetTextStatus = {
          found: targetTextFound,
          text: body.targetText
        };
        
        stockStatusReason = `Custom target text: "${body.targetText}" was ${targetTextFound ? 'found' : 'not found'}`;
        console.log(stockStatusReason);
        
        // Only use custom text as the primary determination if found
        // If not found, we'll do additional checks below
        if (targetTextFound) {
          isInStock = true;
        }
      }
      
      // If no target text was provided or if the target text wasn't found
      // run our comprehensive analysis to determine stock status
      if (!targetTextStatus?.found) {
        // EXTRACT BUTTONS: Find all <button> elements
        const buttonRegex = /<button[^>]*>(.*?)<\/button>/gis;
        let match;
        const buttons = [];
        
        while ((match = buttonRegex.exec(html)) !== null) {
          buttons.push(match[0].toLowerCase());
        }
        
        console.log(`Found ${buttons.length} buttons in HTML`);
        
        // Look for Add to Cart buttons and check if they're disabled
        let hasEnabledAddToCartButton = false;
        let hasDisabledAddToCartButton = false;
        let hasInStoreOnlyButton = false;
        let hasInStoreOnlyLink = false;

        // Common phrases in add-to-cart buttons
        const cartButtonPatterns = [
          'add to cart',
          'add to basket',
          'buy now',
          'purchase',
          'checkout',
          'preorder',
          'shop now',
          'get it now'
        ];
        
        // Common patterns that indicate in-store only
        const inStoreOnlyPatterns = [
          'in-store only',
          'in store only',
          'store pickup only',
          'not available online',
          'not sold online',
          'pick up in store',
          'in-store pickup',
          'available in store',
          'online not available',
          'pickup not eligible', // Target's common phrase
          'check stores'         // Added BestBuy specific
        ];
        
        // Patterns that indicate a button is disabled
        const disabledPatterns = [
          'disabled',
          'out-of-stock',
          'sold-out',
          'unavailable',
          'btn-disabled',
          'disabled="true"',
          'disabled=""',
          'class="[^"]*disabled[^"]*"'
        ];
        
        // Analyze each button
        for (const button of buttons) {
          const isCartButton = cartButtonPatterns.some(pattern => button.includes(pattern));
          const isInStoreOnlyButton = inStoreOnlyPatterns.some(pattern => button.includes(pattern));
          
          if (isInStoreOnlyButton) {
            hasInStoreOnlyButton = true;
            console.log("Found in-store only button:", button.substring(0, 100));
          }
          
          if (isCartButton) {
            const isDisabled = disabledPatterns.some(pattern => button.includes(pattern));
            
            if (isDisabled) {
              hasDisabledAddToCartButton = true;
              console.log("Found disabled cart button:", button.substring(0, 100));
            } else {
              hasEnabledAddToCartButton = true;
              console.log("Found enabled cart button:", button.substring(0, 100));
            }
          }
        }
        
        // Check for in-store only links
        const linkRegex = /<a[^>]*>(.*?)<\/a>/gis;
        while ((match = linkRegex.exec(html)) !== null) {
          const link = match[0].toLowerCase();
          const isInStoreOnlyLink = inStoreOnlyPatterns.some(pattern => link.includes(pattern));
          if (isInStoreOnlyLink) {
            hasInStoreOnlyLink = true;
            console.log("Found in-store only link:", link.substring(0, 100));
            break;
          }
        }
        
        // Also look for 'add to cart' forms which are common in ecommerce sites
        const hasAddToCartForm = lowerHtml.includes('form') && 
          (lowerHtml.includes('add to cart') || lowerHtml.includes('add-to-cart'));
          
        if (hasAddToCartForm) {
          console.log("Found add to cart form");
        }
        
        // Check if any in-store only text patterns exist in the page
        let hasInStoreOnlyText = false;
        let foundInStorePattern = "";
        
        for (const pattern of inStoreOnlyPatterns) {
          if (lowerHtml.includes(pattern)) {
            hasInStoreOnlyText = true;
            foundInStorePattern = pattern;
            console.log(`Found in-store only text: "${pattern}"`);
            break;
          }
        }
        
        // Out of stock indicators in the entire page
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
          'check local stores', // Common indicator that online ordering isn't available
          'not available for delivery', // Common indicator for online ordering
          'not available for shipping', // Another common indicator
          'check nearby stores', // Target's phrase when online purchase isn't available
          'this product is no longer available', // Added for BestBuy
          'coming soon', // Added for product not yet released
          'check stores' // Added for BestBuy
        ];
        
        // Check for out-of-stock indicators
        let hasOutOfStockIndicator = false;
        let foundOutOfStockPattern = "";
        
        for (const pattern of outOfStockPatterns) {
          if (lowerHtml.includes(pattern)) {
            hasOutOfStockIndicator = true;
            foundOutOfStockPattern = pattern;
            console.log(`Found out-of-stock text indicator: "${pattern}"`);
            break;
          }
        }

        // In stock indicators in the entire page
        const inStockPatterns = [
          'in stock',
          'in-stock',
          'available',
          'ready to ship',
          'ships today',
          'add to cart',
          'delivery available', // Indicates online ordering is available
          'shipping available' // Indicates online ordering is available
        ];

        // Check for in-stock indicators
        let hasInStockIndicator = false;
        let foundInStockPattern = "";
        
        for (const pattern of inStockPatterns) {
          if (lowerHtml.includes(pattern)) {
            hasInStockIndicator = true;
            foundInStockPattern = pattern;
            console.log(`Found in-stock text indicator: "${pattern}"`);
            break;
          }
        }
        
        // Look for price information - if no price is displayed, often means out of stock
        const hasPriceDisplay = lowerHtml.includes('price') && 
          (lowerHtml.includes('$') || lowerHtml.includes('€') || lowerHtml.includes('£'));
        
        // E-commerce site detection (refines stock detection logic)
        const urlObj = new URL(sanitizedUrl);
        const hostname = urlObj.hostname.toLowerCase();
        
        const isTargetSite = hostname.includes('target.com');
        const isAmazonSite = hostname.includes('amazon.com');
        const isWalmartSite = hostname.includes('walmart.com');
        const isBestBuySite = hostname.includes('bestbuy.com');
        const isGamestopSite = hostname.includes('gamestop.com');
        const isPokemonCenterSite = hostname.includes('pokemoncenter.com');
        
        // Site-specific logic
        if (isPokemonCenterSite) {
          // Pokemon Center specific detection
          console.log("Detected Pokemon Center site");
          
          // Check for the specific add to cart button used on Pokemon Center
          const pcAddToCartRegex = /<button[^>]*class="[^"]*add-to-cart[^"]*"[^>]*>(.*?)<\/button>/i;
          const pcAddToCartMatch = html.match(pcAddToCartRegex);
          const pcAddToCartButtonPresent = !!pcAddToCartMatch;
          
          // Check for out of stock indicator text that's specific to Pokemon Center
          const pcOutOfStockRegex = /<div[^>]*class="[^"]*out-of-stock[^"]*"[^>]*>/i;
          const pcOutOfStockMatch = html.match(pcOutOfStockRegex);
          const pcOutOfStockPresent = !!pcOutOfStockMatch;
          
          // Extract inventory status - Pokemon Center has a specific JSON structure in their page
          let inventoryStatus = null;
          const inventoryRegex = /"inventory"\s*:\s*{\s*"status"\s*:\s*"([^"]*)"/i;
          const inventoryMatch = html.match(inventoryRegex);
          if (inventoryMatch && inventoryMatch[1]) {
            inventoryStatus = inventoryMatch[1].toLowerCase();
            console.log(`Found Pokemon Center inventory status: "${inventoryStatus}"`);
          }
          
          // Find the "Add to Cart" button text to see if it's disabled
          const buttonDisabled = html.includes('data-disabled="true"') &&
                                html.includes('add to cart');
          
          // Check for the "Out of Stock" indicator in their specific structure
          const outOfStockText = lowerHtml.includes('"out of stock"') ||
                               lowerHtml.includes('out-of-stock') ||
                               lowerHtml.includes('sold out');
          
          // Pokemon Center specific logic
          if (pcOutOfStockPresent || outOfStockText || buttonDisabled || inventoryStatus === "out_of_stock") {
            isInStock = false;
            stockStatusReason = pcOutOfStockPresent 
              ? "PokemonCenter: Out of stock indicator element found" 
              : outOfStockText 
                ? "PokemonCenter: Out of stock text found" 
                : buttonDisabled 
                  ? "PokemonCenter: Add to cart button is disabled"
                  : "PokemonCenter: Inventory status is out of stock";
          } else if (pcAddToCartButtonPresent && !pcOutOfStockPresent && inventoryStatus === "in_stock") {
            isInStock = true;
            stockStatusReason = "PokemonCenter: Add to cart button is enabled and inventory status is in stock";
          } else if (inventoryStatus === "in_stock") {
            isInStock = true;
            stockStatusReason = "PokemonCenter: Inventory status is in stock";
          } else if (pcAddToCartButtonPresent && !outOfStockText && !buttonDisabled) {
            isInStock = true;
            stockStatusReason = "PokemonCenter: Add to cart button is present and not disabled";
          } else {
            isInStock = false;
            stockStatusReason = "PokemonCenter: Default to out of stock as no clear in-stock indicators found";
          }
        }
        else if (isTargetSite) {
          // Target-specific stock detection
          const soldOutIndicator = lowerHtml.includes('sold out') || 
                                 lowerHtml.includes('out of stock') ||
                                 lowerHtml.includes('not available for delivery') ||
                                 lowerHtml.includes('not available for shipping');
                                 
          const inStoreOnlyIndicator = lowerHtml.includes('in store only') || 
                                      lowerHtml.includes('in-store only') ||
                                      lowerHtml.includes('not sold online') ||
                                      lowerHtml.includes('check nearby stores');
                                      
          const addToCartEnabled = lowerHtml.includes('add to cart') && 
                                  !lowerHtml.includes('disabled') &&
                                  !lowerHtml.includes('not available') &&
                                  !lowerHtml.includes('not eligible');
          
          // Check if the "Pickup not eligible" text is present, which usually means online ordering isn't available
          const pickupNotEligible = lowerHtml.includes('pickup not eligible');
          
          if (soldOutIndicator || inStoreOnlyIndicator || pickupNotEligible) {
            isInStock = false;
            stockStatusReason = inStoreOnlyIndicator ? 
              "Target: 'In-Store Only' indicator found" : 
              soldOutIndicator ? "Target: 'Sold out' indicator found" :
              "Target: 'Pickup not eligible' indicator found";
          } else if (addToCartEnabled) {
            isInStock = true;
            stockStatusReason = "Target: Add to cart functionality detected";
          } else {
            isInStock = false;
            stockStatusReason = "Target: No clear stock indicators, defaulting to out of stock";
          }
        } else if (isAmazonSite) {
          // Amazon-specific stock detection
          const unavailableIndicator = lowerHtml.includes('currently unavailable') || 
                                      lowerHtml.includes('not available') ||
                                      lowerHtml.includes('out of stock') ||
                                      lowerHtml.includes('available at a lower price from other sellers');
                                      
          const inStoreIndicator = lowerHtml.includes('available in-store') ||
                                  lowerHtml.includes('available at') && lowerHtml.includes('store');
          
          if (inStoreIndicator && !lowerHtml.includes('add to cart')) {
            isInStock = false;
            stockStatusReason = "Amazon: In-store only, not available online";
          } else if (!unavailableIndicator && lowerHtml.includes('add to cart')) {
            isInStock = true;
            stockStatusReason = "Amazon: Add to cart available and not listed as unavailable";
          } else {
            isInStock = false;
            stockStatusReason = "Amazon: Product unavailable or no add to cart option";
          }
        } else if (isWalmartSite) {
          // Walmart-specific detection
          const hasActiveAddToCart = lowerHtml.includes('add to cart') && 
                                    !lowerHtml.includes('disabled') && 
                                    !lowerHtml.includes('not available');
                                    
          const onlineUnavailable = lowerHtml.includes('not available') ||
                                  lowerHtml.includes('out of stock');
          
          if (hasInStoreOnlyButton || hasInStoreOnlyText || hasInStoreOnlyLink) {
            isInStock = false;
            stockStatusReason = "Walmart: In-store only indicator found";
          } else if (hasActiveAddToCart && !hasOutOfStockIndicator && !onlineUnavailable) {
            isInStock = true;
            stockStatusReason = "Walmart: Add to cart available without out-of-stock indicators";
          } else if (hasOutOfStockIndicator || onlineUnavailable) {
            isInStock = false;
            stockStatusReason = `Walmart: Out of stock indicator found: "${foundOutOfStockPattern || 'Not available online'}"`;
          } else {
            isInStock = false;
            stockStatusReason = "Walmart: No clear stock indicators, defaulting to out of stock";
          }
        } else if (isBestBuySite) {
          // BestBuy-specific detection - FURTHER IMPROVED
          const hasSoldOut = lowerHtml.includes('sold out');
          const hasCheckStores = lowerHtml.includes('check stores');
          const hasComingSoon = lowerHtml.includes('coming soon');
          const hasNotAvailable = lowerHtml.includes('this product is no longer available');
          
          // Look for specific BestBuy add to cart button patterns
          const addToCartButtonRegex = /<button[^>]*class="[^"]*add-to-cart-button[^"]*"[^>]*>/i;
          const hasAddToCartButton = addToCartButtonRegex.test(html);
          
          // Check if "Out of Stock" text exists near the add to cart region
          const cartRegionOutOfStock = html.includes('Out of Stock') || 
                                      html.includes('out of stock') || 
                                      html.includes('Sold out');
          
          // Better detection for "Check Stores" situation
          if (hasCheckStores || hasInStoreOnlyButton || hasInStoreOnlyText) {
            isInStock = false;
            stockStatusReason = "BestBuy: Product appears to be in-store only (Check Stores)";
          } else if (hasSoldOut || hasNotAvailable) {
            isInStock = false;
            stockStatusReason = "BestBuy: Product shows as 'Sold Out' or 'No Longer Available'";
          } else if (hasComingSoon) {
            isInStock = false;
            stockStatusReason = "BestBuy: Product is 'Coming Soon' and not yet available";
          } else if (hasAddToCartButton && !cartRegionOutOfStock) {
            // Further verification - check for "Add to Cart" text specifically near the button
            const cartAreaText = html.toLowerCase().match(/<div[^>]*class="[^"]*fulfillment-add-to-cart-button[^"]*"[^>]*>[\s\S]*?<\/div>/i);
            if (cartAreaText && cartAreaText[0].includes('add to cart') && !cartAreaText[0].includes('disabled')) {
              isInStock = true;
              stockStatusReason = "BestBuy: Verified Add to Cart button is active and present";
            } else {
              isInStock = false;
              stockStatusReason = "BestBuy: Add to Cart section doesn't contain expected 'Add to Cart' text";
            }
          } else {
            isInStock = false;
            stockStatusReason = "BestBuy: No clear 'Add to Cart' button found or Out of Stock indicator present";
          }
        } else if (isGamestopSite) {
          // GameStop-specific detection
          const inStoreOnlyIndicator = lowerHtml.includes('in store only') || 
                                      lowerHtml.includes('not available online');
                                      
          if (inStoreOnlyIndicator) {
            isInStock = false;
            stockStatusReason = "GameStop: In-store only product";
          } else if (lowerHtml.includes('add to cart') && !lowerHtml.includes('not available') && !lowerHtml.includes('disabled')) {
            isInStock = true;
            stockStatusReason = "GameStop: Add to cart available without unavailable indicator";
          } else if (lowerHtml.includes('not available') || lowerHtml.includes('out of stock')) {
            isInStock = false;
            stockStatusReason = "GameStop: Not available or out of stock indicator found";
          } else {
            isInStock = false;
            stockStatusReason = "GameStop: No clear stock indicators, defaulting to out of stock";
          }
        } else {
          // General stock detection logic for other sites - MORE STRICT VERSION
          // This version will require stronger evidence to mark something as in-stock
          
          // 1. Check for in-store only products first - these are NOT online available
          if (hasInStoreOnlyButton || hasInStoreOnlyText || hasInStoreOnlyLink) {
            isInStock = false;
            stockStatusReason = "Found in-store only indicators, product not available online";
          } 
          // 2. Check for out-of-stock indicators - these are strong signals
          else if (hasOutOfStockIndicator) {
            isInStock = false;
            stockStatusReason = `Found out-of-stock text indicator: "${foundOutOfStockPattern}"`;
          }
          // 3. Check for disabled cart buttons - another strong signal of out-of-stock
          else if (hasDisabledAddToCartButton) {
            isInStock = false;
            stockStatusReason = "Found disabled Add to Cart button, considering item OUT OF STOCK";
          } 
          // 4. Check for enabled Add to Cart functionality - strongest in-stock indicator
          else if (hasEnabledAddToCartButton && !hasOutOfStockIndicator) {
            isInStock = true;
            stockStatusReason = "Found enabled Add to Cart button without out-of-stock indicators";
          } 
          // 5. Active add to cart form is also a good indicator
          else if (hasAddToCartForm && !hasOutOfStockIndicator && !hasInStoreOnlyText) {
            isInStock = true;
            stockStatusReason = "Found Add to Cart form without out-of-stock indicators";
          } 
          // 6. In stock indicators as a weaker signal, only if price is shown and no contrary evidence
          else if (hasInStockIndicator && hasPriceDisplay && !hasOutOfStockIndicator && !hasInStoreOnlyText) {
            isInStock = true;
            stockStatusReason = `Found in-stock text indicator and price display: "${foundInStockPattern}"`;
          } 
          // 7. Default to out of stock if no clear indicators
          else {
            isInStock = false;
            stockStatusReason = "No clear indicators found, defaulting to OUT OF STOCK to avoid false positives";
          }
        }
      }
      
      // Override general logic with target text result if specified and found
      // This is important because users explicitly want to check for this text
      if (targetTextStatus?.found) {
        isInStock = true;
        stockStatusReason = `Custom target text "${targetTextStatus.text}" was found, marking as IN STOCK`;
      }
      
      console.log(`Final stock determination: ${isInStock ? 'IN STOCK' : 'OUT OF STOCK'} - Reason: ${stockStatusReason}`);
      
    } catch (analysisError) {
      console.error('Error during stock pattern detection:', analysisError);
      errorMessage = analysisError instanceof Error ? analysisError.message : String(analysisError);
      isInStock = false; // Default to out of stock on error
      stockStatusReason = `Error during analysis: ${errorMessage}`;
    }
    
    // Update the database with results
    try {
      console.log(`Updating database with check results: status=${isInStock ? "in-stock" : "out-of-stock"}, reason=${stockStatusReason}`);
      
      const now = new Date().toISOString();
      const currentStatus = isInStock ? "in-stock" : "out-of-stock";
      
      // First, get the existing monitor data to check if status changed
      const { data: existingMonitor, error: fetchError } = await supabase
        .from("stock_monitors")
        .select("status, last_status_change, last_seen_in_stock")
        .eq("id", body.id)
        .single();
        
      if (fetchError) {
        console.error("Error fetching existing monitor data:", fetchError);
      }
      
      const statusChanged = existingMonitor && existingMonitor.status !== currentStatus;
      
      // Prepare the update data
      const updateData: Record<string, any> = { 
        status: currentStatus, 
        last_checked: now,
        error_message: stockStatusReason,
        consecutive_errors: 0, // Reset error count on successful check
        html_snapshot: html.substring(0, 10000) // Store the first 10k chars of HTML for debugging
      };
      
      // Set last_status_change if status changed
      if (statusChanged) {
        updateData.last_status_change = now;
      }
      
      // Update last_seen_in_stock ONLY when the item is in stock
      if (isInStock) {
        updateData.last_seen_in_stock = now;
      }
      
      await supabase
        .from("stock_monitors")
        .update(updateData)
        .eq("id", body.id);
      
      console.log("Database updated successfully");
    } catch (dbError) {
      console.error("Failed to update database:", dbError);
      
      // Create a detailed error message
      const detailedError = stringifyErrorDetails(dbError);
      
      // Try one more update with error status
      try {
        await supabase
          .from("stock_monitors")
          .update({
            last_checked: new Date().toISOString(),
            status: "error",
            error_message: `Database error: ${detailedError}`
          })
          .eq("id", body.id);
      } catch (e) {
        console.error("Second attempt to update database failed:", e);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Database update error: ${detailedError}`,
          stockStatusReason
        }),
        {
          status: 200, // Return 200 even for db errors to prevent client errors
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        isInStock,
        id: body.id,
        lastChecked: new Date().toISOString(),
        stockStatusReason,
        targetTextFound: targetTextStatus?.found
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
    
  } catch (error) {
    // Top-level error handler
    console.error("Unhandled error in check-url-stock function:", error);
    
    const errorMessage = stringifyErrorDetails(error);
    
    // Try to update the database with error status
    try {
      if (supabase && body && body.id) {
        await supabase
          .from("stock_monitors")
          .update({
            last_checked: new Date().toISOString(),
            status: "error",
            error_message: `Unhandled error: ${errorMessage}`,
            consecutive_errors: supabase.rpc('increment_field', { 
              row_id: body.id,
              table_name: 'stock_monitors',
              field_name: 'consecutive_errors'
            })
          })
          .eq("id", body.id);
      }
    } catch (dbError) {
      console.error("Failed to update error status in database:", dbError);
    }
    
    // Return error response with 200 status to avoid client errors
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        id: body?.id,
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
  }
});
