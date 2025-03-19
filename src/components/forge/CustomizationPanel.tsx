
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
import { 
  Circle, 
  Square, 
  Triangle, 
  Download 
} from 'lucide-react';
import { ThreeDModel } from '@/types/model';

interface CustomizationPanelProps {
  model: ThreeDModel;
  modelTypes: string[];
  options: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onSave: () => void;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ 
  model, 
  modelTypes,
  options, 
  onChange, 
  onSave 
}) => {
  // Get available options from the model's default_options
  const availableOptions = Object.keys(model.default_options || {});
  
  const handleDownload = () => {
    // Create an anchor element and trigger download
    if (model.stl_file_path) {
      const link = document.createElement('a');
      link.href = model.stl_file_path;
      
      // Generate a filename based on model type and options
      const modelType = options.modelType || model.default_options?.modelType || 'model';
      const fileExtension = model.stl_file_path.split('.').pop() || 'stl';
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      const filename = `${modelType}-${timestamp}.${fileExtension}`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  return (
    <Card className="w-full h-full overflow-auto">
      <CardContent className="p-4">
        <div className="text-center mb-6">
          <div className="inline-block">
            <img 
              src="/lovable-uploads/dccfe5de-716f-471c-b408-3ae8cfee4d5d.png" 
              alt="FORGE" 
              className="h-12 w-auto"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Model Type Selector */}
          <div className="space-y-2">
            <Label htmlFor="modelType">Model Type</Label>
            <Select 
              value={options.modelType || 'Slab-Slider'} 
              onValueChange={(value) => onChange('modelType', value)}
            >
              <SelectTrigger id="modelType">
                <SelectValue placeholder="Select model type" />
              </SelectTrigger>
              <SelectContent>
                {modelTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Corners Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="corners">Corners</Label>
            <Select 
              value={options.corners || 'rounded'} 
              onValueChange={(value) => onChange('corners', value)}
            >
              <SelectTrigger id="corners">
                <SelectValue placeholder="Select corner style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="rounded">Rounded</SelectItem>
                <SelectItem value="flat">Flat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Magnets Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="magnets">Magnets</Label>
            <Select 
              value={options.magnets || 'no'} 
              onValueChange={(value) => onChange('magnets', value)}
            >
              <SelectTrigger id="magnets">
                <SelectValue placeholder="Include magnets?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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
            onClick={handleDownload}
            variant="default"
          >
            <Download className="h-4 w-4" />
            Download Model
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomizationPanel;
