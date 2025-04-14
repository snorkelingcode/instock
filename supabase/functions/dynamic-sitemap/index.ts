import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Initialize environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get URL parameters
    const url = new URL(req.url);
    const sitemapType = url.searchParams.get("type") || "static";
    
    console.log("Generating sitemap type:", sitemapType);
    
    // Generate the appropriate sitemap based on the type
    let sitemapContent = "";
    
    if (sitemapType === "static") {
      sitemapContent = generateStaticSitemap();
    } else if (sitemapType === "articles") {
      sitemapContent = await generateArticlesSitemap();
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid sitemap type" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
    
    // Return the XML sitemap with the correct content type and no BOM
    return new Response(sitemapContent, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    
    return new Response(
      JSON.stringify({ error: `Failed to generate sitemap: ${error.message}` }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});

// Generate sitemap for static pages
function generateStaticSitemap(): string {
  // UPDATED: Using www subdomain as per your Vercel configuration
  const baseUrl = "https://www.tcgupdates.com";
  const today = new Date().toISOString().split('T')[0];
  
  const staticUrls = [
    "",                // Home page
    "/news",
    "/products",       // Updated order to match your navigation
    "/market",
    "/sets",
    "/sets/pokemon",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/cookies",
    "/psa-market",     // Added missing pages
    "/articles"
  ];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  // Add each static URL to the sitemap
  for (const url of staticUrls) {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}${url}</loc>\n`;
    sitemap += `    <lastmod>${today}</lastmod>\n`;
    
    // Set appropriate changefreq and priority
    let changefreq = "weekly";
    let priority = "0.8";
    
    if (url === "") {
      changefreq = "daily";
      priority = "1.0";
    } else if (url === "/news" || url === "/products" || url === "/market" || url === "/psa-market") {
      changefreq = "daily";
      priority = "0.9";
    } else if (url === "/privacy" || url === "/terms" || url === "/cookies") {
      changefreq = "monthly";
      priority = "0.5";
    }
    
    sitemap += `    <changefreq>${changefreq}</changefreq>\n`;
    sitemap += `    <priority>${priority}</priority>\n`;
    sitemap += `  </url>\n`;
  }
  
  sitemap += `</urlset>`;
  return sitemap;
}

// Generate sitemap for articles
async function generateArticlesSitemap(): Promise<string> {
  // UPDATED: Using www subdomain as per your Vercel configuration
  const baseUrl = "https://www.tcgupdates.com";
  
  try {
    // Fetch published articles from the database
    const { data: articles, error } = await supabase
      .from("articles")
      .select("id, title, created_at, updated_at")
      .eq("published", true)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching articles:", error);
      throw new Error(`Failed to fetch articles: ${error.message}`);
    }
    
    // Check if we got any articles
    console.log(`Found ${articles?.length || 0} published articles`);
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Add each article URL to the sitemap
    if (articles && articles.length > 0) {
      for (const article of articles) {
        // Create slug from title (simplified version)
        const slug = createSlug(article.title);
        
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}/articles/${slug}</loc>\n`;
        sitemap += `    <lastmod>${article.updated_at.split('T')[0]}</lastmod>\n`;
        sitemap += `    <changefreq>monthly</changefreq>\n`;
        sitemap += `    <priority>0.7</priority>\n`;
        sitemap += `  </url>\n`;
      }
    } else {
      // Add at least one example article URL to avoid empty sitemap
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/articles</loc>\n`;
      sitemap += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.8</priority>\n`;
      sitemap += `  </url>\n`;
    }
    
    sitemap += `</urlset>`;
    return sitemap;
  } catch (dbError) {
    console.error("Database error:", dbError);
    // Fallback sitemap with just the articles index page
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/articles</loc>\n`;
    sitemap += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    sitemap += `    <changefreq>weekly</changefreq>\n`;
    sitemap += `    <priority>0.8</priority>\n`;
    sitemap += `  </url>\n`;
    sitemap += `</urlset>`;
    return sitemap;
  }
}

// Create slug function (same as the one used in frontend)
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
