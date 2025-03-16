
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shell } from "@/components/layout/Shell";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types/article";

const Index = () => {
  useMetaTags({
    title: "Home",
    description: "The latest news and updates from the TCG world."
  });

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

  return (
    <Shell>
      <section className="container mx-auto py-12">
        <h2 className="text-3xl font-bold mb-6">Latest News</h2>
        {isLoadingArticles ? (
          <div className="flex justify-center py-6">
            <p className="text-gray-500">Loading articles...</p>
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => (
              <Card key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-1">
                    <Badge variant="default" className="font-medium">{article.category}</Badge>
                  </div>
                  <CardTitle className="text-xl">{article.title}</CardTitle>
                  <CardDescription className="text-gray-500">
                    <CalendarIcon className="h-4 w-4 mr-2 inline-block align-middle" />
                    {formatDate(article.published_at || article.created_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{article.excerpt}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex justify-center py-6">
            <p className="text-gray-500">No articles found.</p>
          </div>
        )}
      </section>
    </Shell>
  );
};

export default Index;
