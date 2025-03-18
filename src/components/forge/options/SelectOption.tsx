
import React from 'react';
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectOptionProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{value: string, label: string}>;
  defaultValue: string;
}

const SelectOption: React.FC<SelectOptionProps> = ({ 
  id,
  label,
  value,
  onChange,
  options,
  defaultValue
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select 
        value={value || defaultValue} 
        onValueChange={onChange}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SelectOption;
