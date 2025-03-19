
import React, { useState, useEffect, useRef } from 'react';
import { Shell } from "@/components/layout/Shell";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { useAuth } from "@/contexts/AuthContext";
import { useModels, useModel, useSaveCustomization, useUserCustomization } from '@/hooks/use-model';
import { ModelViewer } from '@/components/forge/ModelViewer';
import CustomizationPanel from '@/components/forge/CustomizationPanel';
import InstructionsPanel from '@/components/forge/InstructionsPanel';
import { 
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle 
} from "@/components/ui/resizable";
import { Loader2 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
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
  getModelsNeedingCleanup,
  clearPreloadCache,
  getPreloadedGeometry,
  trackModelCombinations,
  isCombinationPreloaded
} from '@/utils/modelPreloader';
import { cleanupInvalidModels } from '@/services/modelService';

const CACHE_KEY_MODELS = 'forgeModels';
const CACHE_KEY_PRELOAD_STATUS = 'forgePreloadStatus';
const PRELOAD_TIMEOUT = 30000; // 30 seconds max preload time

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
    staleTime: Infinity,
    retry: false,
    onError: (error: any) => {
      console.error("Error fetching user customization:", error);
    }
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
  const morphEnabled = true;
  
  const modelSelectTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSelectedId = useRef<string>('');
  
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const availableCombinations = useRef<Set<string>>(new Set());
  
  const [preloadProgress, setPreloadProgress] = useState({ loaded: 0, total: 0 });
  const [preloadComplete, setPreloadComplete] = useState(false);
  const [preloadStarted, setPreloadStarted] = useState(false);
  const [performedCleanup, setPerformedCleanup] = useState(false);
  const initialLoadComplete = useRef(false);
  const forceShowInterface = useRef(false); // New ref to force show interface after initial preload
  
  const saveCustomization = useSaveCustomization();

  const handleModelLoaded = (url: string, geometry: THREE.BufferGeometry) => {
    setLoadedModels(prev => {
      const newMap = new Map(prev);
      newMap.set(url, geometry);
      return newMap;
    });
  };

  const handleCleanupInvalidModels = async () => {
    if (performedCleanup) return;
    
    const invalidUrls = getModelsNeedingCleanup();
    if (invalidUrls.length === 0) return;
    
    console.log(`Found ${invalidUrls.length} invalid models that need cleanup`);
    
    try {
      const success = await cleanupInvalidModels(invalidUrls);
      if (success) {
        setPerformedCleanup(true);
        resetLoaderState();
        await refetchModels();
        
        toast({
          title: "Models Cleanup",
          description: `Removed ${invalidUrls.length} invalid model references from the database.`,
        });
      }
    } catch (error) {
      console.error("Failed to clean up invalid models:", error);
      toast({
        title: "Error",
        description: "There was an error cleaning up invalid models. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!models || models.length === 0 || modelsLoading || preloadStarted) return;
    
    setPreloadStarted(true);
    console.log("Starting preload process for all models");
    
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }
    
    preloadTimeoutRef.current = setTimeout(() => {
      if (!preloadComplete) {
        console.warn('Preload timeout reached, showing UI anyway');
        setPreloadComplete(true);
        initialLoadComplete.current = true;
        forceShowInterface.current = true;
        
        toast({
          title: "Warning",
          description: "Model preloading timed out. Some models may load slower than expected.",
          variant: "destructive",
        });
      }
    }, PRELOAD_TIMEOUT);
    
    const cachedStatus = getCache<{ complete: boolean }>(CACHE_KEY_PRELOAD_STATUS);
    if (cachedStatus?.complete && initialLoadComplete.current) {
      console.log('Using cached preload status, skipping preload');
      setPreloadComplete(true);
      forceShowInterface.current = true;
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
      return;
    }
    
    const preloadAllModels = async () => {
      console.log(`Starting preload of all ${models.length} models`);
      
      try {
        const combinations = trackModelCombinations(models);
        availableCombinations.current = combinations;
        console.log(`Tracked ${combinations.size} model combinations for morphing`);
        
        await preloadModels(models, (loaded, total) => {
          setPreloadProgress({ loaded, total });
          console.log(`Preload progress: ${loaded}/${total} models loaded`);
          
          if (loaded === total) {
            console.log("✅ All models preloaded successfully!");
            setPreloadComplete(true);
            initialLoadComplete.current = true;
            forceShowInterface.current = true;
            if (preloadTimeoutRef.current) {
              clearTimeout(preloadTimeoutRef.current);
            }
            
            setCache(CACHE_KEY_PRELOAD_STATUS, { complete: true }, 30);
          }
        });
        
        await handleCleanupInvalidModels();
        
        console.log('Preload status:', getPreloadStatus());
      } catch (error) {
        console.error("Error during model preloading:", error);
        setPreloadComplete(true);
        initialLoadComplete.current = true;
        forceShowInterface.current = true;
        
        toast({
          title: "Warning",
          description: "Some models failed to preload. You may experience issues when changing model types.",
          variant: "destructive",
        });
      }
    };
    
    preloadAllModels();
    
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, [models, modelsLoading, preloadStarted]);

  useEffect(() => {
    if (!models || models.length === 0) return;
    
    if (selectedModel) {
      previousModelRef.current = selectedModel;
    }

    const findMatchingModel = () => {
      const preloadStatus = getPreloadStatus();
      
      const modelType = customizationOptions.modelType || 'Slab-Slider';
      const corners = customizationOptions.corners || 'rounded';
      const magnets = customizationOptions.magnets || 'no';
      const combinationKey = `${modelType}-${corners}-${magnets}`;
      
      // Only wait for preloading if it's the initial load - after that, allow immediate changing
      const readyForMorphing = initialLoadComplete.current || preloadComplete || forceShowInterface.current;
      
      if (!readyForMorphing && preloadStatus.isBatchLoading) {
        console.log('Still preloading models, waiting before changing model...');
        setTimeout(findMatchingModel, 500);
        return;
      }
      
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
          lastSelectedId.current = selectedModelId;
          setSelectedModelId(matchingModel.id);
          console.log(`Switching to model ${matchingModel.id} (${combinationKey}), morphing enabled: ${morphEnabled}`);
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
  }, [models, customizationOptions, selectedModelId, selectedModel, loadedModels, preloadComplete]);

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

  // Change this to show the interface once initial load or forced showing is complete
  const isLoading = (modelsLoading || !models || models.length === 0) && 
                   !initialLoadComplete.current && 
                   !forceShowInterface.current;

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
                <p className="mb-2">Preloading models: {preloadProgress.loaded} of {preloadProgress.total}</p>
                <Progress 
                  value={(preloadProgress.loaded / preloadProgress.total) * 100} 
                  className="h-2 w-full"
                />
                <p className="mt-2 text-sm text-gray-500">
                  This ensures smooth transitions between models
                </p>
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
                  preloadComplete={initialLoadComplete.current || preloadComplete || forceShowInterface.current}
                  preserveExistingModel={true} // Always preserve existing model to avoid blank screens
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
