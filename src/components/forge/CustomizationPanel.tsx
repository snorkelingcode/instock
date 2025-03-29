import React from 'react';
import { ThreeDModel } from '@/types/model';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from '@/hooks/use-mobile';
import { Download } from 'lucide-react';

interface CustomizationPanelProps {
  model: ThreeDModel;
  modelTypes: string[];
  options: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onSave: () => void;
  isAuthenticated?: boolean;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  model,
  modelTypes,
  options,
  onChange,
  onSave,
  isAuthenticated = false
}) => {
  const isMobile = useIsMobile();
  
  // Get available corner and magnet options
  const cornerOptions = ['rounded', 'square', 'flat'];
  const magnetOptions = ['yes', 'no'];
  const materialOptions = ['plastic', 'metal', 'wood'];
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange('color', e.target.value);
  };
  
  const handleScaleChange = (value: number[]) => {
    onChange('scale', value[0]);
  };
  
  return (
    <Card className="h-full border-0 rounded-none lg:border lg:rounded-lg">
      <CardHeader className={isMobile ? "px-4 py-3" : "px-6 py-4"}>
        <CardTitle className={isMobile ? "text-lg" : "text-xl"}>
          Customize {model?.name || 'Model'}
        </CardTitle>
      </CardHeader>
      <CardContent className={`space-y-4 ${isMobile ? "px-4 pb-4" : "px-6 pb-6"}`}>
        <div className="space-y-2">
          <Label htmlFor="modelType">Model Type</Label>
          <Select 
            value={options.modelType || ''} 
            onValueChange={(value) => onChange('modelType', value)}
          >
            <SelectTrigger id="modelType">
              <SelectValue placeholder="Select model type" />
            </SelectTrigger>
            <SelectContent>
              {modelTypes.filter(type => type.trim() !== '').map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/-/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="corners">Corner Style</Label>
          <Select 
            value={options.corners || 'rounded'} 
            onValueChange={(value) => onChange('corners', value)}
          >
            <SelectTrigger id="corners">
              <SelectValue placeholder="Select corner style" />
            </SelectTrigger>
            <SelectContent>
              {cornerOptions.map((corner) => (
                <SelectItem key={corner} value={corner}>
                  {corner.charAt(0).toUpperCase() + corner.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="magnets">Magnet Options</Label>
          <Select 
            value={options.magnets || 'no'} 
            onValueChange={(value) => onChange('magnets', value)}
          >
            <SelectTrigger id="magnets">
              <SelectValue placeholder="Select magnet option" />
            </SelectTrigger>
            <SelectContent>
              {magnetOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === 'yes' ? 'Include Magnets' : 'No Magnets'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="material">Material</Label>
          <Select 
            value={options.material || 'plastic'} 
            onValueChange={(value) => onChange('material', value)}
          >
            <SelectTrigger id="material">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {materialOptions.map((material) => (
                <SelectItem key={material} value={material}>
                  {material.charAt(0).toUpperCase() + material.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="color"
              type="color"
              value={options.color || '#ff0000'}
              onChange={handleColorChange}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={options.color || '#ff0000'}
              onChange={(e) => onChange('color', e.target.value)}
              className="flex-1"
              maxLength={7}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="scale">Scale</Label>
            <span className="text-sm text-gray-500">{options.scale?.toFixed(2)}x</span>
          </div>
          <Slider
            id="scale"
            defaultValue={[options.scale || 1]}
            max={3}
            min={0.5}
            step={0.01}
            onValueChange={handleScaleChange}
          />
        </div>
        
        <Button 
          onClick={onSave} 
          className="w-full mt-4 flex items-center justify-center"
        >
          <Download className="mr-2 h-4 w-4" />
          Download STL
        </Button>
      </CardContent>
    </Card>
  );
};

export default CustomizationPanel;
