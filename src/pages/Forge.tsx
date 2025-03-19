
import React, { useState, useEffect, useRef } from 'react';
import { Shell } from "@/components/layout/Shell";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { useAuth } from "@/contexts/AuthContext";
import { useModels, useModel, useSaveCustomization, useUserCustomization } from '@/hooks/use-model';
import ModelViewer from '@/components/forge/ModelViewer';
import CustomizationPanel from '@/components/forge/CustomizationPanel';
import InstructionsPanel from '@/components/forge/InstructionsPanel';
import { 
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle 
} from "@/components/ui/resizable";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThreeDModel } from '@/types/model';
import * as THREE from 'three';
import { getCache, setCache } from '@/utils/cacheUtils';
import { 
  preloadModels, 
  getPreloadStatus, 
  isModelPreloaded, 
  resetLoaderState, 
  getFailedUrls, 
  didModelFail,
  getModelsNeedingCleanup
} from '@/utils/modelPreloader';
import { cleanupInvalidModels } from '@/services/modelService';

const Forge = () => {
  useMetaTags({
    title: "Forge - Customize 3D Models",
    description: "Customize and personalize 3D models in our interactive forge."
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const { data: models, isLoading: modelsLoading, refetch: refetchModels } = useModels();
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const { data: selectedModel, isLoading: modelLoading } = useModel(selectedModelId);
  
  const { data: savedCustomization } = useUserCustomization(selectedModelId, { 
    enabled: !!user?.id && !!selectedModelId,
    staleTime: Infinity,  // Only fetch once
    cacheTime: Infinity   // Keep in cache
  });
  
  const [customizationOptions, setCustomizationOptions] = useState<Record<string, any>>({
    modelType: 'Slab-Slider',
    corners: 'rounded',
    magnets: 'no',
    color: '#ff0000',
    scale: 1,
    material: 'plastic',
  });
  
  const [loadedModels, setLoadedModels] = useState<Map<string, THREE.BufferGeometry>>(new Map());
  
  const previousModelRef = useRef<ThreeDModel | null>(null);
  const [morphEnabled, setMorphEnabled] = useState(false);
  
  const modelSelectTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSelectedId = useRef<string>('');
  
  const preloadedCombinations = useRef<Set<string>>(new Set());
  
  const [preloadProgress, setPreloadProgress] = useState({ loaded: 0, total: 0 });
  const [preloadComplete, setPreloadComplete] = useState(false);
  const [performedCleanup, setPerformedCleanup] = useState(false);
  
  const saveCustomization = useSaveCustomization();

  const handleModelLoaded = (url: string, geometry: THREE.BufferGeometry) => {
    setLoadedModels(prev => {
      const newMap = new Map(prev);
      newMap.set(url, geometry);
      return newMap;
    });
  };

  // New function to clean up invalid models
  const handleCleanupInvalidModels = async () => {
    if (performedCleanup) return;
    
    const invalidUrls = getModelsNeedingCleanup();
    if (invalidUrls.length === 0) return;
    
    console.log(`Found ${invalidUrls.length} invalid models that need cleanup`);
    
    const success = await cleanupInvalidModels(invalidUrls);
    if (success) {
      setPerformedCleanup(true);
      resetLoaderState();
      refetchModels();
      
      toast({
        title: "Models Cleanup",
        description: `Removed ${invalidUrls.length} invalid model references from the database. Please re-upload these models.`,
      });
    }
  };

  useEffect(() => {
    if (!models || models.length === 0 || modelsLoading) return;
    
    const preloadAllModels = async () => {
      console.log(`Starting preload of all ${models.length} models`);
      
      resetLoaderState();
      
      await preloadModels(models, (loaded, total) => {
        setPreloadProgress({ loaded, total });
        if (loaded === total) {
          setPreloadComplete(true);
        }
      });
      
      const modelTypes = new Set<string>();
      const cornerStyles = new Set<string>();
      const magnetsOptions = new Set<string>();
      
      models.forEach(model => {
        const defaultOptions = model.default_options || {};
        if (defaultOptions.modelType) modelTypes.add(defaultOptions.modelType);
        if (defaultOptions.corners) cornerStyles.add(defaultOptions.corners);
        if (defaultOptions.magnets) magnetsOptions.add(defaultOptions.magnets);
      });
      
      const allCombinations = new Set<string>();
      modelTypes.forEach(modelType => {
        cornerStyles.forEach(corners => {
          magnetsOptions.forEach(magnets => {
            allCombinations.add(`${modelType}-${corners}-${magnets}`);
          });
        });
      });
      
      preloadedCombinations.current = allCombinations;
      setPreloadComplete(true);
      
      // Check for and clean up invalid models after preloading
      await handleCleanupInvalidModels();
      
      console.log(`Preloading complete. All ${allCombinations.size} combinations tracked.`);
      console.log('Preload status:', getPreloadStatus());
    };
    
    preloadAllModels();
  }, [models, modelsLoading]);

  useEffect(() => {
    if (!models || models.length === 0) return;
    
    if (selectedModel) {
      previousModelRef.current = selectedModel;
    }

    const findMatchingModel = () => {
      const preloadStatus = getPreloadStatus();
      if (preloadStatus.isBatchLoading && preloadStatus.pending > 0) {
        console.log('Still preloading models, waiting before changing model...');
        setTimeout(findMatchingModel, 500);
        return;
      }
      
      const modelType = customizationOptions.modelType || 'Slab-Slider';
      const corners = customizationOptions.corners || 'rounded';
      const magnets = customizationOptions.magnets || 'no';
      
      const combinationKey = `${modelType}-${corners}-${magnets}`;
      
      const matchingModel = models.find(model => {
        const defaultOptions = model.default_options || {};
        if (model.stl_file_path && didModelFail(model.stl_file_path)) {
          return false;
        }
        return (
          defaultOptions.modelType === modelType &&
          defaultOptions.corners === corners &&
          defaultOptions.magnets === magnets
        );
      });
      
      if (matchingModel) {
        if (matchingModel.id !== selectedModelId) {
          const shouldMorph = preloadedCombinations.current.has(combinationKey) || 
                             isModelPreloaded(matchingModel.stl_file_path) ||
                             loadedModels.has(matchingModel.stl_file_path) ||
                             (lastSelectedId.current && lastSelectedId.current !== '');
          
          setMorphEnabled(shouldMorph);
          lastSelectedId.current = selectedModelId;
          setSelectedModelId(matchingModel.id);
          
          console.log(`Switching to model ${matchingModel.id} (${combinationKey}), morphing: ${shouldMorph}`);
        }
      } else if (!selectedModelId && models.length > 0) {
        const firstValidModel = models.find(model => 
          model.stl_file_path && !didModelFail(model.stl_file_path)
        );
        
        if (firstValidModel) {
          setSelectedModelId(firstValidModel.id);
        } else {
          console.error('No valid models found that haven\'t previously failed to load');
          toast({
            title: "Error",
            description: "No valid 3D models available. Please try again later.",
            variant: "destructive",
          });
        }
      }
    };
    
    if (modelSelectTimeout.current) {
      clearTimeout(modelSelectTimeout.current);
    }
    
    modelSelectTimeout.current = setTimeout(findMatchingModel, 300);
    
    return () => {
      if (modelSelectTimeout.current) {
        clearTimeout(modelSelectTimeout.current);
      }
    };
  }, [models, customizationOptions, selectedModelId, selectedModel, loadedModels]);

  useEffect(() => {
    if (morphEnabled) {
      const timer = setTimeout(() => {
        setMorphEnabled(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [morphEnabled, selectedModelId]);

  useEffect(() => {
    if (selectedModel) {
      const newOptions = { ...customizationOptions };
      let shouldUpdate = false;
      
      if (savedCustomization) {
        Object.entries(savedCustomization.customization_options).forEach(([key, value]) => {
          if (newOptions[key] !== value) {
            newOptions[key] = value;
            shouldUpdate = true;
          }
        });
      } else if (selectedModel.default_options) {
        Object.entries(selectedModel.default_options).forEach(([key, value]) => {
          if (!['modelType', 'corners', 'magnets'].includes(key) && newOptions[key] === undefined) {
            newOptions[key] = value;
            shouldUpdate = true;
          }
        });
      }
      
      if (shouldUpdate) {
        setCustomizationOptions(prev => ({...prev, ...newOptions}));
      }
    }
  }, [selectedModel, savedCustomization]);

  const handleCustomizationChange = (key: string, value: any) => {
    setCustomizationOptions(prev => ({ 
      ...prev, 
      [key]: value 
    }));
  };

  const handleSaveCustomization = () => {
    if (!user || !selectedModelId) {
      toast({
        title: "Error",
        description: "You must be logged in to save customizations.",
        variant: "destructive",
      });
      return;
    }
    
    saveCustomization.mutate({
      modelId: selectedModelId,
      options: customizationOptions
    }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Your customization has been saved.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to save your customization.",
          variant: "destructive",
        });
      }
    });
  };

  const modelTypeOptions = models 
    ? [...new Set(models.map(model => model.default_options?.modelType).filter(Boolean))]
    : [];

  const isLoading = modelsLoading || modelLoading || !selectedModel || (models && models.length > 0 && !preloadComplete);

  return (
    <Shell>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">3D Model Forge</h1>
          <p className="text-gray-600">Customize and personalize 3D models to your liking</p>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col justify-center items-center min-h-[500px]">
            <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
            {preloadProgress.total > 0 && (
              <div className="w-64 text-center">
                <p>Preloading models: {preloadProgress.loaded} of {preloadProgress.total}</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.round((preloadProgress.loaded / preloadProgress.total) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[600px] rounded-lg border"
          >
            <ResizablePanel defaultSize={70} minSize={30}>
              {selectedModel && (
                <ModelViewer
                  model={selectedModel}
                  previousModel={previousModelRef.current}
                  customizationOptions={customizationOptions}
                  morphEnabled={morphEnabled}
                  loadedModels={loadedModels}
                  onModelsLoaded={handleModelLoaded}
                />
              )}
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={30} minSize={20}>
              {selectedModel && models && (
                <CustomizationPanel
                  model={selectedModel}
                  modelTypes={modelTypeOptions}
                  options={customizationOptions}
                  onChange={handleCustomizationChange}
                  onSave={handleSaveCustomization}
                />
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
        
        <div className="mt-6">
          <InstructionsPanel />
        </div>
      </div>
    </Shell>
  );
};

export default Forge;
