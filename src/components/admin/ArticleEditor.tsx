
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Image as ImageIcon } from "lucide-react";
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
    published: false,
    featured_image: "",
    additional_images: []
  });
  
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
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
          published: data.published,
          featured_image: data.featured_image || "",
          additional_images: data.additional_images || []
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

  const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFeaturedImageFile(e.target.files[0]);
      // Create temporary URL for preview
      setFormData(prev => ({ 
        ...prev, 
        featured_image: URL.createObjectURL(e.target.files![0]) 
      }));
    }
  };

  const handleAdditionalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFile = e.target.files[0];
      setAdditionalImageFiles(prev => [...prev, newFile]);
      
      // Create temporary URL for preview
      const newImageUrl = URL.createObjectURL(newFile);
      setFormData(prev => ({
        ...prev,
        additional_images: [...(prev.additional_images || []), newImageUrl]
      }));
    }
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImageFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      additional_images: prev.additional_images?.filter((_, i) => i !== index) || []
    }));
  };

  const removeFeaturedImage = () => {
    setFeaturedImageFile(null);
    setFormData(prev => ({ ...prev, featured_image: "" }));
  };

  // Function to upload an image and get its URL
  const uploadImage = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(filePath, file);
      
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('article-images')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
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
      // Upload images if provided
      let featuredImageUrl = formData.featured_image;
      let additionalImageUrls = [...(formData.additional_images || [])];
      
      if (featuredImageFile) {
        featuredImageUrl = await uploadImage(featuredImageFile, 'featured');
      }
      
      if (additionalImageFiles.length > 0) {
        const newUrls = await Promise.all(
          additionalImageFiles.map(file => uploadImage(file, 'additional'))
        );
        
        // Filter out temporary blob URLs and append new URLs
        additionalImageUrls = [
          ...additionalImageUrls.filter(url => !url.startsWith('blob:')),
          ...newUrls
        ];
      }
      
      const now = new Date().toISOString();
      const articleData = {
        ...formData,
        featured_image: featuredImageUrl,
        additional_images: additionalImageUrls,
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
            <Label>Featured Image</Label>
            <div className="border rounded-md p-4">
              {formData.featured_image ? (
                <div className="relative">
                  <img 
                    src={formData.featured_image} 
                    alt="Featured" 
                    className="w-full h-48 object-cover rounded"
                  />
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm" 
                    className="absolute top-2 right-2" 
                    onClick={removeFeaturedImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 bg-gray-100 rounded">
                  <label className="cursor-pointer text-center">
                    <div className="flex flex-col items-center">
                      <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                      <span className="text-gray-500">Upload Featured Image</span>
                    </div>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFeaturedImageChange} 
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Additional Images</Label>
            <div className="border rounded-md p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {formData.additional_images?.map((image, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={image} 
                      alt={`Additional ${index}`} 
                      className="w-full h-24 object-cover rounded"
                    />
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm" 
                      className="absolute top-2 right-2" 
                      onClick={() => removeAdditionalImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <label className="cursor-pointer border-2 border-dashed rounded flex items-center justify-center h-24 bg-gray-50">
                  <div className="flex flex-col items-center">
                    <Plus className="h-6 w-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">Add Image</span>
                  </div>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAdditionalImageChange} 
                  />
                </label>
              </div>
            </div>
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
