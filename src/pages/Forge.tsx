
import React, { useState, useEffect } from 'react';
import { Shell } from "@/components/layout/Shell";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { useAuth } from "@/contexts/AuthContext";
import { useModels, useModel, useSaveCustomization } from '@/hooks/use-model';
import ModelViewer from '@/components/forge/ModelViewer';
import CustomizationPanel from '@/components/forge/CustomizationPanel';
import InstructionsPanel from '@/components/forge/InstructionsPanel';
import ModelSelector from '@/components/forge/ModelSelector';
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
  const [customizationOptions, setCustomizationOptions] = useState<Record<string, any>>({});
  
  const saveCustomization = useSaveCustomization();

  // Select the first model when data loads
  useEffect(() => {
    if (models && models.length > 0 && !selectedModelId) {
      setSelectedModelId(models[0].id);
    }
  }, [models, selectedModelId]);

  // Initialize customization options from model defaults
  useEffect(() => {
    if (selectedModel) {
      setCustomizationOptions(selectedModel.default_options || {});
    }
  }, [selectedModel]);

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
    });
  };

  const isLoading = modelsLoading || modelLoading || !selectedModel;

  return (
    <Shell>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: 3D Viewer */}
            <div className="md:col-span-2 h-[500px]">
              {selectedModel && (
                <ModelViewer
                  model={selectedModel}
                  customizationOptions={customizationOptions}
                />
              )}
            </div>
            
            {/* Right: Customization Panel */}
            <div className="h-[500px]">
              {selectedModel && (
                <CustomizationPanel
                  model={selectedModel}
                  options={customizationOptions}
                  onChange={handleCustomizationChange}
                  onSave={handleSaveCustomization}
                />
              )}
            </div>
          </div>
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
