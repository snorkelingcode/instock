
import React from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SwitchOptionProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  defaultChecked: boolean;
}

const SwitchOption: React.FC<SwitchOptionProps> = ({ 
  id,
  label,
  checked,
  onChange,
  defaultChecked
}) => {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id} className="cursor-pointer">{label}</Label>
      <Switch
        id={id}
        checked={checked || defaultChecked || false}
        onCheckedChange={onChange}
      />
    </div>
  );
};

export default SwitchOption;
