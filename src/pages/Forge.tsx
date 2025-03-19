
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
  const { data: savedCustomization } = useUserCustomization(selectedModelId);
  const [customizationOptions, setCustomizationOptions] = useState<Record<string, any>>({
    modelType: 'Slab-Slider',
    corners: 'rounded',
    magnets: 'no',
    color: '#ff0000',
    scale: 1,
    material: 'plastic',
  });
  
  // Track previous model state for morphing
  const previousModelRef = useRef<ThreeDModel | null>(null);
  const [modelChangeTriggered, setModelChangeTriggered] = useState(false);
  
  const saveCustomization = useSaveCustomization();

  // Find the appropriate model based on customization options
  useEffect(() => {
    if (models && models.length > 0) {
      const modelType = customizationOptions.modelType || 'Slab-Slider';
      const corners = customizationOptions.corners || 'rounded';
      const magnets = customizationOptions.magnets || 'no';
      
      // Store previous model before changing
      if (selectedModel && modelChangeTriggered) {
        previousModelRef.current = selectedModel;
      }
      
      // Find model that matches the current customization options
      const matchingModel = models.find(model => {
        const defaultOptions = model.default_options || {};
        return (
          defaultOptions.modelType === modelType &&
          defaultOptions.corners === corners &&
          defaultOptions.magnets === magnets
        );
      });
      
      if (matchingModel && matchingModel.id !== selectedModelId) {
        setSelectedModelId(matchingModel.id);
        setModelChangeTriggered(true);
      } else if (!selectedModelId && models.length > 0) {
        // Fallback to first model if no match found
        setSelectedModelId(models[0].id);
        setModelChangeTriggered(true);
      }
    }
  }, [models, customizationOptions, selectedModelId, selectedModel]);

  // Reset the model change trigger after it's been processed
  useEffect(() => {
    if (modelChangeTriggered) {
      const timer = setTimeout(() => {
        setModelChangeTriggered(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [modelChangeTriggered]);

  // Initialize customization options from saved customization or model defaults
  useEffect(() => {
    if (selectedModel) {
      if (savedCustomization) {
        setCustomizationOptions(prev => ({
          ...prev,
          ...savedCustomization.customization_options
        }));
      } else {
        setCustomizationOptions(prev => ({
          ...prev,
          ...selectedModel.default_options,
        }));
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
                  customizationOptions={customizationOptions}
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
