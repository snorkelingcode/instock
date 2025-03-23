
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import * as puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

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

// Initialize browser outside the handler to reuse for multiple requests
let browser: any = null;
let browserInitializing = false;
let lastBrowserActivity = Date.now();

// Timeout for browser inactivity (5 minutes)
const BROWSER_TIMEOUT = 5 * 60 * 1000; 

// Initialize the browser
async function initBrowser() {
  if (browserInitializing) {
    // Wait for current initialization to complete
    let attempts = 0;
    while (browserInitializing && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    if (browser) return browser;
  }

  try {
    browserInitializing = true;
    console.log("Initializing headless browser...");
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1280,720',
      ]
    });
    console.log("Browser initialized successfully");
    lastBrowserActivity = Date.now();
    return browser;
  } catch (error) {
    console.error("Failed to initialize browser:", error);
    throw error;
  } finally {
    browserInitializing = false;
  }
}

// Cleanup browser if it's been inactive
function setupBrowserCleanup() {
  // Check every minute if browser should be closed
  setInterval(() => {
    if (browser && Date.now() - lastBrowserActivity > BROWSER_TIMEOUT) {
      console.log("Closing inactive browser");
      browser.close().catch(console.error);
      browser = null;
    }
  }, 60 * 1000);
}

// Setup the cleanup interval
setupBrowserCleanup();

Deno.serve(async (req) => {
  try {
    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    // Get request body
    const { id, url, targetText, autoCheckout = false } = await req.json();
    console.log(`Received request: ${JSON.stringify({ id, url, targetText, autoCheckout }, null, 2)}`);
    
    // Validate input
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    let status: 'in-stock' | 'out-of-stock' | 'unknown' | 'error' = 'unknown';
    let errorMessage: string | null = null;
    let checkoutStatus: string | null = null;
    let htmlContent = '';

    // If auto checkout is requested, we use Puppeteer for everything
    if (autoCheckout) {
      try {
        // Initialize browser if needed
        if (!browser) {
          await initBrowser();
        }
        lastBrowserActivity = Date.now();
        
        // Perform auto checkout process
        const result = await performAutoCheckout(url);
        
        status = result.status;
        checkoutStatus = result.checkoutStatus;
        errorMessage = result.errorMessage;
        htmlContent = result.htmlSnapshot || '';
        
      } catch (error) {
        console.error("Auto checkout error:", error);
        status = 'error';
        errorMessage = `Auto checkout failed: ${error.message || 'Unknown error'}`;
        htmlContent = 'Error during auto checkout process';
      }
    } else {
      // Regular stock check (existing functionality)
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
    }

    // Update the stock_monitors table with the result
    if (id) {
      const updateData: any = {
        status,
        last_checked: new Date().toISOString(),
        error_message: errorMessage,
        html_snapshot: htmlContent.substring(0, 100000) // Limit to prevent exceeding column size
      };
      
      // Add checkout status if available
      if (checkoutStatus) {
        updateData.checkout_status = checkoutStatus;
      }
      
      const { error: updateError } = await supabaseAdmin
        .from('stock_monitors')
        .update(updateData)
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
        checkout_status: checkoutStatus,
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

// Function to perform auto checkout process
async function performAutoCheckout(url: string): Promise<{
  status: 'in-stock' | 'out-of-stock' | 'unknown' | 'error';
  checkoutStatus: string;
  errorMessage: string | null;
  htmlSnapshot?: string;
}> {
  console.log(`Starting auto checkout process for: ${url}`);
  
  if (!browser) {
    await initBrowser();
  }
  
  const page = await browser.newPage();
  try {
    // Set realistic browser environment
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });
    
    // Enable request interception for better debugging
    await page.setRequestInterception(true);
    page.on('request', (request: any) => {
      // Ignore images and fonts to speed up loading
      const resourceType = request.resourceType();
      if (resourceType === 'image' || resourceType === 'font') {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Navigate to the product page
    console.log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for page to load essential content
    await page.waitForTimeout(2000);
    
    // Take a screenshot for debugging (don't save it in production)
    // await page.screenshot({ path: 'debug.png' });
    
    // Get page HTML for stock check
    const htmlContent = await page.content();
    
    // Determine if the product is in stock
    let isInStock = false;
    
    // Check if it's Pokemon Center
    if (url.includes('pokemoncenter.com')) {
      // For Pokemon Center, look for "ADD TO CART" button that isn't disabled
      const addToCartButtonExists = await page.evaluate(() => {
        const addToCartBtn = document.querySelector('button[data-testid="add-to-cart"]');
        if (addToCartBtn) {
          return !addToCartBtn.hasAttribute('disabled');
        }
        return false;
      });
      
      isInStock = addToCartButtonExists;
      
      // Also try to check product JSON data for Pokemon Center
      if (!isInStock) {
        const stockStatus = await page.evaluate(() => {
          // Try to find stock information in JSON scripts
          const scripts = document.querySelectorAll('script[type="application/ld+json"]');
          for (const script of scripts) {
            try {
              const data = JSON.parse(script.textContent || '');
              if (data.offers && data.offers.availability) {
                return data.offers.availability.toLowerCase().includes('instock');
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
          return null;
        });
        
        if (stockStatus === true) {
          isInStock = true;
        }
      }
    } else {
      // Generic stock detection for other sites
      isInStock = await page.evaluate(() => {
        // Look for common indicators of in-stock status
        const pageText = document.body.innerText.toLowerCase();
        const inStockPhrases = ['in stock', 'add to cart', 'buy now', 'add to bag'];
        const outOfStockPhrases = ['out of stock', 'sold out', 'currently unavailable'];
        
        // Check for in-stock phrases
        for (const phrase of inStockPhrases) {
          if (pageText.includes(phrase)) {
            return true;
          }
        }
        
        // Check for out-of-stock phrases
        for (const phrase of outOfStockPhrases) {
          if (pageText.includes(phrase)) {
            return false;
          }
        }
        
        // Check for add-to-cart buttons
        const cartButtons = document.querySelectorAll('button, a');
        for (const button of cartButtons) {
          const text = button.textContent?.toLowerCase() || '';
          const classes = button.className.toLowerCase();
          if ((text.includes('add to cart') || text.includes('buy now') || 
               classes.includes('add-to-cart')) && 
              !button.hasAttribute('disabled')) {
            return true;
          }
        }
        
        return null; // Uncertain
      });
    }
    
    // If not in stock, return immediately
    if (isInStock === false) {
      console.log('Product is out of stock, skipping checkout');
      await page.close();
      return {
        status: 'out-of-stock',
        checkoutStatus: 'skipped',
        errorMessage: null,
        htmlSnapshot: htmlContent
      };
    } else if (isInStock === null) {
      console.log('Product stock status uncertain');
      await page.close();
      return {
        status: 'unknown',
        checkoutStatus: 'skipped',
        errorMessage: 'Could not determine stock status',
        htmlSnapshot: htmlContent
      };
    }
    
    console.log('Product appears to be in stock, attempting to add to cart');
    
    // Product is in stock, try to add to cart
    // Different sites have different ways of adding to cart
    let addedToCart = false;
    
    if (url.includes('pokemoncenter.com')) {
      // Pokemon Center specific checkout flow
      addedToCart = await addToCartPokemonCenter(page);
    } else {
      // Generic add to cart attempt
      addedToCart = await genericAddToCart(page);
    }
    
    if (!addedToCart) {
      console.log('Failed to add product to cart');
      await page.close();
      return {
        status: 'in-stock',
        checkoutStatus: 'failed_add_to_cart',
        errorMessage: 'Product is in stock but could not be added to cart',
        htmlSnapshot: htmlContent
      };
    }
    
    console.log('Product added to cart, proceeding to checkout');
    
    // Proceed to checkout - site specific
    let navigatedToCheckout = false;
    
    if (url.includes('pokemoncenter.com')) {
      navigatedToCheckout = await proceedToCheckoutPokemonCenter(page);
    } else {
      navigatedToCheckout = await genericProceedToCheckout(page);
    }
    
    if (!navigatedToCheckout) {
      console.log('Failed to proceed to checkout');
      await page.close();
      return {
        status: 'in-stock',
        checkoutStatus: 'failed_checkout',
        errorMessage: 'Product added to cart but could not proceed to checkout',
        htmlSnapshot: await page.content()
      };
    }
    
    console.log('Successfully reached checkout page');
    
    // Take a final screenshot of the checkout page for confirmation
    // await page.screenshot({ path: 'checkout.png' });
    
    // Close the page without completing purchase
    await page.close();
    
    return {
      status: 'in-stock',
      checkoutStatus: 'reached_checkout',
      errorMessage: null,
      htmlSnapshot: await page.content()
    };
    
  } catch (error) {
    console.error('Error during auto checkout:', error);
    
    try {
      // Try to close the page even if there was an error
      await page.close();
    } catch (e) {
      // Ignore errors when closing page
    }
    
    return {
      status: 'error',
      checkoutStatus: 'error',
      errorMessage: `Auto checkout error: ${error.message || 'Unknown error'}`,
      htmlSnapshot: 'Error during checkout process'
    };
  }
}

// Pokemon Center specific add to cart
async function addToCartPokemonCenter(page: any): Promise<boolean> {
  try {
    // Wait for add to cart button to be available
    await page.waitForSelector('button[data-testid="add-to-cart"]', { timeout: 5000 });
    
    // Click the add to cart button
    await page.click('button[data-testid="add-to-cart"]');
    
    // Wait for the cart to update
    await page.waitForTimeout(2000);
    
    // Check if product was added to cart by looking for mini cart indicator
    const cartUpdated = await page.evaluate(() => {
      // Check for mini cart or success message
      const miniCart = document.querySelector('[data-testid="mini-cart"]');
      const successMsg = document.querySelector('[data-testid="add-to-cart-success"]');
      return !!miniCart || !!successMsg;
    });
    
    return cartUpdated;
  } catch (error) {
    console.error('Error adding to cart on Pokemon Center:', error);
    return false;
  }
}

// Generic add to cart for other sites
async function genericAddToCart(page: any): Promise<boolean> {
  try {
    // Try multiple common add to cart button selectors
    const buttonSelectors = [
      'button[data-testid="add-to-cart"]',
      'button.add-to-cart',
      'button[name="add"]',
      'button:contains("Add to Cart")',
      'button:contains("Add to Bag")',
      'button:contains("Buy Now")',
      'a.add-to-cart',
      'a:contains("Add to Cart")',
      '.add-to-cart-button'
    ];
    
    // Try each selector
    for (const selector of buttonSelectors) {
      const buttonExists = await page.evaluate((sel: string) => {
        let elements;
        try {
          // Handle :contains pseudo-selector specially
          if (sel.includes(':contains(')) {
            const text = sel.match(/:contains\("(.+)"\)/)?.[1] || '';
            const baseSelector = sel.split(':contains')[0];
            elements = Array.from(document.querySelectorAll(baseSelector))
              .filter(el => el.textContent?.includes(text));
          } else {
            elements = document.querySelectorAll(sel);
          }
          return elements.length > 0;
        } catch {
          return false;
        }
      }, selector);
      
      if (buttonExists) {
        try {
          if (selector.includes(':contains(')) {
            // Handle :contains selector with JS evaluation
            const text = selector.match(/:contains\("(.+)"\)/)?.[1] || '';
            const baseSelector = selector.split(':contains')[0];
            
            await page.evaluate((sel: string, buttonText: string) => {
              const buttons = Array.from(document.querySelectorAll(sel));
              const targetButton = buttons.find(btn => 
                btn.textContent?.includes(buttonText) && !btn.disabled);
              if (targetButton) {
                (targetButton as HTMLElement).click();
              }
            }, baseSelector, text);
          } else {
            // Direct click for standard CSS selectors
            await page.click(selector);
          }
          
          // Wait for cart update
          await page.waitForTimeout(2000);
          
          // Check if cart was updated
          const cartUpdated = await page.evaluate(() => {
            // Look for cart quantity change, success message, or mini cart
            const miniCart = document.querySelector('.cart-count, .cart-quantity, .cart-item-count');
            const successMsg = document.querySelector('.success-message, .cart-success');
            return !!miniCart || !!successMsg;
          });
          
          if (cartUpdated) {
            return true;
          }
        } catch (e) {
          console.log(`Failed to click ${selector}: ${e.message}`);
          // Continue to next selector
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error in generic add to cart:', error);
    return false;
  }
}

// Pokemon Center checkout flow
async function proceedToCheckoutPokemonCenter(page: any): Promise<boolean> {
  try {
    // First check if we need to close a popup/modal
    await page.evaluate(() => {
      const closeButtons = document.querySelectorAll('button[aria-label="Close"]');
      for (const btn of closeButtons) {
        (btn as HTMLElement).click();
      }
    });
    
    // Wait briefly for any modals to close
    await page.waitForTimeout(1000);
    
    // Look for view cart or checkout button
    await page.waitForSelector('[data-testid="mini-cart-view-cart"], [data-testid="mini-cart-checkout"]', 
      { timeout: 5000 });
    
    // Determine which button to click (prefer direct checkout if available)
    const hasDirectCheckout = await page.evaluate(() => {
      const checkoutBtn = document.querySelector('[data-testid="mini-cart-checkout"]');
      return !!checkoutBtn;
    });
    
    if (hasDirectCheckout) {
      await page.click('[data-testid="mini-cart-checkout"]');
    } else {
      // Go to cart first, then checkout
      await page.click('[data-testid="mini-cart-view-cart"]');
      
      // Wait for cart page to load
      await page.waitForTimeout(3000);
      
      // Look for checkout button on cart page
      await page.waitForSelector('[data-testid="checkout-button"]', { timeout: 5000 });
      await page.click('[data-testid="checkout-button"]');
    }
    
    // Wait for checkout page to load
    await page.waitForTimeout(3000);
    
    // Check if we reached checkout
    const isOnCheckout = await page.evaluate(() => {
      // Check for common checkout page elements
      return document.URL.includes('checkout') || 
             document.querySelector('.checkout-content, form[action*="checkout"]') !== null;
    });
    
    return isOnCheckout;
  } catch (error) {
    console.error('Error proceeding to checkout on Pokemon Center:', error);
    return false;
  }
}

// Generic checkout flow for other sites
async function genericProceedToCheckout(page: any): Promise<boolean> {
  try {
    // Try clicking common cart/checkout buttons
    const checkoutSelectors = [
      'a[href*="cart"]',
      'a.view-cart',
      'a.checkout',
      'button.checkout',
      'button:contains("Checkout")',
      'a:contains("Checkout")',
      'a:contains("View Cart")',
      '.checkout-button',
      '.cart-checkout-button'
    ];
    
    // First try to go to cart
    let foundCartOrCheckout = false;
    
    for (const selector of checkoutSelectors) {
      const exists = await page.evaluate((sel: string) => {
        try {
          // Handle :contains pseudo-selector specially
          if (sel.includes(':contains(')) {
            const text = sel.match(/:contains\("(.+)"\)/)?.[1] || '';
            const baseSelector = sel.split(':contains')[0];
            const elements = Array.from(document.querySelectorAll(baseSelector))
              .filter(el => el.textContent?.includes(text));
            return elements.length > 0;
          } else {
            return document.querySelectorAll(sel).length > 0;
          }
        } catch {
          return false;
        }
      }, selector);
      
      if (exists) {
        try {
          if (selector.includes(':contains(')) {
            // Handle :contains selector with JS evaluation
            const text = selector.match(/:contains\("(.+)"\)/)?.[1] || '';
            const baseSelector = selector.split(':contains')[0];
            
            await page.evaluate((sel: string, buttonText: string) => {
              const buttons = Array.from(document.querySelectorAll(sel));
              const targetButton = buttons.find(btn => 
                btn.textContent?.includes(buttonText) && 
                !btn.disabled && 
                (btn.tagName === 'A' || btn.tagName === 'BUTTON'));
              
              if (targetButton) {
                (targetButton as HTMLElement).click();
              }
            }, baseSelector, text);
          } else {
            // Direct click for standard CSS selectors
            await page.click(selector);
          }
          
          // Wait for page transition
          await page.waitForTimeout(3000);
          
          // Check if we're on cart or checkout page
          foundCartOrCheckout = await page.evaluate(() => {
            return document.URL.includes('cart') || 
                   document.URL.includes('checkout') ||
                   document.querySelector('.cart-content, .checkout-content') !== null;
          });
          
          if (foundCartOrCheckout) {
            break;
          }
        } catch (e) {
          console.log(`Failed to click ${selector}: ${e.message}`);
          // Continue to next selector
        }
      }
    }
    
    if (!foundCartOrCheckout) {
      return false;
    }
    
    // Now try to proceed to checkout if we're on cart page
    const isOnCheckout = await page.evaluate(() => {
      return document.URL.includes('checkout');
    });
    
    if (!isOnCheckout) {
      // We're on cart page, try to find checkout button
      const checkoutButtonSelectors = [
        'button.checkout',
        'a.checkout',
        'button:contains("Checkout")',
        'a:contains("Checkout")',
        'button[name="checkout"]',
        'input[value="Checkout"]',
        '.checkout-button'
      ];
      
      for (const selector of checkoutButtonSelectors) {
        const exists = await page.evaluate((sel: string) => {
          try {
            if (sel.includes(':contains(')) {
              const text = sel.match(/:contains\("(.+)"\)/)?.[1] || '';
              const baseSelector = sel.split(':contains')[0];
              const elements = Array.from(document.querySelectorAll(baseSelector))
                .filter(el => el.textContent?.includes(text));
              return elements.length > 0;
            } else {
              return document.querySelectorAll(sel).length > 0;
            }
          } catch {
            return false;
          }
        }, selector);
        
        if (exists) {
          try {
            if (selector.includes(':contains(')) {
              const text = selector.match(/:contains\("(.+)"\)/)?.[1] || '';
              const baseSelector = selector.split(':contains')[0];
              
              await page.evaluate((sel: string, buttonText: string) => {
                const buttons = Array.from(document.querySelectorAll(sel));
                const targetButton = buttons.find(btn => 
                  btn.textContent?.includes(buttonText) && !btn.disabled);
                
                if (targetButton) {
                  (targetButton as HTMLElement).click();
                }
              }, baseSelector, text);
            } else {
              await page.click(selector);
            }
            
            // Wait for checkout page to load
            await page.waitForTimeout(3000);
            
            break;
          } catch (e) {
            console.log(`Failed to click checkout button ${selector}: ${e.message}`);
          }
        }
      }
    }
    
    // Final check if we reached checkout
    const reachedCheckout = await page.evaluate(() => {
      return document.URL.includes('checkout') || 
             document.querySelector('.checkout-content, form[action*="checkout"], form.checkout') !== null;
    });
    
    return reachedCheckout;
  } catch (error) {
    console.error('Error in generic proceed to checkout:', error);
    return false;
  }
}

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
