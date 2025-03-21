
import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Search, AlertCircle, RotateCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AddMonitorForm from "@/components/admin/AddMonitorForm";
import MonitoringItem, { MonitoringItemProps } from "@/components/admin/MonitoringItem";
import { useAuth } from "@/contexts/AuthContext";
import { addMonitor, getMonitors, toggleMonitorActive, deleteMonitor, refreshMonitor, setupMonitorRealtime } from "@/services/monitorService";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

const InStockMonitor = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [monitoredItems, setMonitoredItems] = useState<MonitoringItemProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      const monitors = await getMonitors();
      setMonitoredItems(monitors);
      setIsLoading(false);
    };

    loadMonitors();
  }, [user, isAdmin, navigate, toast]);

  // Set up realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = setupMonitorRealtime((updatedItem) => {
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
  }, [user]);

  const handleAddMonitor = async (values: { name: string; url: string; targetText?: string }) => {
    const newItem = await addMonitor(values);
    if (newItem) {
      setMonitoredItems(prev => [newItem, ...prev]);
    }
  };

  const handleToggleActive = async (id: string) => {
    const itemIndex = monitoredItems.findIndex(item => item.id === id);
    if (itemIndex === -1) return;

    const item = monitoredItems[itemIndex];
    const success = await toggleMonitorActive(id, item.isActive);
    
    if (success) {
      setMonitoredItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, isActive: !item.isActive } : item
        )
      );
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteMonitor(id);
    if (success) {
      setMonitoredItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRefresh = async (id: string) => {
    const item = monitoredItems.find(item => item.id === id);
    if (!item) return;

    // Show loading state
    setMonitoredItems(prev => 
      prev.map(i => 
        i.id === id ? { ...i, status: 'unknown' } : i
      )
    );

    await refreshMonitor(id, item.url, item.targetText);
  };

  const handleRefreshAll = async () => {
    const activeItems = monitoredItems.filter(item => item.isActive);
    toast({
      title: "Refreshing Monitors",
      description: `Checking ${activeItems.length} active monitors...`,
    });

    // Process in batches of 3 to avoid rate limiting
    const batchSize = 3;
    for (let i = 0; i < activeItems.length; i += batchSize) {
      const batch = activeItems.slice(i, i + batchSize);
      await Promise.all(
        batch.map(item => refreshMonitor(item.id, item.url, item.targetText))
      );
      
      // Add a delay between batches
      if (i + batchSize < activeItems.length) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    toast({
      title: "Refresh Complete",
      description: `Finished checking ${activeItems.length} monitors`,
    });
  };

  const filteredItems = monitoredItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.url.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const activeItems = filteredItems.filter((item) => item.isActive);
  const inactiveItems = filteredItems.filter((item) => !item.isActive);

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
          Monitor product pages for stock availability changes
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add new monitoring URL form */}
          <div className="lg:col-span-1">
            <AddMonitorForm onSubmit={handleAddMonitor} />
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
                    <RotateCw className="h-4 w-4 mr-2" />
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
