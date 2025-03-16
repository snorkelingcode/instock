import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import NewsPreview from "@/components/news/NewsPreview";
import FeaturedNews from "@/components/news/FeaturedNews";
import RecentPokemonSets from "@/components/news/RecentPokemonSets";
import UpcomingReleases from "@/components/news/UpcomingReleases";
import { useToast } from "@/hooks/use-toast";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types/article";

const News = () => {
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useMetaTags({
    title: "TCG News and Updates",
    description: "Latest news, updates, and announcements for trading card games including Pokemon, Magic: The Gathering, and Yu-Gi-Oh"
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    if (articles.length) {
      if (selectedCategory === "all") {
        setFilteredArticles(articles);
      } else {
        setFilteredArticles(articles.filter(article => article.category === selectedCategory));
      }
    }
  }, [selectedCategory, articles]);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      // Fetch featured article
      const { data: featuredData, error: featuredError } = await supabase
        .from('articles')
        .select('*')
        .eq('featured', true)
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(1)
        .single();

      if (featuredError && featuredError.code !== 'PGRST116') { // Not found error is ok here
        throw featuredError;
      }

      // Fetch all published articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (articlesError) throw articlesError;
      
      // Set featured article and regular articles
      if (featuredData) {
        setFeaturedArticle(featuredData as Article);
      }
      
      setArticles(articlesData as Article[] || []);
      setFilteredArticles(articlesData as Article[] || []);
    } catch (error: any) {
      console.error("Error fetching articles:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load articles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMMM d, yyyy");
  };

  const handleArticleClick = (articleId: string) => {
    navigate(`/article/${articleId}`);
  };

  // Get unique categories from articles
  const categories = ["all", ...new Set(articles.map(article => article.category))];

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">News & Announcements</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-center">
              <p className="text-gray-500">Loading articles...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <div className="lg:col-span-2">
                {featuredArticle && (
                  <div className="mb-8 cursor-pointer" onClick={() => handleArticleClick(featuredArticle.id)}>
                    <FeaturedNews
                      id={featuredArticle.id}
                      title={featuredArticle.title}
                      date={formatDate(featuredArticle.published_at || featuredArticle.created_at)}
                      category={featuredArticle.category}
                      excerpt={featuredArticle.excerpt}
                      image={featuredArticle.featured_image}
                      onClick={() => handleArticleClick(featuredArticle.id)}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-8">
                <RecentPokemonSets />
                <UpcomingReleases />
              </div>
            </div>

            <Tabs defaultValue="all" className="mb-8">
              <TabsList className="mb-4 flex flex-wrap">
                {categories.map(category => (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize"
                  >
                    {category === "all" ? "All Articles" : category}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={selectedCategory}>
                {filteredArticles.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-gray-500">No articles found in this category.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArticles.map(article => (
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
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
};

export default News;
