
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ColorOptionProps {
  value: string;
  onChange: (value: string) => void;
  defaultValue: string;
}

const ColorOption: React.FC<ColorOptionProps> = ({ 
  value, 
  onChange,
  defaultValue
}) => {
  const colorOptions = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
  
  return (
    <div className="space-y-2">
      <Label htmlFor="color">Color</Label>
      <div className="grid grid-cols-5 gap-2">
        {colorOptions.map((colorOption) => (
          <div 
            key={colorOption}
            className={`w-full aspect-square rounded-full cursor-pointer border-2 ${
              value === colorOption ? 'border-white ring-2 ring-red-500' : 'border-gray-300'
            }`}
            style={{ backgroundColor: colorOption }}
            onClick={() => onChange(colorOption)}
          />
        ))}
      </div>
      <Input
        id="color"
        type="color"
        value={value || defaultValue || '#ffffff'}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 mt-2"
      />
    </div>
  );
};

export default ColorOption;
