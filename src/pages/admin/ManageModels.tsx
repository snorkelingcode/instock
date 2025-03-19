import React, { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { useAuth } from "@/contexts/AuthContext";
import { useModels, useCreateModel, useUpdateModel, useDeleteModel } from "@/hooks/use-model";
import { uploadModelFile, cleanupInvalidModels } from "@/services/modelService";
import { ThreeDModel } from "@/types/model";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ModelCard from "@/components/admin/ModelCard";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Trash2, Image } from "lucide-react";
import { getModelsNeedingCleanup, resetLoaderState } from "@/utils/modelPreloader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const modelTypes = [
  { id: "slab-slider-rounded", title: "Slab Slider (Rounded)" },
  { id: "slab-slider-square", title: "Slab Slider (Square)" },
  { id: "slab-slider-flat", title: "Slab Slider (Flat)" },
  { id: "slab-slider-rounded-magnets", title: "Slab Slider (Rounded + Magnets)" },
  { id: "slab-slider-square-magnets", title: "Slab Slider (Square + Magnets)" },
  { id: "slab-slider-flat-magnets", title: "Slab Slider (Flat + Magnets)" },
  { id: "slab-loader-rounded", title: "Slab Loader (Rounded)" },
  { id: "slab-loader-square", title: "Slab Loader (Square)" },
  { id: "slab-loader-flat", title: "Slab Loader (Flat)" },
  { id: "slab-loader-rounded-magnets", title: "Slab Loader (Rounded + Magnets)" },
  { id: "slab-loader-square-magnets", title: "Slab Loader (Square + Magnets)" },
  { id: "slab-loader-flat-magnets", title: "Slab Loader (Flat + Magnets)" }
];

const defaultModelImages = {
  "slab-slider-rounded": "/lovable-uploads/05e57c85-5441-4fff-b945-4a5e864300ce.png",
  "slab-slider-square": "/lovable-uploads/125a6be9-26e0-4a93-bdba-b6e59987210a.png",
  "slab-slider-rounded-magnets": "/lovable-uploads/eec1c627-b940-4257-b4dc-18d6a1210fc7.png",
  "slab-loader-rounded": "/lovable-uploads/6f9cfca6-a0a1-4651-856a-ae5b1b8b372d.png",
  "slab-loader-square": "/lovable-uploads/8be85c80-3a73-44ab-b4a4-e3ceb269fb17.png",
  "slab-loader-rounded-magnets": "/lovable-uploads/5222a634-7636-44dc-b5c9-f1f8ff45b6b8.png"
};

const defaultDescriptions = {
  "slab-slider-rounded": "A rounded corner slab slider case without magnets. Perfect for showcasing your favorite cards.",
  "slab-slider-square": "A square corner slab slider case without magnets. Clean, modern design for your collection.",
  "slab-slider-rounded-magnets": "A rounded corner slab slider case with magnets for secure closure and display.",
  "slab-loader-rounded": "A rounded corner slab loader case without magnets. Easy access to your cards.",
  "slab-loader-square": "A square corner slab loader case without magnets. Sleek design for your collection.",
  "slab-loader-rounded-magnets": "A rounded corner slab loader case with magnets for secure storage and display."
};

const ManageModels = () => {
  useMetaTags({
    title: "Manage 3D Models",
    description: "Admin page for managing 3D models"
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const { data: models, isLoading, refetch: refetchModels } = useModels();
  const createModel = useCreateModel();
  const updateModel = useUpdateModel();
  const deleteModel = useDeleteModel();
  
  const [uploadedModels, setUploadedModels] = useState<Record<string, boolean>>({});
  const [invalidModelCount, setInvalidModelCount] = useState(0);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [currentModelId, setCurrentModelId] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [previewDescription, setPreviewDescription] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  useEffect(() => {
    if (models) {
      const uploaded: Record<string, boolean> = {};
      
      models.forEach(model => {
        const modelType = modelTypes.find(type => model.name.includes(type.title));
        if (modelType) {
          uploaded[modelType.id] = true;
        }
      });
      
      setUploadedModels(uploaded);
      
      const invalidModels = getModelsNeedingCleanup();
      setInvalidModelCount(invalidModels.length);
    }
  }, [models]);
  
  const handleModelUpload = async (modelId: string, file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload models.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const modelFilePath = await uploadModelFile(file, user.id);
      if (!modelFilePath) throw new Error("Failed to upload model file");
      
      const modelType = modelTypes.find(type => type.id === modelId);
      if (!modelType) throw new Error("Invalid model type");
      
      const modelBase = modelId.includes("slab-slider") ? "Slab-Slider" : "Slab-Loader";
      
      let corners = "rounded";
      if (modelId.includes("square")) corners = "square";
      if (modelId.includes("flat")) corners = "flat";
      
      const hasMagnets = modelId.includes("magnets");
      
      const existingModel = models?.find(model => model.name === modelType.title);
      
      if (existingModel) {
        await updateModel.mutateAsync({
          id: existingModel.id,
          modelData: {
            stl_file_path: modelFilePath,
            default_options: {
              ...existingModel.default_options,
              modelType: modelBase,
              corners,
              magnets: hasMagnets ? "yes" : "no"
            }
          }
        });
      } else {
        await createModel.mutateAsync({
          name: modelType.title,
          description: `3D model for ${modelType.title}`,
          category: "display",
          stl_file_path: modelFilePath,
          thumbnail_path: null,
          customizable: true,
          default_options: {
            modelType: modelBase,
            corners,
            magnets: hasMagnets ? "yes" : "no",
            color: "#ff0000",
            scale: 1,
            material: "plastic"
          }
        });
      }
      
      resetLoaderState();
      
      setUploadedModels(prev => ({
        ...prev,
        [modelId]: true
      }));
      
      toast({
        title: "Success",
        description: `${modelType.title} uploaded successfully.`,
      });
    } catch (error: any) {
      console.error("Error uploading model:", error);
      toast({
        title: "Error",
        description: `Failed to upload model: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    try {
      const modelType = modelTypes.find(type => type.id === modelId);
      if (!modelType) throw new Error("Invalid model type");
      
      const modelToDelete = models?.find(model => model.name === modelType.title);
      
      if (!modelToDelete) {
        throw new Error("Model not found");
      }
      
      await deleteModel.mutateAsync(modelToDelete.id);
      
      resetLoaderState();
      
      setUploadedModels(prev => ({
        ...prev,
        [modelId]: false
      }));
      
      toast({
        title: "Success",
        description: `${modelType.title} deleted successfully.`,
      });
    } catch (error: any) {
      console.error("Error deleting model:", error);
      toast({
        title: "Error",
        description: `Failed to delete model: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  const handleCleanupInvalidModels = async () => {
    try {
      const failedUrls = getModelsNeedingCleanup();
      if (failedUrls.length > 0) {
        await cleanupInvalidModels(failedUrls)
          .then(() => {
            resetLoaderState();
            refetchModels();
            setInvalidModelCount(0);
            toast({
              title: "Success",
              description: `${failedUrls.length} invalid models cleaned up successfully.`,
            });
          })
          .catch(error => {
            console.error("Error cleaning up invalid models:", error);
            toast({
              title: "Error",
              description: `Failed to clean up invalid models: ${error.message}`,
              variant: "destructive",
            });
          })
          .finally(() => {
            setShowCleanupDialog(false);
          });
      }
    } catch (error: any) {
      console.error("Error cleaning up invalid models:", error);
      toast({
        title: "Error",
        description: `Failed to clean up invalid models: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const openPreviewDialog = (modelId: string) => {
    setCurrentModelId(modelId);
    const modelType = modelTypes.find(type => type.id === modelId);
    if (modelType) {
      setPreviewTitle(modelType.title);
      
      const existingModel = models?.find(model => model.name === modelType.title);
      if (existingModel) {
        setPreviewDescription(existingModel.description || defaultDescriptions[modelId] || "");
        setPreviewImage(existingModel.thumbnail_path || defaultModelImages[modelId] || "");
      } else {
        setPreviewDescription(defaultDescriptions[modelId] || "");
        setPreviewImage(defaultModelImages[modelId] || "");
      }
    }
    setShowPreviewDialog(true);
  };

  const saveModelPreview = async () => {
    try {
      const modelType = modelTypes.find(type => type.id === currentModelId);
      if (!modelType) throw new Error("Invalid model type");
      
      const existingModel = models?.find(model => model.name === modelType.title);
      
      if (existingModel) {
        await updateModel.mutateAsync({
          id: existingModel.id,
          modelData: {
            description: previewDescription,
            thumbnail_path: previewImage
          }
        });
        
        toast({
          title: "Success",
          description: `${modelType.title} preview updated successfully.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Model must be uploaded before adding preview information.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error updating model preview:", error);
      toast({
        title: "Error",
        description: `Failed to update preview: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setShowPreviewDialog(false);
    }
  };

  return (
    <Shell>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manage 3D Models</h1>
            <p className="text-gray-600">Upload and manage individual 3D model variants</p>
          </div>
          
          {invalidModelCount > 0 && (
            <AlertDialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clean Up {invalidModelCount} Invalid Models
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clean Up Invalid Models</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {invalidModelCount} model references that point to deleted or missing files. 
                    You'll need to re-upload these models afterward. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleCleanupInvalidModels} 
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Clean Up
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        
        <Tabs defaultValue="slab-slider">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="slab-slider">Slab Slider Models</TabsTrigger>
            <TabsTrigger value="slab-loader">Slab Loader Models</TabsTrigger>
          </TabsList>
          
          <TabsContent value="slab-slider">
            <Card>
              <CardHeader>
                <CardTitle>Slab Slider Models</CardTitle>
                <CardDescription>
                  Upload different variants of the Slab Slider model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modelTypes
                    .filter(model => model.id.includes("slab-slider"))
                    .map(model => (
                      <div key={model.id} className="space-y-2">
                        <ModelCard
                          id={model.id}
                          title={model.title}
                          onFileUpload={handleModelUpload}
                          isUploaded={!!uploadedModels[model.id]}
                          onDeleteModel={handleDeleteModel}
                        />
                        <Button 
                          variant="outline" 
                          className="w-full mt-2" 
                          onClick={() => openPreviewDialog(model.id)}
                        >
                          <Image className="mr-2 h-4 w-4" />
                          Manage Preview
                        </Button>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="slab-loader">
            <Card>
              <CardHeader>
                <CardTitle>Slab Loader Models</CardTitle>
                <CardDescription>
                  Upload different variants of the Slab Loader model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modelTypes
                    .filter(model => model.id.includes("slab-loader"))
                    .map(model => (
                      <div key={model.id} className="space-y-2">
                        <ModelCard
                          id={model.id}
                          title={model.title}
                          onFileUpload={handleModelUpload}
                          isUploaded={!!uploadedModels[model.id]}
                          onDeleteModel={handleDeleteModel}
                        />
                        <Button 
                          variant="outline" 
                          className="w-full mt-2" 
                          onClick={() => openPreviewDialog(model.id)}
                        >
                          <Image className="mr-2 h-4 w-4" />
                          Manage Preview
                        </Button>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Update Model Preview</DialogTitle>
              <DialogDescription>
                Add a preview image and description for {previewTitle}. This will be shown on mobile devices.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={previewTitle} disabled />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe the model features..."
                  value={previewDescription}
                  onChange={(e) => setPreviewDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image">Preview Image URL</Label>
                <Input 
                  id="image" 
                  placeholder="https://example.com/image.jpg"
                  value={previewImage}
                  onChange={(e) => setPreviewImage(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Enter a full URL to an image. For best results, use a square image of at least 300×300 pixels.
                </p>
              </div>
              
              {previewImage && (
                <div className="space-y-2">
                  <Label>Image Preview</Label>
                  <div className="border rounded-md overflow-hidden h-40">
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Invalid+Image';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={saveModelPreview}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
};

export default ManageModels;
