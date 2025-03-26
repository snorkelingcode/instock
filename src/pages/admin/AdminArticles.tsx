import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { Article } from "@/types/article";
import { Plus, PenSquare, Trash2, Eye, CalendarRange, RefreshCw } from "lucide-react";

const AdminArticles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingUrls, setIsSubmittingUrls] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  useMetaTags({
    title: "Manage Articles | Admin Dashboard",
    description: "Manage and edit TCG news articles"
  });

  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    fetchArticles();
  }, [isAdmin]);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data as Article[] || []);
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

  const toggleFeature = async (id: string, featured: boolean) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({ 
          featured: !featured,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      setArticles(prev => 
        prev.map(article => 
          article.id === id 
            ? { ...article, featured: !featured } 
            : article
        )
      );
      
      toast({
        title: "Article Updated",
        description: `Article ${!featured ? "featured" : "unfeatured"} successfully`,
      });
    } catch (error: any) {
      console.error("Error updating article featured status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update article",
        variant: "destructive",
      });
    }
  };

  const togglePublish = async (id: string, published: boolean) => {
    try {
      const now = new Date().toISOString();
      
      const { data: articleData, error: fetchError } = await supabase
        .from('articles')
        .select('created_at')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      const publishedAt = !published ? articleData.created_at : null;
      
      const { error } = await supabase
        .from('articles')
        .update({ 
          published: !published,
          published_at: publishedAt,
          updated_at: now
        })
        .eq('id', id);

      if (error) throw error;
      
      setArticles(prev => 
        prev.map(article => 
          article.id === id 
            ? { 
                ...article, 
                published: !published,
                published_at: !published ? articleData.created_at : null 
              } 
            : article
        )
      );
      
      toast({
        title: "Article Updated",
        description: `Article ${!published ? "published" : "unpublished"} successfully`,
      });
    } catch (error: any) {
      console.error("Error updating article publish status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update article",
        variant: "destructive",
      });
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setArticles(prev => prev.filter(article => article.id !== id));
      
      toast({
        title: "Article Deleted",
        description: "Article deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting article:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete article",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const previewArticle = (id: string) => {
    navigate(`/article/${id}`);
  };

  const submitToSearchEngines = async () => {
    // Only submit published articles
    const publishedArticles = articles.filter(article => article.published);
    
    if (publishedArticles.length === 0) {
      toast({
        title: "No Published Articles",
        description: "There are no published articles to submit to search engines.",
        variant: "warning",
      });
      return;
    }
    
    setIsSubmittingUrls(true);
    
    try {
      // Import dynamically to avoid issues if the file isn't loaded yet
      const { notifyIndexNowBatch } = await import('@/utils/indexNow');
      const result = await notifyIndexNowBatch(publishedArticles);
      
      if (result.success) {
        toast({
          title: "URLs Submitted",
          description: `${publishedArticles.length} articles have been submitted to search engines.`,
        });
      } else {
        throw new Error("Failed to submit URLs to search engines");
      }
    } catch (error: any) {
      console.error("Error submitting to search engines:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit URLs to search engines",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingUrls(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <Card className="mb-4">
          <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
            <CardTitle>Admin Tools</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => navigate("/admin/articles/new")}
                className="gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" /> Create New Article
              </Button>
              
              <Button 
                onClick={() => navigate("/admin/pokemon-releases")}
                className="gap-2"
                variant="outline"
              >
                <CalendarRange className="h-4 w-4" /> Manage Pokémon Releases
              </Button>
              
              <Button 
                onClick={submitToSearchEngines}
                className="gap-2"
                variant="outline"
                disabled={isSubmittingUrls}
              >
                <RefreshCw className={`h-4 w-4 ${isSubmittingUrls ? "animate-spin" : ""}`} /> 
                {isSubmittingUrls ? "Submitting..." : "Submit to Search Engines"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
            <CardTitle>Manage Articles</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8">Loading articles...</div>
            ) : articles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No articles found. Create your first article!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">Title</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-left">Created</th>
                      <th className="p-3 text-center">Published</th>
                      <th className="p-3 text-center">Featured</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map(article => (
                      <tr key={article.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            {article.featured_image && (
                              <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0">
                                <img 
                                  src={article.featured_image} 
                                  alt={article.title} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <span className="font-medium">{article.title}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{article.category}</Badge>
                        </td>
                        <td className="p-3">{formatDate(article.created_at)}</td>
                        <td className="p-3 text-center">
                          <Checkbox 
                            checked={article.published}
                            onCheckedChange={() => togglePublish(article.id, article.published)}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <Checkbox 
                            checked={article.featured}
                            onCheckedChange={() => toggleFeature(article.id, article.featured)}
                          />
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="gap-1"
                              onClick={() => previewArticle(article.id)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only md:not-sr-only md:inline-block">Preview</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="gap-1"
                              onClick={() => navigate(`/admin/articles/edit/${article.id}`)}
                            >
                              <PenSquare className="h-4 w-4" />
                              <span className="sr-only md:not-sr-only md:inline-block">Edit</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="gap-1"
                              onClick={() => deleteArticle(article.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only md:not-sr-only md:inline-block">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminArticles;
