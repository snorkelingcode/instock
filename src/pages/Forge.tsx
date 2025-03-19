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

const Forge = () => {
  useMetaTags({
    title: "Forge - Customize 3D Models",
    description: "Customize and personalize 3D models in our interactive forge."
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const { data: models, isLoading: modelsLoading } = useModels();
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const { data: selectedModel, isLoading: modelLoading } = useModel(selectedModelId);
  
  // We won't fetch user customization on every option change to avoid refreshes
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
  
  // Track loaded models
  const [loadedModels, setLoadedModels] = useState<Map<string, THREE.BufferGeometry>>(new Map());
  
  // Track previous model for morphing
  const previousModelRef = useRef<ThreeDModel | null>(null);
  const [morphEnabled, setMorphEnabled] = useState(false);
  
  // Prevent continuous model selection on option change
  const modelSelectTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSelectedId = useRef<string>('');
  
  // Track which model combinations have been preloaded
  const preloadedCombinations = useRef<Set<string>>(new Set());
  
  const saveCustomization = useSaveCustomization();

  // Handle when models load to keep track of them
  const handleModelLoaded = (url: string, geometry: THREE.BufferGeometry) => {
    setLoadedModels(prev => {
      const newMap = new Map(prev);
      newMap.set(url, geometry);
      return newMap;
    });
  };

  // Find the appropriate model based on customization options
  useEffect(() => {
    if (!models || models.length === 0) return;
    
    // Store previous model before finding a new one
    if (selectedModel) {
      previousModelRef.current = selectedModel;
    }

    const findMatchingModel = () => {
      const modelType = customizationOptions.modelType || 'Slab-Slider';
      const corners = customizationOptions.corners || 'rounded';
      const magnets = customizationOptions.magnets || 'no';
      
      // Create a combination string to track this specific selection
      const combinationKey = `${modelType}-${corners}-${magnets}`;
      
      // Find model that matches current options
      const matchingModel = models.find(model => {
        const defaultOptions = model.default_options || {};
        return (
          defaultOptions.modelType === modelType &&
          defaultOptions.corners === corners &&
          defaultOptions.magnets === magnets
        );
      });
      
      if (matchingModel) {
        // Only set morphEnabled and update model if it's different
        if (matchingModel.id !== selectedModelId) {
          // We can morph if we've seen this model before
          const shouldMorph = loadedModels.has(matchingModel.stl_file_path) || 
                             (lastSelectedId.current && lastSelectedId.current !== '');
          
          setMorphEnabled(shouldMorph);
          lastSelectedId.current = selectedModelId;
          setSelectedModelId(matchingModel.id);
        }
      } else if (!selectedModelId && models.length > 0) {
        // Fallback to first model if no match found
        setSelectedModelId(models[0].id);
      }
    };
    
    // Clear any existing timeout
    if (modelSelectTimeout.current) {
      clearTimeout(modelSelectTimeout.current);
    }
    
    // Add a small delay to prevent multiple model changes in quick succession
    modelSelectTimeout.current = setTimeout(findMatchingModel, 100);
    
    return () => {
      if (modelSelectTimeout.current) {
        clearTimeout(modelSelectTimeout.current);
      }
    };
  }, [models, customizationOptions, selectedModelId, selectedModel, loadedModels]);

  // Reset the morph enabled flag after a delay to ensure transition completes
  useEffect(() => {
    if (morphEnabled) {
      const timer = setTimeout(() => {
        setMorphEnabled(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [morphEnabled, selectedModelId]);

  // Initialize customization options from saved customization or model defaults
  // Only do this once when model changes, not continuously
  useEffect(() => {
    if (selectedModel) {
      const newOptions = { ...customizationOptions };
      let shouldUpdate = false;
      
      // Apply saved customization if available
      if (savedCustomization) {
        Object.entries(savedCustomization.customization_options).forEach(([key, value]) => {
          if (newOptions[key] !== value) {
            newOptions[key] = value;
            shouldUpdate = true;
          }
        });
      } else if (selectedModel.default_options) {
        // Apply model defaults if no saved customization
        // Only update options that aren't related to model selection
        Object.entries(selectedModel.default_options).forEach(([key, value]) => {
          // Skip updating model type, corners, magnets as they are selection criteria
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

  // Preload all model combinations when models are available
  useEffect(() => {
    if (!models || models.length === 0 || modelsLoading) return;
    
    const preloadModels = async () => {
      // Create a set to track all possible combinations
      const allCombinations = new Set<string>();
      
      // Get all unique values for each option
      const modelTypes = new Set<string>();
      const cornerStyles = new Set<string>();
      const magnetsOptions = new Set<string>();
      
      models.forEach(model => {
        const defaultOptions = model.default_options || {};
        if (defaultOptions.modelType) modelTypes.add(defaultOptions.modelType);
        if (defaultOptions.corners) cornerStyles.add(defaultOptions.corners);
        if (defaultOptions.magnets) magnetsOptions.add(defaultOptions.magnets);
      });
      
      // Generate all possible combinations
      modelTypes.forEach(modelType => {
        cornerStyles.forEach(corners => {
          magnetsOptions.forEach(magnets => {
            const combinationKey = `${modelType}-${corners}-${magnets}`;
            allCombinations.add(combinationKey);
          });
        });
      });
      
      // Check which combinations we've already preloaded
      const combinationsToPreload = Array.from(allCombinations)
        .filter(combo => !preloadedCombinations.current.has(combo));
      
      // Log preloading information
      console.log(`Preloading ${combinationsToPreload.length} model combinations`);
      
      // Add each combination to preloaded set
      combinationsToPreload.forEach(combo => {
        preloadedCombinations.current.add(combo);
      });
      
      // Preload each model
      for (const combo of combinationsToPreload) {
        const [modelType, corners, magnets] = combo.split('-');
        
        // Find matching model
        const matchingModel = models.find(model => {
          const defaultOptions = model.default_options || {};
          return (
            defaultOptions.modelType === modelType &&
            defaultOptions.corners === corners &&
            defaultOptions.magnets === magnets
          );
        });
        
        if (matchingModel && matchingModel.stl_file_path) {
          // We don't need to actually load it here since it will be loaded
          // when needed by the ModelViewer component
          console.log(`Identified model for preloading: ${combo} - ${matchingModel.stl_file_path}`);
        }
      }
    };
    
    preloadModels();
  }, [models, modelsLoading]);

  const handleCustomizationChange = (key: string, value: any) => {
    // Update all customization options at once to prevent multiple renders
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

  // Extract unique model types for dropdown
  const modelTypeOptions = models 
    ? [...new Set(models.map(model => model.default_options?.modelType).filter(Boolean))]
    : [];

  const isLoading = modelsLoading || modelLoading || !selectedModel;

  return (
    <Shell>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">3D Model Forge</h1>
          <p className="text-gray-600">Customize and personalize 3D models to your liking</p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[500px]">
            <Loader2 className="w-12 h-12 animate-spin text-red-600" />
          </div>
        ) : (
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[600px] rounded-lg border"
          >
            {/* Left: 3D Viewer */}
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
            
            {/* Right: Customization Panel with Model Selector */}
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
        
        {/* Bottom: Instructions */}
        <div className="mt-6">
          <InstructionsPanel />
        </div>
      </div>
    </Shell>
  );
};

export default Forge;
