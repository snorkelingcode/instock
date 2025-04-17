import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Image as ImageIcon, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Article, ArticleFormData } from "@/types/article";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import RichTextEditor from "./RichTextEditor";

const CATEGORIES = [
  "Product News",
  "Retailer Updates",
  "Restocks",
  "Market Analysis",
  "Release Dates",
  "Events",
  "New Release"
];

const extractYoutubeId = (url: string): string | null => {
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[1].length === 11) ? match[1] : null;
};

const isValidYoutubeUrl = (url: string): boolean => {
  return !!extractYoutubeId(url);
};

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
    featured_video: "",
    media_type: "image",
    additional_images: []
  });
  
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeError, setYoutubeError] = useState("");
  const [editorMode, setEditorMode] = useState<'plain' | 'html'>('plain');

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

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
        if (data.featured_video) {
          setYoutubeUrl(data.featured_video);
        }
        
        setFormData({
          title: data.title,
          content: data.content,
          excerpt: data.excerpt,
          category: data.category,
          featured: data.featured,
          published: data.published,
          featured_image: data.featured_image || "",
          featured_video: data.featured_video || "",
          media_type: (data.media_type as 'image' | 'video') || "image",
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

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleMediaTypeChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      media_type: value as 'image' | 'video' 
    }));
  };

  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    
    if (url && !isValidYoutubeUrl(url)) {
      setYoutubeError("Please enter a valid YouTube URL");
    } else {
      setYoutubeError("");
      if (url) {
        setFormData(prev => ({
          ...prev,
          featured_video: url,
          media_type: "video"
        }));
      }
    }
  };

  const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFeaturedImageFile(e.target.files[0]);
      setFormData(prev => ({ 
        ...prev, 
        featured_image: URL.createObjectURL(e.target.files![0]),
        media_type: "image"
      }));
    }
  };

  const handleAdditionalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFile = e.target.files[0];
      setAdditionalImageFiles(prev => [...prev, newFile]);
      
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
    setFormData(prev => ({ 
      ...prev, 
      featured_image: "",
      media_type: prev.featured_video ? "video" : "image"
    }));
  };

  const removeYoutubeVideo = () => {
    setYoutubeUrl("");
    setFormData(prev => ({ 
      ...prev, 
      featured_video: "",
      media_type: prev.featured_image ? "image" : "video"
    }));
  };

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

  const validateHtmlContent = (content: string): boolean => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const errors = doc.getElementsByTagName('parsererror');
      return errors.length === 0;
    } catch (e) {
      return false;
    }
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
      let featuredImageUrl = formData.featured_image;
      let additionalImageUrls = [...(formData.additional_images || [])];
      
      if (featuredImageFile) {
        featuredImageUrl = await uploadImage(featuredImageFile, 'featured');
      }
      
      if (additionalImageFiles.length > 0) {
        const newUrls = await Promise.all(
          additionalImageFiles.map(file => uploadImage(file, 'additional'))
        );
        
        additionalImageUrls = [
          ...additionalImageUrls.filter(url => !url.startsWith('blob:')),
          ...newUrls
        ];
      }
      
      const now = new Date().toISOString();
      let savedArticleId: string | undefined;
      
      if (isEditing && id) {
        const { data: currentArticle, error: fetchError } = await supabase
          .from('articles')
          .select('published, published_at, created_at')
          .eq('id', id)
          .single();
          
        if (fetchError) throw fetchError;
        
        const publishedAt = 
          !currentArticle.published && formData.published ? currentArticle.created_at :
          formData.published ? currentArticle.published_at :
          null;
          
        const { error } = await supabase
          .from('articles')
          .update({
            title: formData.title,
            content: formData.content,
            excerpt: formData.excerpt,
            category: formData.category,
            featured: formData.featured,
            published: formData.published,
            featured_image: formData.media_type === 'image' ? featuredImageUrl : null,
            featured_video: formData.media_type === 'video' ? formData.featured_video : null,
            media_type: formData.media_type,
            additional_images: additionalImageUrls,
            updated_at: now,
            published_at: publishedAt
          })
          .eq('id', id);
        
        if (error) throw error;
        savedArticleId = id;
        
        if (formData.published) {
          try {
            const { notifyIndexNowSingleUrl } = await import('@/utils/indexNow');
            notifyIndexNowSingleUrl({
              id,
              title: formData.title,
              content: formData.content,
              excerpt: formData.excerpt,
              author_id: user.id,
              category: formData.category,
              featured: formData.featured,
              published: formData.published,
              created_at: currentArticle.created_at,
              updated_at: now,
              published_at: publishedAt
            });
          } catch (indexError) {
            console.error("Failed to notify search engines:", indexError);
          }
        }
      } else {
        const { data, error } = await supabase
          .from('articles')
          .insert([{
            title: formData.title,
            content: formData.content,
            excerpt: formData.excerpt,
            category: formData.category,
            featured: formData.featured,
            published: formData.published,
            featured_image: formData.media_type === 'image' ? featuredImageUrl : null,
            featured_video: formData.media_type === 'video' ? formData.featured_video : null,
            media_type: formData.media_type,
            additional_images: additionalImageUrls,
            author_id: user.id,
            created_at: now,
            updated_at: now,
            published_at: formData.published ? now : null
          }])
          .select('id');
        
        if (error) throw error;
        savedArticleId = data?.[0]?.id;
        
        if (formData.published && savedArticleId) {
          try {
            const { notifyIndexNowSingleUrl } = await import('@/utils/indexNow');
            notifyIndexNowSingleUrl({
              id: savedArticleId,
              title: formData.title,
              content: formData.content,
              excerpt: formData.excerpt,
              author_id: user.id,
              category: formData.category,
              featured: formData.featured,
              published: formData.published,
              created_at: now,
              updated_at: now,
              published_at: now
            });
          } catch (indexError) {
            console.error("Failed to notify search engines:", indexError);
          }
        }
      }
      
      toast({
        title: isEditing ? "Article Updated" : "Article Created",
        description: isEditing 
          ? "Your article has been successfully updated" 
          : "Your article has been successfully created",
      });
      
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

  const youtubeEmbedUrl = formData.featured_video ? 
    `https://www.youtube.com/embed/${extractYoutubeId(formData.featured_video)}` : 
    '';

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
            <RichTextEditor
              value={formData.content}
              onChange={handleContentChange}
              minHeight="300px"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Featured Media</Label>
            <Tabs 
              value={formData.media_type} 
              onValueChange={handleMediaTypeChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="image" className="flex items-center">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Image
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center">
                  <Video className="h-4 w-4 mr-2" />
                  YouTube Video
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="image">
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
              </TabsContent>
              
              <TabsContent value="video">
                <div className="border rounded-md p-4">
                  {formData.featured_video && youtubeEmbedUrl ? (
                    <div className="relative">
                      <div className="aspect-video w-full">
                        <iframe 
                          src={youtubeEmbedUrl} 
                          className="w-full h-full rounded"
                          title="YouTube video"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        ></iframe>
                      </div>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        className="absolute top-2 right-2" 
                        onClick={removeYoutubeVideo}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <Label htmlFor="youtube-url">YouTube URL</Label>
                        <div className="flex space-x-2">
                          <Input 
                            id="youtube-url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={youtubeUrl}
                            onChange={handleYoutubeUrlChange}
                            className={youtubeError ? "border-red-500" : ""}
                          />
                        </div>
                        {youtubeError && (
                          <p className="text-xs text-red-500 mt-1">{youtubeError}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Supports YouTube URLs like: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
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
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="featured" 
                checked={formData.featured}
                onCheckedChange={(checked) => 
                  handleCheckboxChange('featured', checked === true)
                }
              />
              <Label htmlFor="featured" className="cursor-pointer">Featured Article</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="published" 
                checked={formData.published}
                onCheckedChange={(checked) => 
                  handleCheckboxChange('published', checked === true)
                }
              />
              <Label htmlFor="published" className="cursor-pointer">Publish Article</Label>
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
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : isEditing ? 'Update Article' : 'Create Article'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ArticleEditor;
