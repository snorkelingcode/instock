
import React from 'react';
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MaterialOptionProps {
  value: string;
  onChange: (value: string) => void;
  defaultValue: string;
}

const MaterialOption: React.FC<MaterialOptionProps> = ({ 
  value, 
  onChange,
  defaultValue
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="material">Material</Label>
      <Select 
        value={value || defaultValue || 'plastic'} 
        onValueChange={(value) => onChange(value)}
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
  );
};

export default MaterialOption;
