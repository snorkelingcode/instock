
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
