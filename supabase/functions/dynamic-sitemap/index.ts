
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
    
    // Return the XML sitemap
    return new Response(sitemapContent, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
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
  const baseUrl = "https://tcgupdates.com";
  const today = new Date().toISOString().split('T')[0];
  
  const staticUrls = [
    "",                // Home page
    "/about",
    "/contact",
    "/products",
    "/news",
    "/market",
    "/sets",
    "/sets/pokemon",
    "/privacy",
    "/terms",
    "/cookies",
  ];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  // Add each static URL to the sitemap
  for (const url of staticUrls) {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}${url}</loc>\n`;
    sitemap += `    <lastmod>${today}</lastmod>\n`;
    sitemap += `    <changefreq>weekly</changefreq>\n`;
    sitemap += `    <priority>${url === "" ? "1.0" : "0.8"}</priority>\n`;
    sitemap += `  </url>\n`;
  }
  
  sitemap += `</urlset>`;
  return sitemap;
}

// Generate sitemap for articles
async function generateArticlesSitemap(): Promise<string> {
  const baseUrl = "https://tcgupdates.com";
  
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
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  // Add each article URL to the sitemap
  for (const article of articles) {
    // Create slug from title (simplified version)
    const slug = createSlug(article.title);
    
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/article/${slug}</loc>\n`;
    sitemap += `    <lastmod>${article.updated_at.split('T')[0]}</lastmod>\n`;
    sitemap += `    <changefreq>monthly</changefreq>\n`;
    sitemap += `    <priority>0.7</priority>\n`;
    sitemap += `  </url>\n`;
  }
  
  sitemap += `</urlset>`;
  return sitemap;
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
