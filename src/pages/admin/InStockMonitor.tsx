
import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Search, AlertCircle, RotateCw, ClockIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AddMonitorForm from "@/components/admin/AddMonitorForm";
import MonitoringItem from "@/components/admin/MonitoringItem";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchMonitors, 
  addMonitor, 
  toggleMonitorStatus, 
  deleteMonitor, 
  triggerCheck,
  updateCheckFrequency,
  setupMonitorRealtime,
  initializeAutoChecks,
  cleanupAutoChecks,
  MonitoringItem as MonitoringItemType 
} from "@/services/monitorService";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

const InStockMonitor = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [monitoredItems, setMonitoredItems] = useState<MonitoringItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load monitors on component mount
  useEffect(() => {
    if (!user) {
      return;
    }

    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can access this page",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    const loadMonitors = async () => {
      setIsLoading(true);
      const monitors = await fetchMonitors();
      setMonitoredItems(monitors);
      setIsLoading(false);
      
      // Initialize auto-checks after loading monitors
      if (monitors.length > 0 && autoCheckEnabled) {
        initializeAutoChecks();
      }
    };

    loadMonitors();
    
    // Clean up auto-checks on unmount
    return () => {
      cleanupAutoChecks();
    };
  }, [user, isAdmin, navigate, toast, autoCheckEnabled]);

  // Set up realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = setupMonitorRealtime((updatedItem) => {
      console.log("Realtime update received:", updatedItem);
      
      // If the item was refreshing and now has a status other than "unknown", 
      // remove it from the refreshing set and show a toast
      if (refreshingIds.has(updatedItem.id) && updatedItem.status !== "unknown") {
        setRefreshingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(updatedItem.id);
          return newSet;
        });
        
        // Get the previous status to check if it changed
        const previousItem = monitoredItems.find(item => item.id === updatedItem.id);
        const statusChanged = previousItem && previousItem.status !== updatedItem.status;
        
        // Show toast with status
        if (statusChanged || updatedItem.status === "error") {
          const statusMessage = 
            updatedItem.status === "in-stock" ? "Product is in stock!" :
            updatedItem.status === "out-of-stock" ? "Product is out of stock" :
            updatedItem.status === "error" ? "Error checking product" : "Status unknown";
          
          toast({
            title: `Status Update: ${updatedItem.name}`,
            description: statusMessage,
            variant: updatedItem.status === "in-stock" ? "default" : 
                    updatedItem.status === "error" ? "destructive" : "default",
          });
        }
      }
      
      setMonitoredItems(current => 
        current.map(item => 
          item.id === updatedItem.id ? updatedItem : item
        )
      );
    });

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [user, toast, refreshingIds, monitoredItems]);

  const handleAddMonitor = async (values: { name: string; url: string; targetText?: string; frequency?: number }) => {
    const frequency = values.frequency || 30; // Default to 30 minutes if not specified
    const newItem = await addMonitor(values.name, values.url, values.targetText, frequency);
    
    if (newItem) {
      setMonitoredItems(prev => [newItem, ...prev]);
      toast({
        title: "Monitor Added",
        description: `Now monitoring ${newItem.name} every ${frequency} minutes`,
      });
    }
  };

  const handleToggleActive = async (id: string) => {
    const itemIndex = monitoredItems.findIndex(item => item.id === id);
    if (itemIndex === -1) return;

    const item = monitoredItems[itemIndex];
    const success = await toggleMonitorStatus(id, !item.is_active);
    
    if (success) {
      setMonitoredItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, is_active: !item.is_active } : item
        )
      );
      
      toast({
        title: item.is_active ? "Monitoring Paused" : "Monitoring Resumed",
        description: `${item.name} is now ${item.is_active ? "paused" : "active"}`,
      });
      
      // If activating, trigger immediate check
      if (!item.is_active) {
        handleRefresh(id);
      }
    }
  };

  const handleUpdateFrequency = async (id: string, frequency: number) => {
    const item = monitoredItems.find(item => item.id === id);
    if (!item) return;
    
    const success = await updateCheckFrequency(id, frequency);
    
    if (success) {
      setMonitoredItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, check_frequency: frequency } : item
        )
      );
      
      toast({
        title: "Check Frequency Updated",
        description: `${item.name} will now be checked every ${frequency} minutes`,
      });
    }
  };

  const handleDelete = async (id: string) => {
    const item = monitoredItems.find(item => item.id === id);
    if (!item) return;
    
    const success = await deleteMonitor(id);
    if (success) {
      setMonitoredItems(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "Monitor Deleted",
        description: `${item.name} has been removed`,
      });
    }
  };

  const handleRefresh = async (id: string) => {
    // Don't allow refreshing if it's already in progress
    if (refreshingIds.has(id)) {
      return;
    }
    
    const item = monitoredItems.find(item => item.id === id);
    if (!item) return;

    // Add to refreshing set
    setRefreshingIds(prev => new Set(prev).add(id));
    
    // Show loading state in UI
    setMonitoredItems(prev => 
      prev.map(i => 
        i.id === id ? { ...i, status: 'unknown' } : i
      )
    );

    // Trigger the check
    await triggerCheck(id);
  };

  const handleRefreshAll = async () => {
    const activeItems = monitoredItems.filter(item => item.is_active);
    
    if (activeItems.length === 0) {
      toast({
        title: "No Active Monitors",
        description: "There are no active monitors to refresh",
      });
      return;
    }
    
    toast({
      title: "Refreshing Monitors",
      description: `Checking ${activeItems.length} active monitors...`,
    });

    // Add all to refreshing set
    const newRefreshingIds = new Set(refreshingIds);
    activeItems.forEach(item => newRefreshingIds.add(item.id));
    setRefreshingIds(newRefreshingIds);
    
    // Update UI to show all as refreshing
    setMonitoredItems(prev => 
      prev.map(item => 
        activeItems.some(active => active.id === item.id) 
          ? { ...item, status: 'unknown' } 
          : item
      )
    );

    // Process in batches of 3 to avoid rate limiting
    const batchSize = 3;
    for (let i = 0; i < activeItems.length; i += batchSize) {
      const batch = activeItems.slice(i, i + batchSize);
      await Promise.all(
        batch.map(item => triggerCheck(item.id))
      );
      
      // Add a delay between batches
      if (i + batchSize < activeItems.length) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  };

  const filteredItems = monitoredItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.url.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const activeItems = filteredItems.filter((item) => item.is_active);
  const inactiveItems = filteredItems.filter((item) => !item.is_active);

  const toggleAutoCheck = () => {
    setAutoCheckEnabled(!autoCheckEnabled);
    
    if (!autoCheckEnabled) {
      // Re-enable auto checks
      initializeAutoChecks();
      toast({
        title: "Auto-Check Enabled",
        description: "Monitors will be checked automatically based on their schedules",
      });
    } else {
      // Disable auto checks
      cleanupAutoChecks();
      toast({
        title: "Auto-Check Disabled",
        description: "Automatic checking has been disabled. You'll need to check manually.",
      });
    }
  };

  if (!user || !isAdmin) {
    return (
      <Layout>
        <div className="container max-w-6xl py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You must be an admin to access this page.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-6xl py-8">
        <h1 className="text-3xl font-bold mb-2">In-Stock Monitor</h1>
        <p className="text-gray-600 mb-8">
          Monitor product pages for stock availability changes using Scraper API
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add new monitoring URL form */}
          <div className="lg:col-span-1">
            <AddMonitorForm onSubmit={handleAddMonitor} />
            
            <div className="mt-6 p-4 bg-white rounded-lg border shadow-sm">
              <h3 className="text-lg font-medium mb-3">Monitoring Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Automatic Checking</h4>
                    <p className="text-sm text-gray-500">
                      Automatically check monitors based on their schedules
                    </p>
                  </div>
                  <Button 
                    variant={autoCheckEnabled ? "default" : "outline"}
                    onClick={toggleAutoCheck}
                    className="gap-2"
                  >
                    <ClockIcon size={16} />
                    {autoCheckEnabled ? "Enabled" : "Disabled"}
                  </Button>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">How It Works</h4>
                  <ul className="text-sm space-y-2 text-gray-700">
                    <li>• Using Scraper API to bypass site protections</li>
                    <li>• Each monitor has its own check frequency</li>
                    <li>• Out-of-stock items are checked more frequently</li>
                    <li>• In-stock items are checked less frequently</li>
                    <li>• Error retries use exponential backoff</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Monitoring list */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Monitored URLs</h2>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRefreshAll}
                    disabled={isLoading || activeItems.length === 0}
                  >
                    <RotateCw className={`h-4 w-4 mr-2 ${refreshingIds.size > 0 ? 'animate-spin' : ''}`} />
                    Refresh All
                  </Button>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <Tabs defaultValue="active" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="active">
                      Active ({activeItems.length})
                    </TabsTrigger>
                    <TabsTrigger value="inactive">
                      Paused ({inactiveItems.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="active">
                    {activeItems.length === 0 ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No active monitors</AlertTitle>
                        <AlertDescription>
                          Add a URL to start monitoring for in-stock status
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="grid gap-4 grid-cols-1">
                        {activeItems.map((item) => (
                          <MonitoringItem
                            key={item.id}
                            {...item}
                            onToggleActive={handleToggleActive}
                            onDelete={handleDelete}
                            onRefresh={handleRefresh}
                            onUpdateFrequency={handleUpdateFrequency}
                            isRefreshing={refreshingIds.has(item.id)}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="inactive">
                    {inactiveItems.length === 0 ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No paused monitors</AlertTitle>
                        <AlertDescription>
                          You don't have any paused monitors
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="grid gap-4 grid-cols-1">
                        {inactiveItems.map((item) => (
                          <MonitoringItem
                            key={item.id}
                            {...item}
                            onToggleActive={handleToggleActive}
                            onDelete={handleDelete}
                            onRefresh={handleRefresh}
                            onUpdateFrequency={handleUpdateFrequency}
                            isRefreshing={refreshingIds.has(item.id)}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InStockMonitor;
