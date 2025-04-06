
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types/article";
import { createSlug } from "@/pages/ArticleDetails";

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

/**
 * Generates sitemap data for all published articles
 */
export async function generateArticleSitemapData(): Promise<SitemapUrl[]> {
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

/**
 * Generates an XML sitemap from the provided URLs
 */
export function generateSitemapXml(urls: SitemapUrl[]): string {
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
