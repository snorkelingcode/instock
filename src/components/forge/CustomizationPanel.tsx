
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Download } from 'lucide-react';
import { ThreeDModel } from '@/types/model';
import ModelSelector from './ModelSelector';
import ColorOption from './options/ColorOption';
import ScaleOption from './options/ScaleOption';
import MaterialOption from './options/MaterialOption';
import ShapeOption from './options/ShapeOption';
import TextOption from './options/TextOption';
import SwitchOption from './options/SwitchOption';
import SelectOption from './options/SelectOption';
import ActionButton from './options/ActionButton';
import { Label } from "@/components/ui/label";

interface CustomizationPanelProps {
  model: ThreeDModel;
  models: ThreeDModel[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  options: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onSave: () => void;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ 
  model, 
  models,
  selectedModelId,
  onSelectModel,
  options, 
  onChange, 
  onSave 
}) => {
  // Get available options from the model's default_options
  const availableOptions = Object.keys(model.default_options || {});
  
  const handleDownload = () => {
    // For now, just trigger the same onSave function
    onSave();
  };
  
  return (
    <Card className="w-full h-full overflow-auto">
      <CardContent className="p-4">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold relative inline-block">
            <span className="relative z-10 text-red-600" style={{ 
              WebkitTextStroke: '1px black',
              textShadow: '0 0 1px #000'
            }}>
              FORGE
            </span>
          </h2>
        </div>
        
        <div className="space-y-4">
          {/* Model Selector with Label */}
          <div className="space-y-2">
            <Label htmlFor="model-selector" className="font-medium">Models</Label>
            <ModelSelector
              models={models}
              selectedModelId={selectedModelId}
              onSelectModel={onSelectModel}
            />
          </div>
          
          {/* Common Select Options */}
          <SelectOption
            id="corners"
            label="Corners"
            value={options.corners || 'rounded'}
            onChange={(value) => onChange('corners', value)}
            options={[
              { value: 'rounded', label: 'Rounded' },
              { value: 'squared', label: 'Squared' }
            ]}
            defaultValue="rounded"
          />
          
          <SelectOption
            id="centering"
            label="Centering"
            value={options.centering || 'off-top-left'}
            onChange={(value) => onChange('centering', value)}
            options={[
              { value: 'off-top-left', label: 'Off-Top-Left (Default)' },
              { value: 'off-top-right', label: 'Off-Top-Right' },
              { value: 'top-centered', label: 'Top-Centered' },
              { value: 'centered', label: 'Centered' },
              { value: 'off-left', label: 'Off-Left' },
              { value: 'off-right', label: 'Off-Right' },
              { value: 'bottom-centered', label: 'Bottom-Centered' }
            ]}
            defaultValue="off-top-left"
          />
          
          {/* Model-specific Options */}
          {availableOptions.includes('color') && (
            <ColorOption
              value={options.color || ''}
              onChange={(value) => onChange('color', value)}
              defaultValue={model.default_options.color || '#ffffff'}
            />
          )}
          
          {availableOptions.includes('scale') && (
            <ScaleOption
              value={options.scale || 0}
              onChange={(value) => onChange('scale', value)}
              defaultValue={model.default_options.scale || 1}
            />
          )}
          
          {availableOptions.includes('material') && (
            <MaterialOption
              value={options.material || ''}
              onChange={(value) => onChange('material', value)}
              defaultValue={model.default_options.material || 'plastic'}
            />
          )}
          
          {availableOptions.includes('shape') && (
            <ShapeOption
              value={options.shape || ''}
              onChange={(value) => onChange('shape', value)}
              defaultValue={model.default_options.shape || 'circle'}
            />
          )}
          
          {availableOptions.includes('text') && (
            <TextOption
              value={options.text || ''}
              onChange={(value) => onChange('text', value)}
              defaultValue={model.default_options.text || ''}
            />
          )}
          
          {availableOptions.includes('showLogo') && (
            <SwitchOption
              id="showLogo"
              label="Show Logo"
              checked={options.showLogo || false}
              onChange={(checked) => onChange('showLogo', checked)}
              defaultChecked={model.default_options.showLogo || false}
            />
          )}
          
          <ActionButton 
            label="Download Model"
            onClick={handleDownload}
            icon={Download}
            className="mt-8"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomizationPanel;
