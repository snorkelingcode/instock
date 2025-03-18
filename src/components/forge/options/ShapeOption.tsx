
import React from 'react';
import { Label } from "@/components/ui/label";
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from "@/components/ui/toggle-group";
import { Circle, Square, Triangle } from 'lucide-react';

interface ShapeOptionProps {
  value: string;
  onChange: (value: string) => void;
  defaultValue: string;
}

const ShapeOption: React.FC<ShapeOptionProps> = ({ 
  value, 
  onChange,
  defaultValue
}) => {
  return (
    <div className="space-y-2">
      <Label>Shape</Label>
      <ToggleGroup 
        type="single" 
        value={value || defaultValue || 'circle'}
        onValueChange={(value) => {
          if (value) onChange(value);
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
  );
};

export default ShapeOption;
