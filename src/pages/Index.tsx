import React, { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Shell } from "@/components/layout/Shell";
import WelcomeCard from "@/components/home/WelcomeCard";
import HowItWorksCard from "@/components/home/HowItWorksCard";
import NewsPreview from "@/components/news/NewsPreview";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types/article";
import { Loader2 } from "lucide-react";

const ARTICLES_PER_PAGE = 6;

const Index = () => {
  useMetaTags({
    title: "Home",
    description: "The latest news and updates from the TCG world."
  });

  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMMM d, yyyy");
  };

  // Fetch articles with pagination
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
          
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, index) => {
                if (articles.length === index + 1) {
                  return (
                    <div ref={lastArticleRef} key={article.id}>
                      <NewsPreview
                        id={article.id}
                        title={article.title}
                        date={formatDate(article.published_at || article.created_at)}
                        category={article.category}
                        excerpt={article.excerpt}
                        featured={article.featured}
                        image={article.featured_image}
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
                      date={formatDate(article.published_at || article.created_at)}
                      category={article.category}
                      excerpt={article.excerpt}
                      featured={article.featured}
                      image={article.featured_image}
                      onClick={() => handleArticleClick(article.id)}
                    />
                  );
                }
              })}
            </div>
          ) : (
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
