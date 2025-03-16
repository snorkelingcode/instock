
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Article, ArticleFormData } from "@/types/article";

// Article categories
const CATEGORIES = [
  "Product News",
  "Retailer Updates",
  "Restocks",
  "Market Analysis",
  "Release Dates",
  "Events",
  "New Release"
];

const ArticleEditor = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  
  const [formData, setFormData] = useState<ArticleFormData>({
    title: "",
    content: "",
    excerpt: "",
    category: CATEGORIES[0],
    featured: false,
    published: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Redirect if not an admin
    if (!isLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    // Fetch article data if editing
    if (isEditing && id) {
      fetchArticle(id);
    }
  }, [isAdmin, id]);

  const fetchArticle = async (articleId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          title: data.title,
          content: data.content,
          excerpt: data.excerpt,
          category: data.category,
          featured: data.featured,
          published: data.published
        });
      }
    } catch (error: any) {
      console.error("Error fetching article:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load article",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to save articles",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const now = new Date().toISOString();
      const articleData = {
        ...formData,
        author_id: user.id,
        updated_at: now,
        published_at: formData.published ? now : null
      };
      
      if (isEditing && id) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('articles')
          .insert([{
            ...articleData,
            created_at: now
          }]);
        
        if (error) throw error;
      }
      
      toast({
        title: isEditing ? "Article Updated" : "Article Created",
        description: isEditing 
          ? "Your article has been successfully updated" 
          : "Your article has been successfully created",
      });
      
      // Redirect to article list
      navigate("/admin/articles");
    } catch (error: any) {
      console.error("Error saving article:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save article",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading article data...</div>;
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Article" : "Create New Article"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Article Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter article title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="excerpt">Article Excerpt/Summary</Label>
            <Textarea
              id="excerpt"
              name="excerpt"
              placeholder="Write a brief summary of the article"
              value={formData.excerpt}
              onChange={handleChange}
              required
              className="min-h-[100px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Article Content</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Write your article content here"
              value={formData.content}
              onChange={handleChange}
              required
              className="min-h-[300px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={handleSelectChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-8">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="featured" 
                checked={formData.featured}
                onCheckedChange={(checked) => 
                  handleCheckboxChange('featured', checked === true)
                }
              />
              <Label htmlFor="featured">Featured Article</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="published" 
                checked={formData.published}
                onCheckedChange={(checked) => 
                  handleCheckboxChange('published', checked === true)
                }
              />
              <Label htmlFor="published">Publish Article</Label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/admin/articles")}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : (isEditing ? 'Update Article' : 'Create Article')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ArticleEditor;
