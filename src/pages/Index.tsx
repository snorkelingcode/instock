
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Shell } from "@/components/layout/Shell";
import WelcomeCard from "@/components/home/WelcomeCard";
import HowItWorksCard from "@/components/home/HowItWorksCard";
import NewsPreview from "@/components/news/NewsPreview";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types/article";

const Index = () => {
  useMetaTags({
    title: "Home",
    description: "The latest news and updates from the TCG world."
  });

  const navigate = useNavigate();
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMMM d, yyyy");
  };
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);

  // Fetch the latest articles for the homepage
  useEffect(() => {
    fetchLatestArticles();
  }, []);

  const fetchLatestArticles = async () => {
    setIsLoadingArticles(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      
      setArticles(data as Article[] || []);
    } catch (error: any) {
      console.error("Error fetching latest articles:", error);
    } finally {
      setIsLoadingArticles(false);
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
          {isLoadingArticles ? (
            <div className="flex justify-center py-6">
              <p className="text-gray-500">Loading articles...</p>
            </div>
          ) : articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map(article => (
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
              ))}
            </div>
          ) : (
            <div className="flex justify-center py-6">
              <p className="text-gray-500">No articles found.</p>
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
};

export default Index;
