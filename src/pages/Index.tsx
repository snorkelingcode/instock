
import React, { useState, useEffect, useRef, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Shell } from "@/components/layout/Shell";
import WelcomeCard from "@/components/home/WelcomeCard";
import HowItWorksCard from "@/components/home/HowItWorksCard";
import NewsPreview from "@/components/news/NewsPreview";
import FeaturedNews from "@/components/news/FeaturedNews";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types/article";
import { Loader2 } from "lucide-react";

const ARTICLES_PER_PAGE = 6;

const Index = () => {
  useMetaTags({
    title: "TCG Updates - Trading Card Game News, Inventory Tracking & DIY Accessories",
    description: "Get the latest news, in-stock alerts, and DIY tips for Pokemon, Magic: The Gathering, Yu-Gi-Oh and other trading card games. Track inventory across major retailers.",
    keywords: "TCG news, Pokemon cards, MTG, Yu-Gi-Oh, trading card games, in-stock alerts, DIY card accessories, card collecting",
    ogTitle: "TCG Updates - Your Complete Trading Card Game Resource",
    ogDescription: "Stay informed with breaking news, inventory tracking, and DIY projects for all major trading card games.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "TCG Updates",
      "url": "https://tcgupdates.com/",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://tcgupdates.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      },
      "description": "Trading card game news, inventory tracking and DIY accessories for Pokemon, Magic: The Gathering, Yu-Gi-Oh and other TCGs.",
      "publisher": {
        "@type": "Organization",
        "name": "TCG Updates",
        "logo": {
          "@type": "ImageObject",
          "url": "https://tcgupdates.com/lovable-uploads/e60afbdf-2426-466b-ae0b-ebe03404efc4.png"
        }
      }
    }
  });

  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastArticleRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date';
    
    try {
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };

  // Fetch featured articles once at component mount
  useEffect(() => {
    const fetchFeaturedArticles = async () => {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('published', true)
          .eq('featured', true)
          .order('published_at', { ascending: false });
        
        if (error) throw error;
        setFeaturedArticles(data as Article[]);
      } catch (error: any) {
        console.error("Error fetching featured articles:", error);
      }
    };
    
    fetchFeaturedArticles();
  }, []);

  // Fetch non-featured articles with pagination
  useEffect(() => {
    fetchArticles();
  }, [page]);

  const fetchArticles = async () => {
    if (!hasMore || isLoading) return;
    
    setIsLoading(true);
    try {
      const from = page * ARTICLES_PER_PAGE;
      const to = from + ARTICLES_PER_PAGE - 1;
      
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .eq('featured', false)
        .order('published_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      if (data.length < ARTICLES_PER_PAGE) {
        setHasMore(false);
      }
      
      setArticles(prevArticles => [...prevArticles, ...(data as Article[])]);
    } catch (error: any) {
      console.error("Error fetching articles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArticleClick = (articleId: string) => {
    navigate(`/article/${articleId}`);
  };

  return (
    <Shell>
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <WelcomeCard />
          <HowItWorksCard />
        </div>
        
        <section className="mt-12 mb-16">
          <h2 className="text-3xl font-bold mb-6">Latest News</h2>
          
          {/* Featured Articles */}
          {featuredArticles.length > 0 && (
            <div className="mb-10">
              <h3 className="text-xl font-semibold mb-4">Featured Stories</h3>
              <div className="grid grid-cols-1 gap-6 mb-8">
                {featuredArticles.map((article) => (
                  <FeaturedNews
                    key={article.id}
                    id={article.id}
                    title={article.title}
                    date={formatDate(article.published_at)}
                    category={article.category}
                    excerpt={article.excerpt}
                    image={article.featured_image}
                    video={article.featured_video}
                    mediaType={article.media_type}
                    onClick={() => handleArticleClick(article.id)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Regular Articles Grid */}
          {articles.length > 0 && (
            <>
              {featuredArticles.length > 0 && <h3 className="text-xl font-semibold mb-4">More Stories</h3>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article, index) => {
                  if (articles.length === index + 1) {
                    return (
                      <div ref={lastArticleRef} key={article.id}>
                        <NewsPreview
                          id={article.id}
                          title={article.title}
                          date={formatDate(article.published_at)}
                          category={article.category}
                          excerpt={article.excerpt}
                          featured={article.featured}
                          image={article.featured_image}
                          video={article.featured_video}
                          mediaType={article.media_type}
                          onClick={() => handleArticleClick(article.id)}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <NewsPreview
                        key={article.id}
                        id={article.id}
                        title={article.title}
                        date={formatDate(article.published_at)}
                        category={article.category}
                        excerpt={article.excerpt}
                        featured={article.featured}
                        image={article.featured_image}
                        video={article.featured_video}
                        mediaType={article.media_type}
                        onClick={() => handleArticleClick(article.id)}
                      />
                    );
                  }
                })}
              </div>
            </>
          )}
          
          {articles.length === 0 && featuredArticles.length === 0 && (
            <div className="flex justify-center py-6">
              <p className="text-gray-500">No articles found.</p>
            </div>
          )}
          
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
};

export default Index;
