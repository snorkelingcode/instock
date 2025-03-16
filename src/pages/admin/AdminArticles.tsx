
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
import { Plus, PenSquare, Trash2, Eye, CalendarDays, BoxIcon } from "lucide-react";

const AdminArticles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  useMetaTags({
    title: "Manage Articles | Admin Dashboard",
    description: "Manage and edit TCG news articles"
  });

  useEffect(() => {
    // Redirect if not admin
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
      
      // Update local state
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
      const { error } = await supabase
        .from('articles')
        .update({ 
          published: !published,
          published_at: !published ? now : null,
          updated_at: now
        })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setArticles(prev => 
        prev.map(article => 
          article.id === id 
            ? { 
                ...article, 
                published: !published,
                published_at: !published ? now : null 
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
      
      // Update local state
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

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate("/admin/articles/new")}>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <Plus className="h-12 w-12 text-blue-600 mb-3" />
              <h3 className="text-lg font-medium mb-1">Create New Article</h3>
              <p className="text-gray-500 text-sm">Add a new article to the news section</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate("/admin/recent-releases")}>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <BoxIcon className="h-12 w-12 text-green-600 mb-3" />
              <h3 className="text-lg font-medium mb-1">Manage Recent Releases</h3>
              <p className="text-gray-500 text-sm">Update recent Pokémon TCG releases</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate("/admin/upcoming-releases")}>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <CalendarDays className="h-12 w-12 text-purple-600 mb-3" />
              <h3 className="text-lg font-medium mb-1">Manage Upcoming Releases</h3>
              <p className="text-gray-500 text-sm">Update upcoming Pokémon TCG releases</p>
            </CardContent>
          </Card>
        </div>
        
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
