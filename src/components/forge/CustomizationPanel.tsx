
import React, { useState, useEffect } from 'react';
import { ThreeDModel } from '@/types/model';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from '@/hooks/use-mobile';
import { Switch } from "@/components/ui/switch";
import { AlertCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [showPerformanceSettings, setShowPerformanceSettings] = useState(isMobile);
  
  useEffect(() => {
    // Set performance mode by default on mobile
    if (isMobile && options.performanceMode === undefined) {
      onChange('performanceMode', true);
    }
    
    // Set lower detail level by default on mobile
    if (isMobile && options.detailLevel === undefined) {
      onChange('detailLevel', 0);
    }
  }, [isMobile, options, onChange]);
  
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

  const handlePerformanceModeChange = (checked: boolean) => {
    onChange('performanceMode', checked);
  };

  const handleDetailLevelChange = (value: number[]) => {
    onChange('detailLevel', value[0]);
  };
  
  return (
    <Card className="h-full border-0 rounded-none lg:border lg:rounded-lg">
      <CardHeader className={isMobile ? "px-4 py-3" : "px-6 py-4"}>
        <CardTitle className={isMobile ? "text-lg" : "text-xl"}>
          Customize {model?.name || 'Model'}
        </CardTitle>
      </CardHeader>
      <CardContent className={`space-y-4 ${isMobile ? "px-4 pb-4" : "px-6 pb-6"}`}>
        <Collapsible open={showPerformanceSettings} onOpenChange={setShowPerformanceSettings}>
          <CollapsibleTrigger className="flex w-full items-center justify-between p-2 bg-amber-50 rounded-md border border-amber-200">
            <div className="flex items-center">
              <AlertCircle size={16} className="mr-2 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Performance Settings</span>
            </div>
            <span className="text-xs text-amber-600">
              {showPerformanceSettings ? "Hide" : "Show"}
            </span>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-3 pb-1 px-2 mt-2 bg-gray-50 rounded-md">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="performance-mode" className="text-sm">
                  Low Performance Mode
                </Label>
                <Switch
                  id="performance-mode"
                  checked={options.performanceMode || false}
                  onCheckedChange={handlePerformanceModeChange}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="detail-level" className="text-sm">Detail Level</Label>
                  <span className="text-xs text-gray-500">
                    {options.detailLevel !== undefined ? 
                      options.detailLevel === 0 ? "Low" : 
                      options.detailLevel === 0.5 ? "Medium" : "High" 
                      : "Medium"}
                  </span>
                </div>
                <Slider
                  id="detail-level"
                  defaultValue={[options.detailLevel !== undefined ? options.detailLevel : 0.5]}
                  max={1}
                  min={0}
                  step={0.5}
                  onValueChange={handleDetailLevelChange}
                />
              </div>
              
              <p className="text-xs text-gray-500 italic">
                Lower settings improve performance but reduce model quality.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
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
              {modelTypes.map((type) => (
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
          className="w-full mt-4"
          disabled={!isAuthenticated}
        >
          {isAuthenticated ? "Save Customization" : "Sign In to Save"}
        </Button>
        
        {!isAuthenticated && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            You must be signed in to save your customizations
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomizationPanel;
