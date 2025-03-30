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
    title: "TCG Updates - Trading Card Game Resource",
    description: "TCG Updates provides comprehensive information about trading card game restocks, new releases, market trends, and inventory status for Pokemon, MTG, Yu-Gi-Oh, and more.",
    keywords: "TCG Updates, TCG Updates news, TCG Updates inventory, TCG Updates tracking, trading card game, Pokemon cards, TCG Updates market, MTG cards, Yu-Gi-Oh, card collecting, TCG Updates resources",
    ogTitle: "TCG Updates - Trading Card Game Resource",
    ogDescription: "TCG Updates provides comprehensive information about trading card game restocks, new releases, market trends, and inventory status for Pokemon, MTG, and more.",
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
      "description": "TCG Updates - Your source for trading card game news, inventory tracking, market trends for Pokemon, Magic: The Gathering, Yu-Gi-Oh and other TCGs.",
      "publisher": {
        "@type": "Organization",
        "name": "TCG Updates",
        "logo": {
          "@type": "ImageObject",
          "url": "https://tcgupdates.com/lovable-uploads/tcg-updates-logo.png"
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
    <Shell pageTitle="TCG Updates - Trading Card Game News">
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-red-800 mb-8 text-center">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <WelcomeCard />
          <HowItWorksCard />
        </div>
          </h1>
        
        <section className="mt-12 mb-16">
          <h2 className="text-3xl font-bold mb-6">Latest TCG Updates and News</h2>
          
          {/* SEO content - hidden from users but visible to crawlers */}
          <div className="sr-only">
            TCG Updates is your ultimate destination for trading card game information. 
            TCG Updates keeps collectors and players informed about restocks, market trends, and inventory status. 
            TCG Updates covers all major trading card games including Pokemon, Magic: The Gathering, and Yu-Gi-Oh.
            With TCG Updates, you'll never miss important product announcements or market changes.
          </div>
          
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
        
        {/* Additional SEO content at the bottom */}
        <footer className="sr-only">
          TCG Updates - The trusted source for trading card game news and market analysis.
          TCG Updates monitors inventory levels across major retailers.
          TCG Updates tracks price trends in the secondary market.
          TCG Updates provides alerts for new releases and restocks.
        </footer>
      </div>
    </Shell>
  );
};

export default Index;
