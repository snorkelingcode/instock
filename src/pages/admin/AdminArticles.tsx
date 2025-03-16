
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
      // Use PostgreSQL RPC function to get articles
      const { data, error } = await supabase.rpc('get_all_articles');

      if (error) throw error;
      setArticles(data || []);
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
      // Use PostgreSQL RPC function to toggle featured status
      const { error } = await supabase
        .rpc('toggle_article_featured', { 
          article_id: id, 
          is_featured: !featured 
        });

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
      // Use PostgreSQL RPC function to toggle publish status
      const { error } = await supabase
        .rpc('toggle_article_published', { 
          article_id: id, 
          is_published: !published 
        });

      if (error) throw error;
      
      // Update local state
      setArticles(prev => 
        prev.map(article => 
          article.id === id 
            ? { ...article, published: !published } 
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
      // Use PostgreSQL RPC function to delete article
      const { error } = await supabase
        .rpc('delete_article', { article_id: id });

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

  return (
    <Layout>
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manage Articles</CardTitle>
          <Button onClick={() => navigate("/admin/articles/new")}>
            Create New Article
          </Button>
        </CardHeader>
        <CardContent>
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
                    <th className="p-2 text-left">Title</th>
                    <th className="p-2 text-left">Category</th>
                    <th className="p-2 text-left">Created</th>
                    <th className="p-2 text-center">Published</th>
                    <th className="p-2 text-center">Featured</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map(article => (
                    <tr key={article.id} className="border-b border-gray-200">
                      <td className="p-2">
                        <span className="font-medium">{article.title}</span>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{article.category}</Badge>
                      </td>
                      <td className="p-2">{formatDate(article.created_at)}</td>
                      <td className="p-2 text-center">
                        <Checkbox 
                          checked={article.published}
                          onCheckedChange={() => togglePublish(article.id, article.published)}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <Checkbox 
                          checked={article.featured}
                          onCheckedChange={() => toggleFeature(article.id, article.featured)}
                        />
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/admin/articles/edit/${article.id}`)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteArticle(article.id)}
                          >
                            Delete
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
    </Layout>
  );
};

export default AdminArticles;
