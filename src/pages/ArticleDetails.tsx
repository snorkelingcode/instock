import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Share2, MessageSquare } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import ReadAloud from '@/components/articles/ReadAloud';
import CommentSection from '@/components/articles/CommentSection';
import { Card } from '@/components/ui/card';
import ImageCarousel from '@/components/articles/ImageCarousel';

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author_id: string;
  category: string;
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
  published_at: string;
  featured_image: string;
  additional_images?: string[];
}

const ArticleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchArticle(id);
    }
  }, [id]);

  const fetchArticle = async (articleId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single();

      if (error) {
        throw error;
      }

      setArticle(data as Article);
    } catch (error) {
      console.error("Error fetching article:", error);
      toast({
        title: "Error",
        description: "Failed to load article. Please try again later.",
        variant: "destructive",
      });
      setArticle(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMMM dd, yyyy');
  };

  const shareArticle = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title || 'Check out this article',
        text: article?.excerpt || 'Read this interesting article',
        url: window.location.href,
      })
      .then(() => console.log('Successful share'))
      .catch((error) => console.error('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          toast({
            title: "Link copied",
            description: "Article link copied to clipboard",
          });
        })
        .catch(console.error);
    }
  };

  const formatContent = (content: string) => {
    const paragraphs = content.split('\n').filter(paragraph => paragraph.trim() !== '');
    return paragraphs.map(paragraph => `<p class="mb-6">${paragraph}</p>`).join('');
  };

  const hasAdditionalImages = article?.additional_images && article.additional_images.length > 0;

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : article ? (
          <>
            <div className="mb-6">
              <Badge className="mb-2">{article.category}</Badge>
              <h1 className="text-3xl font-bold">{article.title}</h1>
            </div>
            
            {article.featured_image && (
              <img
                src={article.featured_image}
                alt={article.title}
                className="w-full h-auto rounded-lg mb-6 shadow-md object-cover"
              />
            )}
            
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Published on {formatDate(article.published_at || article.created_at)}
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Updated on {formatDate(article.updated_at)}
                </div>
              </div>
              <ReadAloud title={article.title} content={article.content} />
            </div>
            
            <div className="relative">
              <div 
                className="prose prose-lg max-w-none bg-white p-5 rounded-lg shadow-sm" 
                dangerouslySetInnerHTML={{ 
                  __html: formatContent(article.content)
                }} 
              />
            </div>

            {hasAdditionalImages && (
              <ImageCarousel 
                images={article.additional_images || []} 
                title="Gallery" 
              />
            )}
            
            <Card className="mt-12 bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Join the Discussion
                </h2>
                <button 
                  onClick={shareArticle} 
                  className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Article
                </button>
              </div>
              <CommentSection articleId={article.id} />
            </Card>
          </>
        ) : (
          <div className="text-center py-10 bg-white rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Article Not Found</h2>
            <p className="text-gray-500 mb-4">Sorry, the article you are looking for could not be found.</p>
            <Link to="/news" className="text-blue-500 hover:underline">
              Back to News
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ArticleDetails;
