
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThreeDModel } from '@/types/model';

interface ModelSelectorProps {
  models: ThreeDModel[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  models, 
  selectedModelId, 
  onSelectModel 
}) => {
  if (!models || models.length === 0) {
    return <div className="text-gray-500">No models available</div>;
  }
  
  return (
    <div className="w-full">
      <Select 
        value={selectedModelId} 
        onValueChange={onSelectModel}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {models.map(model => (
            <SelectItem key={model.id} value={model.id}>
              {model.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ModelSelector;
