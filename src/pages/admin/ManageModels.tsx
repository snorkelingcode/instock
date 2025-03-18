
import React, { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useModels, 
  useCreateModel, 
  useUpdateModel, 
  useDeleteModel 
} from "@/hooks/use-model";
import { uploadModelFile, uploadThumbnail } from "@/services/modelService";
import { ThreeDModel, ModelCategory } from "@/types/model";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, Trash2, Edit, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Form schema for model creation/editing
const modelFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.enum(['display', 'holder', 'marker', 'promotional', 'other'] as const),
  customizable: z.boolean().default(true),
  default_options: z.record(z.any()).default({})
});

type ModelFormValues = z.infer<typeof modelFormSchema>;

const ManageModels = () => {
  useMetaTags({
    title: "Manage 3D Models",
    description: "Admin page for managing 3D models"
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const { data: models, isLoading } = useModels();
  const createModel = useCreateModel();
  const updateModel = useUpdateModel();
  const deleteModel = useDeleteModel();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [currentModel, setCurrentModel] = useState<ThreeDModel | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form for adding/editing models
  const form = useForm<ModelFormValues>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "other",
      customizable: true,
      default_options: {}
    }
  });
  
  // Handle file selection for model uploads
  const handleModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setModelFile(e.target.files[0]);
    }
  };
  
  // Handle file selection for thumbnail uploads
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setThumbnailFile(e.target.files[0]);
    }
  };
  
  // Reset form and file inputs
  const resetForm = () => {
    form.reset();
    setModelFile(null);
    setThumbnailFile(null);
    setCurrentModel(null);
  };
  
  // Open edit dialog and populate form with model data
  const handleEditClick = (model: ThreeDModel) => {
    setCurrentModel(model);
    form.reset({
      name: model.name,
      description: model.description || "",
      category: model.category,
      customizable: model.customizable,
      default_options: model.default_options
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle form submission for creating a new model
  const handleAddSubmit = async (values: ModelFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create models.",
        variant: "destructive",
      });
      return;
    }
    
    if (!modelFile) {
      toast({
        title: "Error",
        description: "Please upload a model file.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload model file
      const modelFilePath = await uploadModelFile(modelFile, user.id);
      if (!modelFilePath) throw new Error("Failed to upload model file");
      
      // Upload thumbnail if provided
      let thumbnailPath = null;
      if (thumbnailFile) {
        thumbnailPath = await uploadThumbnail(thumbnailFile, user.id);
      }
      
      // Create the model
      await createModel.mutateAsync({
        name: values.name,
        description: values.description || null,
        category: values.category,
        stl_file_path: modelFilePath,
        thumbnail_path: thumbnailPath,
        customizable: values.customizable,
        default_options: values.default_options
      });
      
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating model:", error);
      toast({
        title: "Error",
        description: "Failed to create model. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle form submission for updating an existing model
  const handleEditSubmit = async (values: ModelFormValues) => {
    if (!currentModel) return;
    
    setIsUploading(true);
    
    try {
      const updates: Partial<Omit<ThreeDModel, 'id' | 'created_at' | 'updated_at'>> = {
        name: values.name,
        description: values.description || null,
        category: values.category,
        customizable: values.customizable,
        default_options: values.default_options
      };
      
      // Upload new model file if provided
      if (modelFile) {
        const modelFilePath = await uploadModelFile(modelFile, user?.id || 'unknown');
        if (modelFilePath) {
          updates.stl_file_path = modelFilePath;
        }
      }
      
      // Upload new thumbnail if provided
      if (thumbnailFile) {
        const newThumbnailPath = await uploadThumbnail(thumbnailFile, user?.id || 'unknown');
        if (newThumbnailPath) {
          updates.thumbnail_path = newThumbnailPath;
        }
      }
      
      await updateModel.mutateAsync({
        id: currentModel.id,
        modelData: updates
      });
      
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error updating model:", error);
      toast({
        title: "Error",
        description: "Failed to update model. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle model deletion
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this model? This action cannot be undone.")) {
      await deleteModel.mutateAsync(id);
    }
  };

  return (
    <Shell>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manage 3D Models</h1>
            <p className="text-gray-600">Add, edit, and delete 3D models for the Forge</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Model
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New 3D Model</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter model name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter model description" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="display">Display</SelectItem>
                            <SelectItem value="holder">Holder</SelectItem>
                            <SelectItem value="marker">Marker</SelectItem>
                            <SelectItem value="promotional">Promotional</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customizable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Customizable</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <Label htmlFor="model-file">Model File (STL)</Label>
                    <Input
                      id="model-file"
                      type="file"
                      accept=".stl,.obj,.gltf,.glb"
                      onChange={handleModelFileChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">Thumbnail Image</Label>
                    <Input
                      id="thumbnail"
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                    />
                  </div>
                  
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button 
                      type="submit" 
                      disabled={isUploading}
                      className="flex items-center gap-2"
                    >
                      {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isUploading ? "Uploading..." : "Add Model"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Edit Model Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit 3D Model</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter model name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter model description" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="display">Display</SelectItem>
                          <SelectItem value="holder">Holder</SelectItem>
                          <SelectItem value="marker">Marker</SelectItem>
                          <SelectItem value="promotional">Promotional</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customizable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Customizable</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <Label htmlFor="edit-model-file">Replace Model File (Optional)</Label>
                  <Input
                    id="edit-model-file"
                    type="file"
                    accept=".stl,.obj,.gltf,.glb"
                    onChange={handleModelFileChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-thumbnail">Replace Thumbnail (Optional)</Label>
                  <Input
                    id="edit-thumbnail"
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                  />
                </div>
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button 
                    type="submit" 
                    disabled={isUploading}
                    className="flex items-center gap-2"
                  >
                    {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isUploading ? "Updating..." : "Update Model"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Models Table */}
        <Card>
          <CardHeader>
            <CardTitle>3D Models</CardTitle>
            <CardDescription>
              Manage all 3D models available in the Forge
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              </div>
            ) : models && models.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Customizable</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">{model.name}</TableCell>
                      <TableCell className="capitalize">{model.category}</TableCell>
                      <TableCell>{model.customizable ? "Yes" : "No"}</TableCell>
                      <TableCell>{new Date(model.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditClick(model)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(model.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No 3D models found. Add your first model to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
};

export default ManageModels;
