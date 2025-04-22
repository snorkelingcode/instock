
import React, { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import { createSlug } from "@/pages/ArticleDetails";
import { Article } from "@/types/article";
import { notifyIndexNowSingleUrl } from "@/utils/indexNow";

interface SitemapManagerProps {
  children?: React.ReactNode;
}

/**
 * SitemapManager component that handles SEO-related tasks for new content
 */
const SitemapManager: React.FC<SitemapManagerProps> = ({ children }) => {
  const { toast } = useToast();
  const location = useLocation();
  
  // Handles article publishing events
  useEffect(() => {
    const channel = supabase
      .channel('article-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'articles',
          filter: 'published=eq.true',
        },
        async (payload) => {
          const newArticle = payload.new as Article;
          
          // Only trigger for newly published articles
          if (newArticle.published && payload.old && !payload.old.published) {
            console.log('New article published:', newArticle.title);
            
            try {
              // Notify search engines
              const indexResult = await notifyIndexNowSingleUrl(newArticle);
              
              if (indexResult.success) {
                console.log('Successfully notified search engines about new article');
              } else {
                console.error('Failed to notify search engines:', indexResult.error);
              }
            } catch (error) {
              console.error('Error notifying search engines:', error);
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Function to check if the sitemaps are valid
  const checkSitemapValidity = async () => {
    try {
      // Array of sitemap URLs to check
      const sitemapUrls = [
        "https://www.tcgupdates.com/sitemap.xml",
        "https://www.tcgupdates.com/sitemap-static.xml",
        "https://www.tcgupdates.com/sitemap-articles.xml"
      ];
      
      // Check each sitemap
      for (const url of sitemapUrls) {
        const response = await fetch(url, { 
          method: "GET",
          headers: {
            "Accept": "application/xml"
          }
        });
        
        if (!response.ok) {
          console.error(`Sitemap ${url} returned status: ${response.status}`);
          continue;
        }
        
        const contentType = response.headers.get("Content-Type");
        if (!contentType || !contentType.includes("application/xml")) {
          console.error(`Sitemap ${url} has incorrect Content-Type: ${contentType}`);
        }
        
        // Try to parse the XML to check if it's valid
        const text = await response.text();
        if (!text.trim().startsWith('<?xml')) {
          console.error(`Sitemap ${url} doesn't start with XML declaration`);
        }
        
        console.log(`Sitemap ${url} is valid`);
      }
    } catch (error) {
      console.error("Error checking sitemaps:", error);
    }
  };
  
  // Helper function to manually trigger sitemap regeneration
  const regenerateSitemaps = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("dynamic-sitemap", {
        body: { regenerate: true }
      });
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to regenerate sitemaps",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Sitemaps have been regenerated",
      });
      
      // Check validity after regenerating
      await checkSitemapValidity();
    } catch (err) {
      console.error("Error regenerating sitemaps:", err);
      toast({
        title: "Error",
        description: "Failed to regenerate sitemaps",
        variant: "destructive",
      });
    }
  };
  
  // Return children without rendering anything
  return <>{children}</>;
};

export default SitemapManager;
