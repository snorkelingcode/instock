
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchModels, 
  fetchModelById, 
  createModel, 
  updateModel,
  deleteModel,
  saveUserCustomization,
  getUserCustomization
} from '@/services/modelService';
import { ThreeDModel, UserCustomization } from '@/types/model';
import { useAuth } from '@/contexts/AuthContext';

export const useModels = () => {
  return useQuery({
    queryKey: ['models'],
    queryFn: fetchModels
  });
};

export const useModel = (id: string) => {
  return useQuery({
    queryKey: ['model', id],
    queryFn: () => fetchModelById(id),
    enabled: !!id
  });
};

export const useCreateModel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (modelData: Omit<ThreeDModel, 'id' | 'created_at' | 'updated_at'>) => 
      createModel(modelData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
    }
  });
};

export const useUpdateModel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, modelData }: { id: string, modelData: Partial<Omit<ThreeDModel, 'id' | 'created_at' | 'updated_at'>> }) => 
      updateModel(id, modelData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['model', variables.id] });
    }
  });
};

export const useDeleteModel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
    }
  });
};

export const useUserCustomization = (modelId: string, options = {}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['customization', user?.id, modelId],
    queryFn: () => getUserCustomization(user?.id || '', modelId),
    enabled: !!user?.id && !!modelId,
    ...options,
  });
};

export const useSaveCustomization = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: ({ modelId, options }: { modelId: string, options: Record<string, any> }) => 
      saveUserCustomization(user?.id || '', modelId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['customization', user?.id, variables.modelId] 
      });
    }
  });
};
