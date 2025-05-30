
import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, Share2, MessageSquare, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import ReadAloud from '@/components/articles/ReadAloud';
import CommentSection from '@/components/articles/CommentSection';
import { Card } from '@/components/ui/card';
import ImageCarousel from '@/components/articles/ImageCarousel';
import { Article } from '@/types/article';
import { useMetaTags } from '@/hooks/use-meta-tags';
import ArticleStructuredData from '@/components/seo/ArticleStructuredData';
import { notifyIndexNowSingleUrl } from '@/utils/indexNow';

export const createSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '_')     // Replace spaces with underscores
    .replace(/-+/g, '_');     // Replace hyphens with underscores
};

const extractYoutubeId = (url: string): string | null => {
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[1].length === 11) ? match[1] : null;
};

const ArticleDetails = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const autoplay = searchParams.get('autoplay') === 'true';

  useMetaTags(article ? {
    title: article.title || 'Article',
    description: article.excerpt || 'Read this interesting article on TCG Updates',
    ogTitle: article.title,
    ogDescription: article.excerpt,
    ogImage: article.featured_image,
    keywords: `trading card game, tcg, ${article.category}, ${article.title}`,
    canonicalUrl: `https://tcgupdates.com/articles/${createSlug(article.title)}`,
  } : {
    title: "Article",
    description: "Trading card game article - TCG Updates"
  });

  useEffect(() => {
    if (id) {
      fetchArticleById(id);
    } else if (slug) {
      fetchArticleBySlug(slug);
    }
  }, [id, slug]);

  const fetchArticleById = async (articleId: string) => {
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
      
      const articleSlug = createSlug(data.title);
      if (location.pathname.startsWith('/article/')) {
        navigate(`/articles/${articleSlug}`, { replace: true });
      }
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

  const fetchArticleBySlug = async (articleSlug: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .filter('published', 'eq', true);

      if (error) {
        throw error;
      }

      const foundArticle = data.find((dbArticle) => 
        createSlug(dbArticle.title) === articleSlug
      );

      if (!foundArticle) {
        throw new Error("Article not found");
      }

      setArticle(foundArticle as Article);
    } catch (error) {
      console.error("Error fetching article by slug:", error);
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

  useEffect(() => {
    if (article && article.published) {
      notifyIndexNowSingleUrl(article)
        .then(result => {
          console.log("IndexNow notification result:", result);
        })
        .catch(err => {
          console.error("Error notifying search engines:", err);
        });
    }
  }, [article?.id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date';
    
    try {
      return format(parseISO(dateString), 'MMMM dd, yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };

  const shareArticle = () => {
    if (article) {
      const articleSlug = createSlug(article.title);
      const shareUrl = `${window.location.origin}/articles/${articleSlug}`;
      
      if (navigator.share) {
        navigator.share({
          title: article.title || 'Check out this article',
          text: article.excerpt || 'Read this interesting article',
          url: shareUrl,
        })
        .then(() => console.log('Successful share'))
        .catch((error) => console.error('Error sharing:', error));
      } else {
        navigator.clipboard.writeText(shareUrl)
          .then(() => {
            toast({
              title: "Link copied",
              description: "Article link copied to clipboard",
            });
          })
          .catch(console.error);
      }
    }
  };

  // Remove this function as we're now directly using the HTML content
  // const formatContent = (content: string) => {
  //   const paragraphs = content.split('\n').filter(paragraph => paragraph.trim() !== '');
  //   return paragraphs.map(paragraph => `<p class="mb-6">${paragraph}</p>`).join('');
  // };

  const handleGoBack = () => {
    navigate(-1);
  };

  const hasAdditionalImages = article?.additional_images && article.additional_images.length > 0;
  
  const youtubeEmbedUrl = article?.featured_video ? 
    `https://www.youtube.com/embed/${extractYoutubeId(article.featured_video)}` : 
    '';

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : article ? (
          <>
            <ArticleStructuredData article={article} />
            
            <div className="mb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mb-4 flex items-center text-gray-600 hover:text-gray-900" 
                onClick={handleGoBack}
                aria-label="Go back"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Badge className="mb-2">{article.category}</Badge>
              <h1 className="text-3xl font-bold">{article.title}</h1>
            </div>
            
            {article.featured_image && (!article.media_type || article.media_type === 'image') && (
              <img
                src={article.featured_image}
                alt={article.title}
                className="w-full h-auto rounded-lg mb-6 shadow-md object-cover"
              />
            )}

            {article.featured_video && youtubeEmbedUrl && (article.media_type === 'video') && (
              <div className="aspect-video w-full mb-6 overflow-hidden rounded-lg shadow-md">
                <iframe 
                  src={youtubeEmbedUrl}
                  title={article.title}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {article.published_at 
                    ? `Published on ${formatDate(article.published_at)}` 
                    : `Created on ${formatDate(article.created_at)}`}
                </div>
                {article.updated_at !== article.published_at && article.updated_at !== article.created_at && (
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Last updated on {formatDate(article.updated_at)}
                  </div>
                )}
              </div>
              <ReadAloud title={article.title} content={article.content} autoplay={autoplay} />
            </div>
            
            <div className="relative">
              <div 
                className="prose prose-lg max-w-none bg-white p-5 rounded-lg shadow-sm article-content" 
                dangerouslySetInnerHTML={{ 
                  __html: article.content
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
