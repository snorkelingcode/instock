
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
import { Trash2 } from "lucide-react";
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

// Define the 12 model types
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
  
  // Initialize uploaded models status
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
      
      // Check for invalid models
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
      // Upload model file
      const modelFilePath = await uploadModelFile(file, user.id);
      if (!modelFilePath) throw new Error("Failed to upload model file");
      
      const modelType = modelTypes.find(type => type.id === modelId);
      if (!modelType) throw new Error("Invalid model type");
      
      // Determine model type (Slab Slider or Slab Loader)
      const modelBase = modelId.includes("slab-slider") ? "Slab-Slider" : "Slab-Loader";
      
      // Determine corners type
      let corners = "rounded";
      if (modelId.includes("square")) corners = "square";
      if (modelId.includes("flat")) corners = "flat";
      
      // Determine if it has magnets
      const hasMagnets = modelId.includes("magnets");
      
      // Find if model already exists to update it
      const existingModel = models?.find(model => model.name === modelType.title);
      
      if (existingModel) {
        // Update existing model
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
        // Create new model
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
      
      // Reset cache for model preloader
      resetLoaderState();
      
      // Update uploaded status
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
      
      // Find the model to delete
      const modelToDelete = models?.find(model => model.name === modelType.title);
      
      if (!modelToDelete) {
        throw new Error("Model not found");
      }
      
      // Delete the model
      await deleteModel.mutateAsync(modelToDelete.id);
      
      // Reset cache for model preloader
      resetLoaderState();
      
      // Update uploaded status
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
      const invalidModels = getModelsNeedingCleanup();
      if (invalidModels.length === 0) {
        toast({
          title: "Info",
          description: "No invalid models to clean up.",
        });
        return;
      }
      
      const success = await cleanupInvalidModels(invalidModels);
      if (success) {
        resetLoaderState();
        await refetchModels();
        
        toast({
          title: "Success",
          description: `${invalidModels.length} invalid models cleaned up successfully.`,
        });
        
        setInvalidModelCount(0);
      }
    } catch (error: any) {
      console.error("Error cleaning up invalid models:", error);
      toast({
        title: "Error",
        description: `Failed to clean up invalid models: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setShowCleanupDialog(false);
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
                      <ModelCard
                        key={model.id}
                        id={model.id}
                        title={model.title}
                        onFileUpload={handleModelUpload}
                        isUploaded={!!uploadedModels[model.id]}
                        onDeleteModel={handleDeleteModel}
                      />
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
                      <ModelCard
                        key={model.id}
                        id={model.id}
                        title={model.title}
                        onFileUpload={handleModelUpload}
                        isUploaded={!!uploadedModels[model.id]}
                        onDeleteModel={handleDeleteModel}
                      />
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
};

export default ManageModels;
