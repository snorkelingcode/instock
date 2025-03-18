
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ThreeDModel } from '@/types/model';

interface CustomizationPanelProps {
  model: ThreeDModel;
  options: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onSave: () => void;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ 
  model, 
  options, 
  onChange, 
  onSave 
}) => {
  // Get available options from the model's default_options
  const availableOptions = Object.keys(model.default_options || {});
  
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
          {availableOptions.includes('color') && (
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={options.color || model.default_options.color || '#ffffff'}
                onChange={(e) => onChange('color', e.target.value)}
              />
            </div>
          )}
          
          {availableOptions.includes('scale') && (
            <div className="space-y-2">
              <Label htmlFor="scale">Scale: {options.scale || model.default_options.scale || 1}</Label>
              <Slider
                id="scale"
                defaultValue={[options.scale || model.default_options.scale || 1]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={(value) => onChange('scale', value[0])}
              />
            </div>
          )}
          
          {availableOptions.includes('material') && (
            <div className="space-y-2">
              <Label htmlFor="material">Material</Label>
              <Select 
                value={options.material || model.default_options.material || 'plastic'} 
                onValueChange={(value) => onChange('material', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plastic">Plastic</SelectItem>
                  <SelectItem value="metal">Metal</SelectItem>
                  <SelectItem value="wood">Wood</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Button 
            className="w-full mt-8" 
            onClick={onSave}
            variant="default"
          >
            Save Customization
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomizationPanel;
