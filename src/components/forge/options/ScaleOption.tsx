
import React from 'react';
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface ScaleOptionProps {
  value: number;
  onChange: (value: number) => void;
  defaultValue: number;
}

const ScaleOption: React.FC<ScaleOptionProps> = ({ 
  value, 
  onChange,
  defaultValue
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label htmlFor="scale">Scale</Label>
        <span className="text-sm font-mono">{(value || defaultValue || 1).toFixed(1)}</span>
      </div>
      <Slider
        id="scale"
        defaultValue={[value || defaultValue || 1]}
        min={0.5}
        max={2}
        step={0.1}
        onValueChange={(values) => onChange(values[0])}
      />
    </div>
  );
};

export default ScaleOption;
