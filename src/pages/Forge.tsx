
import React, { useState, useEffect } from 'react';
import { Shell } from "@/components/layout/Shell";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { useAuth } from "@/contexts/AuthContext";
import { useModels, useModel, useSaveCustomization, useUserCustomization } from '@/hooks/use-model';
import ModelViewer from '@/components/forge/ModelViewer';
import CustomizationPanel from '@/components/forge/CustomizationPanel';
import InstructionsPanel from '@/components/forge/InstructionsPanel';
import ModelSelector from '@/components/forge/ModelSelector';
import { 
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle 
} from "@/components/ui/resizable";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [customizationOptions, setCustomizationOptions] = useState<Record<string, any>>({});
  
  const saveCustomization = useSaveCustomization();

  // Select the first model when data loads
  useEffect(() => {
    if (models && models.length > 0 && !selectedModelId) {
      setSelectedModelId(models[0].id);
    }
  }, [models, selectedModelId]);

  // Initialize customization options from saved customization or model defaults
  useEffect(() => {
    if (selectedModel) {
      if (savedCustomization) {
        setCustomizationOptions(savedCustomization.customization_options);
      } else {
        setCustomizationOptions(selectedModel.default_options || {});
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

  const isLoading = modelsLoading || modelLoading || !selectedModel;

  return (
    <Shell>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">3D Model Forge</h1>
          <p className="text-gray-600">Customize and personalize 3D models to your liking</p>
        </div>
        
        {/* Model Selector */}
        <div className="mb-6">
          {models && models.length > 0 ? (
            <ModelSelector
              models={models}
              selectedModelId={selectedModelId}
              onSelectModel={setSelectedModelId}
            />
          ) : (
            <div className="text-gray-500">No models available</div>
          )}
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
            
            {/* Right: Customization Panel */}
            <ResizablePanel defaultSize={30} minSize={20}>
              {selectedModel && (
                <CustomizationPanel
                  model={selectedModel}
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
