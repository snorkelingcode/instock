
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TextOptionProps {
  value: string;
  onChange: (value: string) => void;
  defaultValue: string;
}

const TextOption: React.FC<TextOptionProps> = ({ 
  value, 
  onChange,
  defaultValue
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="text">Custom Text</Label>
      <Input
        id="text"
        value={value || defaultValue || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter custom text"
        maxLength={20}
      />
    </div>
  );
};

export default TextOption;
