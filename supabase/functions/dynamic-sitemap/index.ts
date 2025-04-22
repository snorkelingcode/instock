
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Initialize environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Enhanced CORS headers with proper XML content type
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600"
};

serve(async (req) => {
  console.log("Dynamic sitemap function called with URL:", req.url);
  
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
    const sitemapType = url.searchParams.get("type") || "all";
    
    console.log("Generating sitemap type:", sitemapType);
    
    // Generate the appropriate sitemap based on the type
    let sitemapContent = "";
    
    if (sitemapType === "static") {
      sitemapContent = generateStaticSitemap();
    } else if (sitemapType === "articles") {
      sitemapContent = await generateArticlesSitemap();
    } else if (sitemapType === "all") {
      sitemapContent = generateIndexSitemap();
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
    
    console.log("Sitemap generated successfully, length:", sitemapContent.length);
    
    // Return the XML sitemap with the correct content type
    return new Response(sitemapContent, {
      status: 200,
      headers: corsHeaders,
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

// Generate index sitemap that links to other sitemaps
function generateIndexSitemap(): string {
  const baseUrl = "https://www.tcgupdates.com";
  const today = new Date().toISOString().split('T')[0];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemap += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  // Add reference to static sitemap
  sitemap += `  <sitemap>\n`;
  sitemap += `    <loc>${baseUrl}/sitemap-static.xml</loc>\n`;
  sitemap += `    <lastmod>${today}</lastmod>\n`;
  sitemap += `  </sitemap>\n`;
  
  // Add reference to articles sitemap
  sitemap += `  <sitemap>\n`;
  sitemap += `    <loc>${baseUrl}/sitemap-articles.xml</loc>\n`;
  sitemap += `    <lastmod>${today}</lastmod>\n`;
  sitemap += `  </sitemap>\n`;
  
  sitemap += `</sitemapindex>`;
  return sitemap;
}

// Generate sitemap for static pages
function generateStaticSitemap(): string {
  const baseUrl = "https://www.tcgupdates.com";
  const today = new Date().toISOString().split('T')[0];
  
  const staticUrls = [
    { path: "", changefreq: "daily", priority: "1.0" },
    { path: "/news", changefreq: "daily", priority: "0.9" },
    { path: "/products", changefreq: "daily", priority: "0.9" },
    { path: "/market", changefreq: "daily", priority: "0.8" },
    { path: "/sets", changefreq: "weekly", priority: "0.8" },
    { path: "/sets/pokemon", changefreq: "weekly", priority: "0.8" },
    { path: "/about", changefreq: "monthly", priority: "0.7" },
    { path: "/contact", changefreq: "monthly", priority: "0.7" },
    { path: "/privacy", changefreq: "monthly", priority: "0.5" },
    { path: "/terms", changefreq: "monthly", priority: "0.5" },
    { path: "/cookies", changefreq: "monthly", priority: "0.5" }
  ];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  sitemap += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
  sitemap += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n`;
  sitemap += `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;
  
  // Add each static URL to the sitemap
  for (const url of staticUrls) {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}${url.path}</loc>\n`;
    sitemap += `    <lastmod>${today}</lastmod>\n`;
    sitemap += `    <changefreq>${url.changefreq}</changefreq>\n`;
    sitemap += `    <priority>${url.priority}</priority>\n`;
    sitemap += `  </url>\n`;
  }
  
  sitemap += `</urlset>`;
  return sitemap;
}

// Generate sitemap for articles
async function generateArticlesSitemap(): Promise<string> {
  const baseUrl = "https://www.tcgupdates.com";
  
  try {
    // Fetch published articles from the database
    const { data: articles, error } = await supabase
      .from("articles")
      .select("id, title, created_at, updated_at, published_at, featured")
      .eq("published", true)
      .order("published_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching articles:", error);
      throw new Error(`Failed to fetch articles: ${error.message}`);
    }
    
    // Check if we got any articles
    console.log(`Found ${articles?.length || 0} published articles`);
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    sitemap += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
    sitemap += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n`;
    sitemap += `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;
    
    // Add the articles index page
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/articles</loc>\n`;
    sitemap += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    sitemap += `    <changefreq>daily</changefreq>\n`;
    sitemap += `    <priority>0.8</priority>\n`;
    sitemap += `  </url>\n`;
    
    // Add each article URL to the sitemap
    if (articles && articles.length > 0) {
      for (const article of articles) {
        // Create slug from title
        const slug = createSlug(article.title);
        const lastMod = article.updated_at || article.published_at || article.created_at;
        const priority = article.featured ? "0.8" : "0.7";
        
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}/articles/${slug}</loc>\n`;
        sitemap += `    <lastmod>${new Date(lastMod).toISOString().split('T')[0]}</lastmod>\n`;
        sitemap += `    <changefreq>weekly</changefreq>\n`;
        sitemap += `    <priority>${priority}</priority>\n`;
        sitemap += `  </url>\n`;
      }
    }
    
    sitemap += `</urlset>`;
    return sitemap;
  } catch (dbError) {
    console.error("Database error:", dbError);
    // Return a basic sitemap with just the articles index page
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    sitemap += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
    sitemap += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n`;
    sitemap += `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/articles</loc>\n`;
    sitemap += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    sitemap += `    <changefreq>daily</changefreq>\n`;
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
