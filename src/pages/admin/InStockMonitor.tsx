
import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Search, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AddMonitorForm from "@/components/admin/AddMonitorForm";
import MonitoringItem, { MonitoringItemProps } from "@/components/admin/MonitoringItem";

const InStockMonitor = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [monitoredItems, setMonitoredItems] = useState<MonitoringItemProps[]>([
    // Sample data for UI demonstration
    {
      id: "1",
      name: "Pokemon Scarlet & Violet Booster Box",
      url: "https://example.com/pokemon-sv",
      lastChecked: new Date().toISOString(),
      status: "in-stock",
      targetText: "Add to Cart",
      isActive: true,
    },
    {
      id: "2",
      name: "MTG Lord of the Rings Collectors Edition",
      url: "https://example.com/mtg-lotr",
      lastChecked: new Date().toISOString(),
      status: "out-of-stock",
      targetText: "In Stock",
      isActive: true,
    },
    {
      id: "3",
      name: "Pokemon TCG Violet Elite Trainer Box",
      url: "https://example.com/pokemon-violet-etb",
      lastChecked: new Date().toISOString(),
      status: "unknown",
      isActive: false,
    },
  ]);

  const handleAddMonitor = (values: { name: string; url: string; targetText?: string }) => {
    const newItem: MonitoringItemProps = {
      id: crypto.randomUUID(),
      name: values.name,
      url: values.url,
      targetText: values.targetText || undefined,
      status: "unknown",
      lastChecked: new Date().toISOString(),
      isActive: true,
    };
    
    setMonitoredItems([newItem, ...monitoredItems]);
  };

  const handleToggleActive = (id: string) => {
    setMonitoredItems(
      monitoredItems.map((item) =>
        item.id === id ? { ...item, isActive: !item.isActive } : item
      )
    );
  };

  const handleDelete = (id: string) => {
    setMonitoredItems(monitoredItems.filter((item) => item.id !== id));
  };

  const handleRefresh = (id: string) => {
    // This would trigger a refresh of the URL in a real implementation
    console.log(`Refreshing item ${id}`);
    
    // For demo, we'll just update the lastChecked timestamp
    setMonitoredItems(
      monitoredItems.map((item) =>
        item.id === id ? { ...item, lastChecked: new Date().toISOString() } : item
      )
    );
  };

  const filteredItems = monitoredItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.url.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const activeItems = filteredItems.filter((item) => item.isActive);
  const inactiveItems = filteredItems.filter((item) => !item.isActive);

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
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InStockMonitor;
