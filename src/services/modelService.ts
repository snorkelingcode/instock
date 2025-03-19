import { supabase } from "@/integrations/supabase/client";
import { ThreeDModel, UserCustomization } from "@/types/model";
import { toast } from "@/hooks/use-toast";

export const fetchModels = async (): Promise<ThreeDModel[]> => {
  try {
    const { data, error } = await supabase
      .from('threed_models')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ThreeDModel[];
  } catch (error: any) {
    console.error("Error fetching 3D models:", error.message);
    toast({
      title: "Error",
      description: "Failed to load 3D models. Please try again later.",
      variant: "destructive",
    });
    return [];
  }
};

export const fetchModelById = async (id: string): Promise<ThreeDModel | null> => {
  try {
    const { data, error } = await supabase
      .from('threed_models')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as ThreeDModel;
  } catch (error: any) {
    console.error(`Error fetching 3D model (${id}):`, error.message);
    toast({
      title: "Error",
      description: "Failed to load 3D model. Please try again later.",
      variant: "destructive",
    });
    return null;
  }
};

export const uploadModelFile = async (file: File, userId: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from('threed-models')
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('threed-models')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error: any) {
    console.error("Error uploading model file:", error.message);
    toast({
      title: "Error",
      description: "Failed to upload model file. Please try again later.",
      variant: "destructive",
    });
    return null;
  }
};

export const uploadThumbnail = async (file: File, userId: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `thumbnails/${userId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from('threed-models')
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('threed-models')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error: any) {
    console.error("Error uploading thumbnail:", error.message);
    toast({
      title: "Error",
      description: "Failed to upload thumbnail. Please try again later.",
      variant: "destructive",
    });
    return null;
  }
};

export const createModel = async (
  modelData: Omit<ThreeDModel, 'id' | 'created_at' | 'updated_at'>
): Promise<ThreeDModel | null> => {
  try {
    const { data, error } = await supabase
      .from('threed_models')
      .insert([modelData])
      .select()
      .single();

    if (error) throw error;
    
    toast({
      title: "Success",
      description: "3D model created successfully.",
    });
    
    return data as ThreeDModel;
  } catch (error: any) {
    console.error("Error creating 3D model:", error.message);
    toast({
      title: "Error",
      description: "Failed to create 3D model. Please try again later.",
      variant: "destructive",
    });
    return null;
  }
};

export const updateModel = async (
  id: string,
  modelData: Partial<Omit<ThreeDModel, 'id' | 'created_at' | 'updated_at'>>
): Promise<ThreeDModel | null> => {
  try {
    const { data, error } = await supabase
      .from('threed_models')
      .update(modelData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    toast({
      title: "Success",
      description: "3D model updated successfully.",
    });
    
    return data as ThreeDModel;
  } catch (error: any) {
    console.error("Error updating 3D model:", error.message);
    toast({
      title: "Error",
      description: "Failed to update 3D model. Please try again later.",
      variant: "destructive",
    });
    return null;
  }
};

export const deleteModel = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('threed_models')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    toast({
      title: "Success",
      description: "3D model deleted successfully.",
    });
    
    return true;
  } catch (error: any) {
    console.error("Error deleting 3D model:", error.message);
    toast({
      title: "Error",
      description: "Failed to delete 3D model. Please try again later.",
      variant: "destructive",
    });
    return false;
  }
};

export const cleanupInvalidModels = async (invalidUrls: string[]): Promise<boolean> => {
  if (!invalidUrls || invalidUrls.length === 0) {
    return true;
  }

  try {
    // Find models with the invalid URLs
    const { data, error } = await supabase
      .from('threed_models')
      .select('id, name, stl_file_path')
      .in('stl_file_path', invalidUrls);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.log('No invalid models found in database');
      return true;
    }

    console.log(`Found ${data.length} invalid models to clean up:`, data);
    
    // Get model IDs to delete
    const modelIds = data.map(model => model.id);
    
    // First, delete related user customizations to avoid foreign key constraint errors
    const { error: deleteCustomizationsError } = await supabase
      .from('user_customizations')
      .delete()
      .in('model_id', modelIds);
      
    if (deleteCustomizationsError) {
      console.error("Error deleting related customizations:", deleteCustomizationsError);
      throw deleteCustomizationsError;
    }
    
    // Now we can safely delete the models
    const { error: deleteError } = await supabase
      .from('threed_models')
      .delete()
      .in('id', modelIds);

    if (deleteError) throw deleteError;
    
    console.log(`Successfully deleted ${modelIds.length} invalid models`);
    
    toast({
      title: "Cleanup Completed",
      description: `Cleaned up ${modelIds.length} invalid models from the database.`,
    });
    
    return true;
  } catch (error: any) {
    console.error("Error cleaning up invalid models:", error.message);
    toast({
      title: "Error",
      description: "Failed to clean up invalid models. Please try again later.",
      variant: "destructive",
    });
    return false;
  }
};

export const saveUserCustomization = async (
  userId: string,
  modelId: string,
  options: Record<string, any>
): Promise<UserCustomization | null> => {
  try {
    // Check if there's already a customization for this user and model
    const { data: existingData, error: fetchError } = await supabase
      .from('user_customizations')
      .select('*')
      .eq('user_id', userId)
      .eq('model_id', modelId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows returned
      throw fetchError;
    }

    let result;
    
    if (existingData) {
      // Update existing customization
      const { data, error } = await supabase
        .from('user_customizations')
        .update({ customization_options: options, updated_at: new Date().toISOString() })
        .eq('id', existingData.id)
        .select()
        .single();
        
      if (error) throw error;
      result = data;
    } else {
      // Create new customization
      const { data, error } = await supabase
        .from('user_customizations')
        .insert([{
          user_id: userId,
          model_id: modelId,
          customization_options: options
        }])
        .select()
        .single();
        
      if (error) throw error;
      result = data;
    }
    
    toast({
      title: "Success",
      description: "Customization saved successfully.",
    });
    
    return result as UserCustomization;
  } catch (error: any) {
    console.error("Error saving customization:", error.message);
    toast({
      title: "Error",
      description: "Failed to save customization. Please try again later.",
      variant: "destructive",
    });
    return null;
  }
};

export const getUserCustomization = async (
  userId: string,
  modelId: string
): Promise<UserCustomization | null> => {
  try {
    if (!userId || !modelId) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('user_customizations')
      .select('*')
      .eq('user_id', userId)
      .eq('model_id', modelId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no data is found

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      console.error("Error fetching user customization:", error);
      return null;
    }
    
    return data as UserCustomization;
  } catch (error: any) {
    console.error("Error fetching user customization:", error.message);
    return null;
  }
};
