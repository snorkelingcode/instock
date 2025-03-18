
import React from 'react';
import { Button } from "@/components/ui/button";
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  label,
  onClick,
  icon: Icon,
  variant = "default",
  className = ""
}) => {
  return (
    <Button 
      className={`w-full gap-2 ${className}`} 
      onClick={onClick}
      variant={variant}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </Button>
  );
};

export default ActionButton;
