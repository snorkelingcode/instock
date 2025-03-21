import React, { useState, useEffect, useRef } from 'react';
import { Shell } from "@/components/layout/Shell";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { useAuth } from "@/contexts/AuthContext";
import { useModels, useModel, useSaveCustomization, useUserCustomization } from '@/hooks/use-model';
import { ModelViewer } from '@/components/forge/ModelViewer';
import CustomizationPanel from '@/components/forge/CustomizationPanel';
import InstructionsPanel from '@/components/forge/InstructionsPanel';
import ModelPreviewGrid from '@/components/forge/ModelPreviewGrid';
import { 
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle 
} from "@/components/ui/resizable";
import { Loader2, ChevronDown, ChevronUp, Computer, Download } from 'lucide-react';
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
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CACHE_KEY_MODELS = 'forgeModels';
const CACHE_KEY_PRELOAD_STATUS = 'forgePreloadStatus';
const PRELOAD_TIMEOUT = 30000; // 30 seconds max preload time

const Forge = () => {
  useMetaTags({
    title: "Forge - 3D Model Modifier",
    description: "Customize and personalize 3D models in our interactive forge."
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
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
  const morphEnabled = !isMobile; // Disable morphing on mobile
  
  const modelSelectTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSelectedId = useRef<string>('');
  
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const availableCombinations = useRef<Set<string>>(new Set());
  
  const [preloadProgress, setPreloadProgress] = useState({ loaded: 0, total: 0 });
  const [preloadComplete, setPreloadComplete] = useState(false);
  const [preloadStarted, setPreloadStarted] = useState(false);
  const [performedCleanup, setPerformedCleanup] = useState(false);
  const initialLoadComplete = useRef(false);
  const forceShowInterface = useRef(false); // Ref to force show interface after initial preload
  
  const [activeTab, setActiveTab] = useState<string>("model");
  const [showInstructions, setShowInstructions] = useState(false);
  
  const [modelPreviews, setModelPreviews] = useState([
    {
      id: '1',
      title: 'Slab Slider (Rounded)',
      description: 'A rounded corner slab slider case without magnets. Perfect for showcasing your favorite cards.',
      imageUrl: '/lovable-uploads/05e57c85-5441-4fff-b945-4a5e864300ce.png',
      downloadUrl: '#',
      type: 'slab-slider' as const
    },
    {
      id: '2',
      title: 'Slab Slider (Square)',
      description: 'A square corner slab slider case without magnets. Clean, modern design for your collection.',
      imageUrl: '/lovable-uploads/125a6be9-26e0-4a93-bdba-b6e59987210a.png',
      downloadUrl: '#',
      type: 'slab-slider' as const
    },
    {
      id: '3',
      title: 'Slab Slider (Flat)',
      description: 'A flat corner slab slider case without magnets. Sleek, minimalist design for your collection.',
      imageUrl: '/lovable-uploads/125a6be9-26e0-4a93-bdba-b6e59987210a.png',
      downloadUrl: '#',
      type: 'slab-slider' as const
    },
    {
      id: '4',
      title: 'Slab Slider (Rounded + Magnets)',
      description: 'A rounded corner slab slider case with magnets for secure closure and display.',
      imageUrl: '/lovable-uploads/eec1c627-b940-4257-b4dc-18d6a1210fc7.png',
      downloadUrl: '#',
      type: 'slab-slider' as const
    },
    {
      id: '5',
      title: 'Slab Slider (Square + Magnets)',
      description: 'A square corner slab slider case with magnets for secure closure and display.',
      imageUrl: '/lovable-uploads/eec1c627-b940-4257-b4dc-18d6a1210fc7.png',
      downloadUrl: '#',
      type: 'slab-slider' as const
    },
    {
      id: '6',
      title: 'Slab Slider (Flat + Magnets)',
      description: 'A flat corner slab slider case with magnets for secure closure and display.',
      imageUrl: '/lovable-uploads/eec1c627-b940-4257-b4dc-18d6a1210fc7.png',
      downloadUrl: '#',
      type: 'slab-slider' as const
    },
    {
      id: '7',
      title: 'Slab Loader (Rounded)',
      description: 'A rounded corner slab loader case without magnets. Easy access to your cards.',
      imageUrl: '/lovable-uploads/6f9cfca6-a0a1-4651-856a-ae5b1b8b372d.png',
      downloadUrl: '#',
      type: 'slab-loader' as const
    },
    {
      id: '8',
      title: 'Slab Loader (Square)',
      description: 'A square corner slab loader case without magnets. Sleek design for your collection.',
      imageUrl: '/lovable-uploads/8be85c80-3a73-44ab-b4a4-e3ceb269fb17.png',
      downloadUrl: '#',
      type: 'slab-loader' as const
    },
    {
      id: '9',
      title: 'Slab Loader (Flat)',
      description: 'A flat corner slab loader case without magnets. Modern, minimalist design for your collection.',
      imageUrl: '/lovable-uploads/8be85c80-3a73-44ab-b4a4-e3ceb269fb17.png',
      downloadUrl: '#',
      type: 'slab-loader' as const
    },
    {
      id: '10',
      title: 'Slab Loader (Rounded + Magnets)',
      description: 'A rounded corner slab loader case with magnets for secure storage and display.',
      imageUrl: '/lovable-uploads/5222a634-7636-44dc-b5c9-f1f8ff45b6b8.png',
      downloadUrl: '#',
      type: 'slab-loader' as const
    },
    {
      id: '11',
      title: 'Slab Loader (Square + Magnets)',
      description: 'A square corner slab loader case with magnets for secure storage and display.',
      imageUrl: '/lovable-uploads/5222a634-7636-44dc-b5c9-f1f8ff45b6b8.png',
      downloadUrl: '#',
      type: 'slab-loader' as const
    },
    {
      id: '12',
      title: 'Slab Loader (Flat + Magnets)',
      description: 'A flat corner slab loader case with magnets for secure storage and display.',
      imageUrl: '/lovable-uploads/5222a634-7636-44dc-b5c9-f1f8ff45b6b8.png',
      downloadUrl: '#',
      type: 'slab-loader' as const
    }
  ]);
  
  const saveCustomization = useSaveCustomization();

  useEffect(() => {
    if (!models || models.length === 0 || modelsLoading || preloadStarted) return;
    
    setPreloadStarted(true);
    console.log("Starting preload process for models");
    
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
    }, isMobile ? 15000 : PRELOAD_TIMEOUT); // 15 seconds timeout for mobile
    
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
      console.log(`Starting preload of models (mobile: ${isMobile})`);
      
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
        }, isMobile);
        
        const failedUrls = getFailedUrls();
        if (failedUrls.length > 0) {
          await cleanupInvalidModels(failedUrls);
          setPerformedCleanup(true);
        }
        
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
  }, [models, modelsLoading, preloadStarted, isMobile, toast]);

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
  }, [models, customizationOptions, selectedModelId, selectedModel, loadedModels, preloadComplete, morphEnabled]);

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
    if (!user) {
      toast({
        title: "Sign in required",
        description: "You must be logged in to save customizations. Your changes will not be saved.",
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

  const isLoading = modelsLoading && !models && preloadProgress.total === 0 && 
                   !forceShowInterface.current && !preloadComplete;

  useEffect(() => {
    if (models?.length > 0 && !selectedModelId && !modelsLoading) {
      const defaultModel = models.find(model => model.stl_file_path && !didModelFail(model.stl_file_path));
      if (defaultModel) {
        console.log('Setting default model ID:', defaultModel.id);
        setSelectedModelId(defaultModel.id);
      }
    }
  }, [models, selectedModelId, modelsLoading]);

  const toggleInstructions = () => {
    setShowInstructions(prev => !prev);
  };

  useEffect(() => {
    if (models?.length > 0) {
      const updatedPreviews = modelPreviews.map(preview => {
        const isSlabSlider = preview.type === 'slab-slider';
        const hasRoundedCorners = preview.title.includes('Rounded');
        const hasMagnets = preview.title.includes('Magnets');
        
        const matchingModel = models.find(model => {
          const options = model.default_options || {};
          return (
            options.modelType === (isSlabSlider ? 'Slab-Slider' : 'Slab-Loader') &&
            options.corners === (hasRoundedCorners ? 'rounded' : 'square') &&
            options.magnets === (hasMagnets ? 'yes' : 'no')
          );
        });
        
        if (matchingModel?.stl_file_path) {
          return {
            ...preview,
            downloadUrl: matchingModel.stl_file_path
          };
        }
        
        return preview;
      });
      
      setModelPreviews(updatedPreviews);
    }
  }, [models]);

  const handleModelLoaded = (url: string, geometry: THREE.BufferGeometry) => {
    setLoadedModels(prev => {
      const newMap = new Map(prev);
      newMap.set(url, geometry);
      return newMap;
    });
  };

  const handleDownloadModel = () => {
    if (selectedModel?.stl_file_path) {
      window.open(selectedModel.stl_file_path, '_blank');
    } else {
      toast({
        title: "Error",
        description: "No STL file available for download",
        variant: "destructive",
      });
    }
  };

  return (
    <Shell>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Forge</h1>
          <p className="text-gray-600">Customize and personalize 3D models to your liking</p>
          
          {isMobile && (
            <p className="mt-2 text-sm text-orange-600 font-medium">
              Mobile Mode: Preview and download models
            </p>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex flex-col justify-center items-center min-h-[500px]">
            <LoadingSpinner size="lg" className="mb-4" />
            {preloadProgress.total > 0 && (
              <div className="w-64 text-center">
                <p className="mb-2">
                  {isMobile ? "Loading model previews" : "Preloading models"}: 
                  {preloadProgress.loaded} of {preloadProgress.total}
                </p>
                <Progress 
                  value={(preloadProgress.loaded / preloadProgress.total) * 100} 
                  className="h-2 w-full"
                />
                <p className="mt-2 text-sm text-gray-500">
                  {isMobile ? 
                    "Optimized for mobile devices" : 
                    "This ensures smooth transitions between models"}
                </p>
              </div>
            )}
          </div>
        ) : isMobile ? (
          <div className="flex flex-col space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Computer className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Desktop Required for Full Features</AlertTitle>
              <AlertDescription className="text-blue-700 text-sm">
                The interactive 3D customization is only available on desktop computers. 
                You can preview and download models below.
              </AlertDescription>
            </Alert>
            
            <ModelPreviewGrid previews={modelPreviews} />
            
            <div className="border rounded-lg overflow-hidden">
              <button 
                onClick={() => setShowInstructions(prev => !prev)}
                className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium">Instructions</span>
                {showInstructions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {showInstructions && (
                <div className="p-4">
                  <InstructionsPanel isAuthenticated={!!user} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            <ResizablePanelGroup
              direction="horizontal"
              className="min-h-[600px] rounded-lg border"
            >
              <ResizablePanel defaultSize={70} minSize={30}>
                {models && (
                  <ModelViewer
                    model={selectedModel || (models[0] || null)}
                    previousModel={previousModelRef.current}
                    customizationOptions={customizationOptions}
                    morphEnabled={morphEnabled}
                    loadedModels={loadedModels}
                    onModelsLoaded={handleModelLoaded}
                    preloadComplete={preloadComplete || forceShowInterface.current}
                    preserveExistingModel={true}
                  />
                )}
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={30} minSize={20}>
                {models && (
                  <CustomizationPanel
                    model={selectedModel || (models[0] || null)}
                    modelTypes={modelTypeOptions}
                    options={customizationOptions}
                    onChange={handleCustomizationChange}
                    onSave={handleDownloadModel}
                    isAuthenticated={true}
                  />
                )}
              </ResizablePanel>
            </ResizablePanelGroup>
            
            
            <div className="border rounded-lg overflow-hidden">
              <button 
                onClick={toggleInstructions}
                className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium">Instructions</span>
                {showInstructions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {showInstructions && (
                <div className="p-4">
                  <InstructionsPanel isAuthenticated={!!user} />
                </div>
              )}
            </div>
            
            
            <div className="mt-6">
              <h2 className="text-2xl font-semibold mb-4">Model Gallery</h2>
              <ModelPreviewGrid previews={modelPreviews} />
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
};

export default Forge;
