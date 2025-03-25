
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, EyeOff, Trash2, RefreshCw, ExternalLink, AlertCircle, Clock, 
  CheckCircle2, XCircle, Info, Bell, BellOff, Settings, History
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, formatDistanceToNow } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

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
  check_frequency?: number;
  last_status_change?: string | null;
  last_seen_in_stock?: string | null;
  consecutive_errors?: number;
  onToggleActive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRefresh?: (id: string) => void;
  onUpdateFrequency?: (id: string, frequency: number) => void;
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
  check_frequency = 30, // Default to 30 minutes
  last_status_change,
  last_seen_in_stock,
  consecutive_errors = 0,
  onToggleActive,
  onDelete,
  onRefresh,
  onUpdateFrequency,
}) => {
  const [frequency, setFrequency] = useState(check_frequency);
  
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
                  Error {consecutive_errors > 1 ? `(${consecutive_errors})` : ''}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-[350px] p-4">
                <p className="font-semibold mb-1">Error Details:</p>
                <p className="text-sm whitespace-pre-wrap">{error_message || "An error occurred during the last check"}</p>
                {consecutive_errors > 1 && (
                  <p className="text-sm mt-2 text-red-500">
                    {consecutive_errors} consecutive errors. Automatic checks will be less frequent.
                  </p>
                )}
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
            {is_active && (
              <p className="text-xs mt-1">
                Next check: approximately {getNextCheckTime()}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Format last seen in stock time with more prominence
  const formatLastSeen = () => {
    if (!last_seen_in_stock) {
      return (
        <span className="flex items-center text-xs text-muted-foreground">
          <History size={12} className="mr-1" />
          {status === "in-stock" ? "Currently in stock" : "Never seen in stock"}
        </span>
      );
    }
    
    const date = new Date(last_seen_in_stock);
    const timeAgo = formatDistanceToNow(date, { addSuffix: true });
    const exactTime = format(date, "MMM d, yyyy h:mm a");
    
    // For in-stock items, show "Currently in stock" instead of last seen time
    if (status === "in-stock") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center text-xs text-green-600 font-medium cursor-help">
                <CheckCircle2 size={12} className="mr-1" />
                Currently in stock
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Confirmed in-stock: {exactTime}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    // For out-of-stock items, show last seen time with more emphasis
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center text-xs text-amber-600 font-medium cursor-help">
              <History size={12} className="mr-1" />
              Last in stock: {timeAgo}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Last confirmed in-stock: {exactTime}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Calculate next check time based on status and check frequency
  const getNextCheckTime = () => {
    if (!is_active) return "paused";
    
    let adjustedFrequency = frequency;
    
    // Adjust based on status
    if (status === "in-stock") {
      adjustedFrequency = Math.max(adjustedFrequency, 60); // At least 60 min
    } else if (status === "error") {
      const backoffFactor = Math.min(Math.pow(2, consecutive_errors - 1), 8);
      adjustedFrequency = Math.min(adjustedFrequency * backoffFactor, 240);
    } else if (status === "out-of-stock") {
      adjustedFrequency = Math.min(adjustedFrequency, 15); // More frequent
    }
    
    return `${adjustedFrequency} minutes`;
  };

  // Format error message for display
  const formatErrorMessage = () => {
    if (!error_message) return null;

    // Try to parse if it's a JSON string
    let errorObj;
    try {
      if (error_message.startsWith('{') && error_message.endsWith('}')) {
        errorObj = JSON.parse(error_message);
        return `${errorObj.message || errorObj.error || JSON.stringify(errorObj)}`;
      }
    } catch (e) {
      // Not a valid JSON, use as is
    }

    // Return the raw error message, truncated if too long
    if (error_message.length > 150) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">{error_message.substring(0, 147)}...</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-[350px] p-4 whitespace-pre-wrap">
              {error_message}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return error_message;
  };

  // Get a CSS class based on status
  const getStatusClass = () => {
    switch (status) {
      case "in-stock":
        return "border-green-500 border-2";
      case "error":
        return "border-red-300";
      case "out-of-stock":
        return "border-red-200";
      default:
        return "";
    }
  };

  // Handle saving the new check frequency
  const handleSaveFrequency = () => {
    if (onUpdateFrequency) {
      onUpdateFrequency(id, frequency);
    }
  };
  
  // Format frequency display
  const formatFrequency = (mins: number) => {
    if (mins < 60) {
      return `${mins} minutes`;
    } else {
      const hours = mins / 60;
      return `${hours === 1 ? '1 hour' : `${hours} hours`}`;
    }
  };

  return (
    <Card className={`w-full shadow-sm hover:shadow transition-shadow ${getStatusClass()}`}>
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
            <div className="text-xs text-red-500 mt-1 flex items-start gap-1">
              <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
              <div>{formatErrorMessage()}</div>
            </div>
          )}
          
          {/* Show explanation of status for non-error states */}
          {status !== "error" && error_message && !error_message.includes("Error") && (
            <div className="text-xs text-gray-600 mt-1 flex items-start gap-1">
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              <div>{formatErrorMessage()}</div>
            </div>
          )}
          
          {/* Note about Scraper API */}
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded flex items-start gap-1">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
            <div>Using Scraper API to bypass bot detection and access accurate stock information</div>
          </div>
          
          {/* Make the last seen status more prominent */}
          <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status History</span>
              <div className="flex items-center space-x-3">
                {formatLastChecked()}
                {formatLastSeen()}
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs flex items-center text-muted-foreground">
                    <Clock size={12} className="mr-1" />
                    Check: {formatFrequency(frequency)}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This item is checked automatically every {formatFrequency(frequency)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Check Frequency</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="frequency">Check every:</Label>
                    <span className="text-sm">{formatFrequency(frequency)}</span>
                  </div>
                  <Slider
                    id="frequency"
                    min={5}
                    max={240}
                    step={5}
                    value={[frequency]}
                    onValueChange={(values) => setFrequency(values[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5m</span>
                    <span>1h</span>
                    <span>4h</span>
                  </div>
                </div>
                <Button onClick={handleSaveFrequency} className="w-full">
                  Save
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
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
