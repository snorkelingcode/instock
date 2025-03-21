
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Trash2, RefreshCw, ExternalLink } from "lucide-react";

export interface MonitoringItemProps {
  id: string;
  url: string;
  name: string;
  lastChecked?: string;
  status: "in-stock" | "out-of-stock" | "unknown" | "error";
  targetText?: string;
  isActive: boolean;
  onToggleActive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRefresh?: (id: string) => void;
}

const MonitoringItem: React.FC<MonitoringItemProps> = ({
  id,
  url,
  name,
  lastChecked,
  status,
  targetText,
  isActive,
  onToggleActive,
  onDelete,
  onRefresh,
}) => {
  // Status badge colors
  const getStatusBadge = () => {
    switch (status) {
      case "in-stock":
        return <Badge className="bg-green-500">In Stock</Badge>;
      case "out-of-stock":
        return <Badge className="bg-red-500">Out of Stock</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full shadow-sm hover:shadow transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{name}</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <span className="truncate max-w-[250px] hover:max-w-none transition-all">
              {url}
            </span>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-1 text-blue-500 hover:text-blue-700"
            >
              <ExternalLink size={14} />
            </a>
          </div>
          
          {targetText && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Target text:</span> "{targetText}"
            </div>
          )}
          
          {lastChecked && (
            <div className="text-xs text-muted-foreground mt-2">
              Last checked: {new Date(lastChecked).toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className={isActive ? "text-green-600" : "text-gray-500"}
          onClick={() => onToggleActive?.(id)}
        >
          {isActive ? <Eye size={16} className="mr-1" /> : <EyeOff size={16} className="mr-1" />}
          {isActive ? "Watching" : "Paused"}
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRefresh?.(id)}
          >
            <RefreshCw size={16} />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete?.(id)}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MonitoringItem;
