
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { RecentPokemonRelease, RecentReleaseFormData } from "@/types/pokemon-releases";
import { useRecentPokemonReleases, useImageUpload } from '@/hooks/usePokemonReleases';

interface RecentReleaseEditorProps {
  release?: RecentPokemonRelease;
  onSubmit: () => void;
  onCancel: () => void;
}

const RecentReleaseEditor = ({ release, onSubmit, onCancel }: RecentReleaseEditorProps) => {
  const isEditing = !!release;
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const { addRecentRelease, updateRecentRelease } = useRecentPokemonReleases();
  const { uploadImage } = useImageUpload();
  
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<RecentReleaseFormData>({
    name: "",
    release_date: new Date().toISOString().split('T')[0],
    popularity: 75,
    image_url: "",
    logo_url: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  useEffect(() => {
    if (isEditing && release) {
      setFormData({
        name: release.name,
        release_date: new Date(release.release_date).toISOString().split('T')[0],
        popularity: release.popularity,
        image_url: release.image_url || "",
        logo_url: release.logo_url || ""
      });
    }
  }, [isEditing, release]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      // Create temporary URL for preview
      setFormData(prev => ({ 
        ...prev, 
        image_url: URL.createObjectURL(e.target.files![0]) 
      }));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setFormData(prev => ({ ...prev, image_url: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast({
        title: "Authentication Error",
        description: "You must be an admin to save releases",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Upload image if provided
      let imageUrl = formData.image_url;
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, 'recent');
      }
      
      const releaseData = {
        ...formData,
        image_url: imageUrl,
        popularity: Number(formData.popularity) || 75
      };
      
      if (isEditing && release) {
        await updateRecentRelease(release.id, releaseData);
        toast({
          title: "Release Updated",
          description: "The release has been successfully updated",
        });
      } else {
        await addRecentRelease(releaseData);
        toast({
          title: "Release Created",
          description: "The release has been successfully created",
        });
      }
      
      onSubmit();
    } catch (error: any) {
      console.error("Error saving release:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save release",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Recent Release" : "Create Recent Release"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Release Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter release name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="release_date">Release Date</Label>
            <Input
              id="release_date"
              name="release_date"
              type="date"
              value={formData.release_date}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="popularity">Popularity (0-100)</Label>
            <Input
              id="popularity"
              name="popularity"
              type="number"
              min="0"
              max="100"
              value={formData.popularity}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL (Optional)</Label>
            <Input
              id="logo_url"
              name="logo_url"
              placeholder="Enter logo URL"
              value={formData.logo_url}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Image</Label>
            <div className="border rounded-md p-4">
              {formData.image_url ? (
                <div className="relative">
                  <img 
                    src={formData.image_url} 
                    alt="Release" 
                    className="w-full h-48 object-cover rounded"
                  />
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm" 
                    className="absolute top-2 right-2" 
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 bg-gray-100 rounded">
                  <label className="cursor-pointer text-center">
                    <div className="flex flex-col items-center">
                      <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                      <span className="text-gray-500">Upload Image</span>
                    </div>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageChange} 
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : (isEditing ? 'Update Release' : 'Create Release')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RecentReleaseEditor;
