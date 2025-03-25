
import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  PlusCircle, Search, Info, RefreshCw, AlertCircle, ShoppingCart, Tag
} from "lucide-react";
import AddMonitorForm from "@/components/admin/AddMonitorForm";
import MonitoringItem from "@/components/admin/MonitoringItem";
import { 
  fetchMonitors, 
  addMonitor, 
  toggleMonitorStatus, 
  deleteMonitor,
  triggerCheck,
  updateCheckFrequency,
  initializeAutoChecks,
  cleanupAutoChecks,
  setupMonitorRealtime
} from "@/services/monitorService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define an interface for the monitoring items for type safety
interface MonitoringItem {
  id: string;
  name: string;
  url: string;
  target_text?: string;
  status: "in-stock" | "out-of-stock" | "unknown" | "error" | "checking" | "pending";
  last_checked?: string | null;
  is_active: boolean;
  error_message?: string;
  stock_status_reason?: string;
  check_frequency?: number;
  last_status_change?: string | null;
  last_seen_in_stock?: string | null;
  consecutive_errors?: number;
}

const InStockMonitor: React.FC = () => {
  const [monitors, setMonitors] = useState<MonitoringItem[]>([]);
  const [filteredMonitors, setFilteredMonitors] = useState<MonitoringItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshingIds, setRefreshingIds] = useState<string[]>([]);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load monitors on initial render
    loadMonitors();
    
    // Initialize auto-checks
    const cleanup = initializeAutoChecks();
    
    // Set up realtime subscription
    const channel = setupMonitorRealtime(handleRealtimeUpdate);
    
    // Clean up
    return () => {
      cleanup();
      cleanupAutoChecks();
      channel.unsubscribe();
    };
  }, []);
  
  // Handle realtime updates
  const handleRealtimeUpdate = (updatedItem: MonitoringItem) => {
    setMonitors(prev => {
      const newMonitors = [...prev];
      const index = newMonitors.findIndex(item => item.id === updatedItem.id);
      if (index !== -1) {
        newMonitors[index] = updatedItem;
      }
      return newMonitors;
    });
    
    // Remove item from refreshing state if it was being refreshed
    setRefreshingIds(prev => prev.filter(id => id !== updatedItem.id));
  };

  useEffect(() => {
    // Filter and sort monitors based on search query and active tab
    filterMonitors();
  }, [monitors, searchQuery, activeTab]);

  const loadMonitors = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMonitors();
      setMonitors(data);
    } catch (error) {
      console.error("Error loading monitors:", error);
      toast({
        title: "Error",
        description: "Failed to load monitors",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterMonitors = () => {
    let filtered = [...monitors];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        monitor => 
          monitor.name.toLowerCase().includes(query) || 
          monitor.url.toLowerCase().includes(query)
      );
    }
    
    // Apply tab filter
    switch (activeTab) {
      case "in-stock":
        filtered = filtered.filter(monitor => monitor.status === "in-stock");
        break;
      case "out-of-stock":
        filtered = filtered.filter(monitor => monitor.status === "out-of-stock");
        break;
      case "errors":
        filtered = filtered.filter(monitor => monitor.status === "error");
        break;
      case "active":
        filtered = filtered.filter(monitor => monitor.is_active);
        break;
      case "inactive":
        filtered = filtered.filter(monitor => !monitor.is_active);
        break;
      case "pending":
        filtered = filtered.filter(monitor => 
          monitor.status === "checking" || monitor.status === "pending");
        break;
      // "all" tab shows everything
    }
    
    setFilteredMonitors(filtered);
  };

  const handleAddMonitor = async (name: string, url: string, targetText?: string, frequency?: number) => {
    try {
      const newMonitor = await addMonitor(name, url, targetText, frequency);
      if (newMonitor) {
        setMonitors(prev => [newMonitor, ...prev]);
        toast({
          title: "Monitor Added",
          description: `"${name}" has been added successfully`,
        });
        setIsAddFormOpen(false);
      }
    } catch (error) {
      console.error("Error adding monitor:", error);
      toast({
        title: "Error",
        description: "Failed to add monitor",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string) => {
    const monitor = monitors.find(m => m.id === id);
    if (!monitor) return;
    
    try {
      const success = await toggleMonitorStatus(id, !monitor.is_active);
      if (success) {
        setMonitors(prev => 
          prev.map(m => m.id === id ? { ...m, is_active: !m.is_active } : m)
        );
        toast({
          title: monitor.is_active ? "Monitoring Paused" : "Monitoring Activated",
          description: `"${monitor.name}" is now ${monitor.is_active ? "paused" : "active"}`,
        });
      }
    } catch (error) {
      console.error("Error toggling monitor status:", error);
      toast({
        title: "Error",
        description: "Failed to toggle monitor status",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async (id: string) => {
    setRefreshingIds(prev => [...prev, id]);
    try {
      const success = await triggerCheck(id);
      if (success) {
        const monitor = monitors.find(m => m.id === id);
        toast({
          title: "Check Initiated",
          description: `Check for "${monitor?.name}" has been initiated`,
        });
      } else {
        setRefreshingIds(prev => prev.filter(itemId => itemId !== id));
        toast({
          title: "Check Failed",
          description: "Failed to initiate check, please try again later",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error refreshing monitor:", error);
      setRefreshingIds(prev => prev.filter(itemId => itemId !== id));
      toast({
        title: "Error",
        description: "Failed to refresh monitor",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteConfirmItem(id);
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteMonitor(id);
      if (success) {
        const monitor = monitors.find(m => m.id === id);
        setMonitors(prev => prev.filter(m => m.id !== id));
        toast({
          title: "Monitor Deleted",
          description: `"${monitor?.name}" has been deleted`,
        });
      }
    } catch (error) {
      console.error("Error deleting monitor:", error);
      toast({
        title: "Error",
        description: "Failed to delete monitor",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmItem(null);
    }
  };
  
  const handleUpdateFrequency = async (id: string, frequency: number) => {
    try {
      const success = await updateCheckFrequency(id, frequency);
      if (success) {
        setMonitors(prev => 
          prev.map(m => m.id === id ? { ...m, check_frequency: frequency } : m)
        );
        toast({
          title: "Frequency Updated",
          description: `Check frequency updated to every ${frequency} minutes`,
        });
      }
    } catch (error) {
      console.error("Error updating frequency:", error);
      toast({
        title: "Error",
        description: "Failed to update check frequency",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">In-Stock Monitor</h1>
            <p className="text-muted-foreground">
              Track product availability across multiple retailers
            </p>
          </div>
          <Button 
            onClick={() => setIsAddFormOpen(true)}
            className="flex items-center"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Monitor
          </Button>
        </div>
        
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Cost-Effective Monitoring</AlertTitle>
          <AlertDescription className="text-blue-700">
            We're now using the Bright Data Target API which costs only $0.0015 per check (vs $1.50 for Web Unlocker).
            This system allows for efficient batch processing of product URLs with much higher reliability and accuracy.
          </AlertDescription>
        </Alert>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Monitors</h2>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search monitors..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="in-stock">In Stock</TabsTrigger>
              <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Paused</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-muted-foreground" />
                  <p>Loading monitors...</p>
                </div>
              ) : filteredMonitors.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No monitors found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 
                      "No monitors match your search criteria" : 
                      "Add a monitor to start tracking product availability"}
                  </p>
                  {!isAddFormOpen && (
                    <Button onClick={() => setIsAddFormOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Monitor
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredMonitors.map((monitor) => (
                    <MonitoringItem
                      key={monitor.id}
                      id={monitor.id}
                      name={monitor.name}
                      url={monitor.url}
                      target_text={monitor.target_text}
                      status={monitor.status}
                      last_checked={monitor.last_checked}
                      is_active={monitor.is_active}
                      error_message={monitor.error_message}
                      stock_status_reason={monitor.stock_status_reason}
                      isRefreshing={refreshingIds.includes(monitor.id)}
                      check_frequency={monitor.check_frequency}
                      last_status_change={monitor.last_status_change}
                      last_seen_in_stock={monitor.last_seen_in_stock}
                      consecutive_errors={monitor.consecutive_errors}
                      onToggleActive={handleToggleActive}
                      onDelete={confirmDelete}
                      onRefresh={handleRefresh}
                      onUpdateFrequency={handleUpdateFrequency}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="mr-2 h-5 w-5" />
              How to Use Target Specific Monitoring
            </CardTitle>
            <CardDescription>
              Tips for effectively monitoring stock at Target and other retailers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                Our system now uses Bright Data's Target-specific API, which is specialized for extracting product information from Target.com. It works with other retailers as well, but has enhanced capabilities specifically for Target.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2 text-gray-900">Cost Savings</h3>
                <p className="text-gray-700 mb-2">
                  The new API costs only $0.0015 per check (compared to $1.50 per check with Web Unlocker), allowing for more frequent checks at 1/1000th of the cost.
                </p>
                <p className="text-gray-700">
                  For example, checking 100 products each hour for a day would cost $3.60 with the old approach, but now only costs around $0.0036.
                </p>
              </div>
              
              <h3 className="font-medium">Adding New Monitors</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click "Add Monitor" button</li>
                <li>Enter a descriptive name for the product</li>
                <li>Paste the product URL from Target.com or other retailer</li>
                <li>Set your desired check frequency</li>
                <li>Click "Save" to start monitoring</li>
              </ol>
              
              <div className="bg-amber-50 p-4 rounded-md border border-amber-100">
                <h3 className="font-medium mb-2 flex items-center text-amber-800">
                  <Info className="h-4 w-4 mr-2" />
                  Important Notes
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-amber-700">
                  <li>Initial check may take 30-60 seconds to complete</li>
                  <li>For Target.com URLs, you'll get the most accurate results</li>
                  <li>The system auto-adjusts check frequency based on status</li>
                  <li>Out-of-stock items are checked more frequently</li>
                  <li>In-stock items are checked less frequently to save costs</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <div className="text-sm text-muted-foreground">
              <p>Need help setting up your monitors? Contact support for assistance.</p>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {isAddFormOpen && (
        <AddMonitorForm 
          onSubmit={handleAddMonitor}
          onCancel={() => setIsAddFormOpen(false)}
        />
      )}
      
      <AlertDialog open={deleteConfirmItem !== null} onOpenChange={() => setDeleteConfirmItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this monitor and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmItem && handleDelete(deleteConfirmItem)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default InStockMonitor;
