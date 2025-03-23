
import React, { useState } from "react";
import { formatDistance } from "date-fns";
import { Check, Clock, ExternalLink, RotateCw, AlertCircle, Power, Trash2, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate } from "@/services/monitorService";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ShoppingCart } from "lucide-react";

type MonitorStatus = "in-stock" | "out-of-stock" | "unknown" | "error";
type CheckoutStatus = "pending" | "success" | "failed" | "not-attempted";

interface MonitoringItemProps {
  id: string;
  name: string;
  url: string;
  status: MonitorStatus;
  last_checked: string | null;
  is_active: boolean;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: (id: string) => void;
  onUpdateFrequency: (id: string, frequency: number) => void;
  isRefreshing: boolean;
  error_message?: string;
  check_frequency?: number;
  target_text?: string;
  last_seen_in_stock?: string | null;
  last_status_change?: string | null;
  auto_checkout?: boolean;
  checkout_status?: CheckoutStatus;
}

const MonitoringItem: React.FC<MonitoringItemProps> = ({
  id,
  name,
  url,
  status,
  last_checked,
  is_active,
  onToggleActive,
  onDelete,
  onRefresh,
  onUpdateFrequency,
  isRefreshing,
  error_message,
  check_frequency = 30,
  target_text,
  last_seen_in_stock,
  last_status_change,
  auto_checkout = false,
  checkout_status = "not-attempted"
}) => {
  const [isFrequencyDialogOpen, setIsFrequencyDialogOpen] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState(check_frequency.toString());
  
  const getStatusColor = (status: MonitorStatus): string => {
    switch (status) {
      case "in-stock":
        return "bg-green-500 hover:bg-green-600";
      case "out-of-stock":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "error":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };
  
  const getStatusText = (status: MonitorStatus): string => {
    switch (status) {
      case "in-stock":
        return "In Stock";
      case "out-of-stock":
        return "Out of Stock";
      case "error":
        return "Error";
      default:
        return "Checking...";
    }
  };

  const getCheckoutStatusText = (status: CheckoutStatus): string => {
    switch (status) {
      case "success":
        return "Checkout Successful";
      case "failed":
        return "Checkout Failed";
      case "pending":
        return "Checkout Pending";
      default:
        return "No Checkout Attempted";
    }
  };

  const getCheckoutStatusColor = (status: CheckoutStatus): string => {
    switch (status) {
      case "success":
        return "bg-green-500 hover:bg-green-600";
      case "failed":
        return "bg-red-500 hover:bg-red-600";
      case "pending":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };
  
  const handleFrequencyChange = (value: string) => {
    setSelectedFrequency(value);
  };
  
  const handleFrequencySubmit = () => {
    const frequency = parseInt(selectedFrequency, 10);
    onUpdateFrequency(id, frequency);
    setIsFrequencyDialogOpen(false);
  };
  
  return (
    <Card className={`overflow-hidden transition-all duration-200 ${is_active ? "" : "opacity-70"}`}>
      <CardContent className="p-0">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-lg">{name}</h3>
              <div className="flex items-center space-x-2">
                <Badge className={`${getStatusColor(status)}`}>
                  {getStatusText(status)}
                </Badge>
                
                {auto_checkout && (
                  <Badge className={`gap-1 ${getCheckoutStatusColor(checkout_status)}`}>
                    <ShoppingCart className="h-3 w-3" />
                    <span>Auto-Checkout</span>
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-500 mb-2 truncate">
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center hover:text-blue-500"
              >
                {url.length > 50 ? url.substring(0, 50) + "..." : url}
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
            
            {target_text && (
              <div className="text-xs text-gray-500 mb-2">
                Target text: <span className="font-mono bg-gray-100 px-1 rounded">{target_text}</span>
              </div>
            )}
            
            {status === "error" && error_message && (
              <div className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded">
                <div className="font-semibold flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" /> Error:
                </div>
                <div className="mt-1">{error_message}</div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col justify-between">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-2" />
                Checked: {last_checked ? 
                  formatDistance(new Date(last_checked), new Date(), { addSuffix: true }) : 
                  "Never"}
              </div>
              
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-2" />
                Frequency: Every {check_frequency} minutes
              </div>
              
              {last_seen_in_stock && (
                <div className="flex items-center">
                  <Check className="h-3 w-3 mr-2" />
                  Last in stock: {formatDate(last_seen_in_stock)}
                </div>
              )}
              
              {auto_checkout && (
                <div className="flex items-center">
                  <ShoppingCart className="h-3 w-3 mr-2" />
                  {getCheckoutStatusText(checkout_status)}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onRefresh(id)}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Checking' : 'Check Now'}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onToggleActive(id)}>
                    <Power className="h-4 w-4 mr-2" />
                    {is_active ? "Pause Monitoring" : "Resume Monitoring"}
                  </DropdownMenuItem>
                  
                  <Dialog open={isFrequencyDialogOpen} onOpenChange={setIsFrequencyDialogOpen}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Clock className="h-4 w-4 mr-2" />
                        Change Frequency
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Check Frequency</DialogTitle>
                        <DialogDescription>
                          How often should we check if this item is in stock?
                        </DialogDescription>
                      </DialogHeader>
                      
                      <RadioGroup 
                        className="mt-4" 
                        value={selectedFrequency}
                        onValueChange={handleFrequencyChange}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value="5" id="r1" />
                          <Label htmlFor="r1">Every 5 minutes</Label>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value="15" id="r2" />
                          <Label htmlFor="r2">Every 15 minutes</Label>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value="30" id="r3" />
                          <Label htmlFor="r3">Every 30 minutes</Label>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value="60" id="r4" />
                          <Label htmlFor="r4">Every hour</Label>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value="120" id="r5" />
                          <Label htmlFor="r5">Every 2 hours</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="240" id="r6" />
                          <Label htmlFor="r6">Every 4 hours</Label>
                        </div>
                      </RadioGroup>
                      
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsFrequencyDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleFrequencySubmit}>Save</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-700" 
                    onClick={() => onDelete(id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Monitor
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonitoringItem;
