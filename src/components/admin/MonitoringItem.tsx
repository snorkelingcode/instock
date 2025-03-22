
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Trash2, RefreshCw, ExternalLink, AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, formatDistanceToNow } from "date-fns";

export interface MonitoringItemProps {
  id: string;
  url: string;
  name: string;
  last_checked?: string | null;
  status: "in-stock" | "out-of-stock" | "unknown" | "error";
  target_text?: string;
  is_active: boolean;
  error_message?: string;
  isRefreshing?: boolean;
  onToggleActive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRefresh?: (id: string) => void;
}

const MonitoringItem: React.FC<MonitoringItemProps> = ({
  id,
  url,
  name,
  last_checked,
  status,
  target_text,
  is_active,
  error_message,
  isRefreshing = false,
  onToggleActive,
  onDelete,
  onRefresh,
}) => {
  // Status badge colors
  const getStatusBadge = () => {
    switch (status) {
      case "in-stock":
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle2 size={12} />
            In Stock
          </Badge>
        );
      case "out-of-stock":
        return (
          <Badge className="bg-red-500 flex items-center gap-1">
            <XCircle size={12} />
            Out of Stock
          </Badge>
        );
      case "error":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="cursor-help flex items-center gap-1">
                  <AlertCircle size={12} />
                  Error
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-[350px] p-4">
                <p className="font-semibold mb-1">Error Details:</p>
                <p className="text-sm whitespace-pre-wrap">{error_message || "An error occurred during the last check"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            {isRefreshing ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                Checking...
              </>
            ) : (
              <>Unknown</>
            )}
          </Badge>
        );
    }
  };

  const formatLastChecked = () => {
    if (!last_checked) return "Never";
    
    const date = new Date(last_checked);
    const timeAgo = formatDistanceToNow(date, { addSuffix: true });
    const exactTime = format(date, "MMM d, yyyy h:mm a");
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center text-xs text-muted-foreground cursor-help">
              <Clock size={12} className="mr-1" />
              {timeAgo}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{exactTime}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card className={`w-full shadow-sm hover:shadow transition-shadow ${status === "in-stock" ? "border-green-500" : ""}`}>
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
              aria-label="Open URL in new tab"
            >
              <ExternalLink size={14} />
            </a>
          </div>
          
          {target_text && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Target text:</span> "{target_text}"
            </div>
          )}
          
          {status === "error" && error_message && (
            <div className="text-xs text-red-500 mt-1 truncate hover:text-clip hover:whitespace-normal">
              <AlertCircle size={12} className="inline mr-1" />
              {error_message}
            </div>
          )}
          
          {formatLastChecked()}
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className={is_active ? "text-green-600" : "text-gray-500"}
          onClick={() => onToggleActive?.(id)}
        >
          {is_active ? <Eye size={16} className="mr-1" /> : <EyeOff size={16} className="mr-1" />}
          {is_active ? "Watching" : "Paused"}
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRefresh?.(id)}
            disabled={isRefreshing}
            className={isRefreshing ? "opacity-50 cursor-not-allowed" : ""}
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
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
