
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types/article";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const ArticleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useMetaTags({
    title: article?.title || "Article",
    description: article?.excerpt || "Loading article..."
  });

  useEffect(() => {
    if (id) {
      fetchArticle(id);
    }
  }, [id]);

  const fetchArticle = async (articleId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .eq('published', true)
        .single();

      if (error) throw error;
      
      if (data) {
        setArticle(data as Article);
      } else {
        navigate('/news');
        toast({
          title: "Article not found",
          description: "The article you're looking for doesn't exist or isn't published",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error fetching article:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load article",
        variant: "destructive",
      });
      navigate('/news');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMMM d, yyyy");
  };

  // Helper function to chunk additional images into groups of 3
  const chunkImages = (images: string[]) => {
    const chunks = [];
    for (let i = 0; i < images.length; i += 3) {
      chunks.push(images.slice(i, i + 3));
    }
    return chunks;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-6 w-1/4 bg-gray-200 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Article not found</h2>
          <p className="mb-4">The article you're looking for doesn't exist or isn't published.</p>
          <Button onClick={() => navigate('/news')}>Return to News</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate('/news')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to News
        </Button>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {article.featured_image && (
            <div className="w-full h-[300px] relative bg-gray-100">
              <img 
                src={article.featured_image} 
                alt={article.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <Badge variant="default" className="font-medium">{article.category}</Badge>
              {article.featured && (
                <Badge className="bg-red-500 hover:bg-red-600">Featured</Badge>
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-3">{article.title}</h1>
            
            <div className="flex items-center text-gray-500 mb-6">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span>{formatDate(article.published_at || article.created_at)}</span>
            </div>
            
            <div className="prose max-w-none">
              {article.content.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4 text-gray-700">{paragraph}</p>
              ))}
            </div>
            
            {article.additional_images && article.additional_images.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Additional Images</h3>
                <Carousel className="w-full max-w-xl mx-auto">
                  <CarouselContent>
                    {chunkImages(article.additional_images).map((imageGroup, groupIndex) => (
                      <CarouselItem key={groupIndex}>
                        <div className="grid grid-cols-3 gap-2 p-1">
                          {imageGroup.map((image, idx) => (
                            <div key={idx} className="aspect-square flex items-center justify-center">
                              <img 
                                src={image} 
                                alt={`Additional image ${groupIndex * 3 + idx + 1}`} 
                                className="max-h-full max-w-full object-contain rounded-md"
                              />
                            </div>
                          ))}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-0" />
                  <CarouselNext className="right-0" />
                </Carousel>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ArticleDetails;
