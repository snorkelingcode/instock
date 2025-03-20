import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Share2 } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import ReadAloud from '@/components/articles/ReadAloud';
import CommentSection from '@/components/articles/CommentSection';

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

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : article ? (
          <>
            {/* Article Header */}
            <div className="mb-6">
              <Badge className="mb-2">{article.category}</Badge>
              <h1 className="text-3xl font-bold">{article.title}</h1>
            </div>
            
            {/* Featured Image */}
            {article.featured_image && (
              <img
                src={article.featured_image}
                alt={article.title}
                className="w-full rounded-md mb-6"
              />
            )}
            
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-gray-500">
              <div className="flex items-center">
                <CalendarDays className="mr-2 h-4 w-4" />
                Published on {formatDate(article.published_at || article.created_at)}
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Updated on {formatDate(article.updated_at)}
              </div>
              <button onClick={shareArticle} className="flex items-center hover:text-blue-500">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </button>
            </div>
            
            {/* Content with optional text-to-speech */}
            <div className="relative">
              <ReadAloud content={article.content} />
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
            </div>
            
            {/* Comments Section */}
            <CommentSection articleId={article.id} />
          </>
        ) : (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-4">Article Not Found</h2>
            <p className="text-gray-500">Sorry, the article you are looking for could not be found.</p>
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
