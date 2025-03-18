
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
import { Switch } from "@/components/ui/switch";
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from "@/components/ui/toggle-group";
import { Circle, Square, Triangle, BoltIcon, Hammer, Save } from 'lucide-react';
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
              <div className="grid grid-cols-5 gap-2">
                {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'].map((colorOption) => (
                  <div 
                    key={colorOption}
                    className={`w-full aspect-square rounded-full cursor-pointer border-2 ${
                      options.color === colorOption ? 'border-white ring-2 ring-red-500' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: colorOption }}
                    onClick={() => onChange('color', colorOption)}
                  />
                ))}
              </div>
              <Input
                id="color"
                type="color"
                value={options.color || model.default_options.color || '#ffffff'}
                onChange={(e) => onChange('color', e.target.value)}
                className="w-full h-8 mt-2"
              />
            </div>
          )}
          
          {availableOptions.includes('scale') && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="scale">Scale</Label>
                <span className="text-sm font-mono">{(options.scale || model.default_options.scale || 1).toFixed(1)}</span>
              </div>
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
          
          {availableOptions.includes('shape') && (
            <div className="space-y-2">
              <Label>Shape</Label>
              <ToggleGroup 
                type="single" 
                value={options.shape || model.default_options.shape || 'circle'}
                onValueChange={(value) => {
                  if (value) onChange('shape', value);
                }}
                className="justify-start"
              >
                <ToggleGroupItem value="circle" aria-label="Circle">
                  <Circle className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="square" aria-label="Square">
                  <Square className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="triangle" aria-label="Triangle">
                  <Triangle className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}
          
          {availableOptions.includes('text') && (
            <div className="space-y-2">
              <Label htmlFor="text">Custom Text</Label>
              <Input
                id="text"
                value={options.text || model.default_options.text || ''}
                onChange={(e) => onChange('text', e.target.value)}
                placeholder="Enter custom text"
                maxLength={20}
              />
            </div>
          )}
          
          {availableOptions.includes('showLogo') && (
            <div className="flex items-center justify-between">
              <Label htmlFor="showLogo" className="cursor-pointer">Show Logo</Label>
              <Switch
                id="showLogo"
                checked={options.showLogo || model.default_options.showLogo || false}
                onCheckedChange={(checked) => onChange('showLogo', checked)}
              />
            </div>
          )}
          
          <Button 
            className="w-full mt-8 gap-2" 
            onClick={onSave}
            variant="default"
          >
            <Save className="h-4 w-4" />
            Save Customization
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomizationPanel;
