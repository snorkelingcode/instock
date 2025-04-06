
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// Define CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
};

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to create a slug from a title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '_')     // Replace spaces with underscores
    .replace(/-+/g, '_');     // Replace hyphens with underscores
}

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  images?: Array<{
    loc: string;
    caption?: string;
    title?: string;
  }>;
}

// Generate sitemap XML from article data
async function generateArticleSitemapData(): Promise<SitemapUrl[]> {
  try {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching articles for sitemap:", error);
      return [];
    }

    if (!articles || articles.length === 0) {
      return [];
    }

    const sitemapUrls: SitemapUrl[] = articles.map(article => {
      const slug = createSlug(article.title);
      const lastmod = article.updated_at || article.published_at || article.created_at;
      
      const entry: SitemapUrl = {
        loc: `https://tcgupdates.com/articles/${slug}`,
        lastmod: lastmod ? new Date(lastmod).toISOString().split('T')[0] : undefined,
        changefreq: 'weekly',
        priority: article.featured ? '0.8' : '0.7'
      };
      
      // Add image if available
      if (article.featured_image) {
        entry.images = [{
          loc: article.featured_image,
          caption: article.title,
          title: article.title
        }];
      }
      
      return entry;
    });
    
    return sitemapUrls;
  } catch (error) {
    console.error("Error generating sitemap data:", error);
    return [];
  }
}

// Generate XML sitemap
function generateSitemapXml(urls: SitemapUrl[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
  xml += '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n';
  xml += '                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n';
  
  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    
    if (url.lastmod) {
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    }
    
    if (url.changefreq) {
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    }
    
    if (url.priority) {
      xml += `    <priority>${url.priority}</priority>\n`;
    }
    
    if (url.images && url.images.length > 0) {
      url.images.forEach(image => {
        xml += '    <image:image>\n';
        xml += `      <image:loc>${image.loc}</image:loc>\n`;
        
        if (image.caption) {
          xml += `      <image:caption>${image.caption}</image:caption>\n`;
        }
        
        if (image.title) {
          xml += `      <image:title>${image.title}</image:title>\n`;
        }
        
        xml += '    </image:image>\n';
      });
    }
    
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  
  return xml;
}

// Handle requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get article URLs
    const articleUrls = await generateArticleSitemapData();
    
    // Define static URLs
    const staticUrls: SitemapUrl[] = [
      { loc: 'https://tcgupdates.com/', changefreq: 'daily', priority: '1.0', lastmod: new Date().toISOString().split('T')[0] },
      { loc: 'https://tcgupdates.com/news', changefreq: 'daily', priority: '0.9', lastmod: new Date().toISOString().split('T')[0] },
      { loc: 'https://tcgupdates.com/products', changefreq: 'daily', priority: '0.9', lastmod: new Date().toISOString().split('T')[0] },
      { loc: 'https://tcgupdates.com/market', changefreq: 'daily', priority: '0.9', lastmod: new Date().toISOString().split('T')[0] },
      { loc: 'https://tcgupdates.com/sets', changefreq: 'weekly', priority: '0.8', lastmod: new Date().toISOString().split('T')[0] },
      { loc: 'https://tcgupdates.com/sets/pokemon', changefreq: 'weekly', priority: '0.8', lastmod: new Date().toISOString().split('T')[0] },
      { loc: 'https://tcgupdates.com/about', changefreq: 'monthly', priority: '0.7', lastmod: new Date().toISOString().split('T')[0] },
      { loc: 'https://tcgupdates.com/contact', changefreq: 'monthly', priority: '0.7', lastmod: new Date().toISOString().split('T')[0] },
      { loc: 'https://tcgupdates.com/privacy', changefreq: 'monthly', priority: '0.5', lastmod: new Date().toISOString().split('T')[0] },
      { loc: 'https://tcgupdates.com/terms', changefreq: 'monthly', priority: '0.5', lastmod: new Date().toISOString().split('T')[0] },
      { loc: 'https://tcgupdates.com/cookies', changefreq: 'monthly', priority: '0.5', lastmod: new Date().toISOString().split('T')[0] }
    ];
    
    // Combine static and dynamic URLs
    const allUrls = [...staticUrls, ...articleUrls];
    
    // Generate XML
    const sitemapXml = generateSitemapXml(allUrls);
    
    // Return XML response
    return new Response(sitemapXml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    
    return new Response(JSON.stringify({ error: 'Failed to generate sitemap' }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
