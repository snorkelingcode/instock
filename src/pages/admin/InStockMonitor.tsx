
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import MonitoringItem from "@/components/admin/MonitoringItem";
import AddMonitorForm from "@/components/admin/AddMonitorForm";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDownAZ, ArrowUpZA, Filter, Info, Plus, RefreshCw, SearchIcon, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { 
  checkUrlWithBrightData, 
  toggleMonitorActive, 
  updateCheckFrequency, 
  deleteStockMonitor,
  fetchMonitors 
} from "@/services/stockMonitorService";

const InStockMonitor = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [monitors, setMonitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [monitorToDelete, setMonitorToDelete] = useState<string | null>(null);
  const [refreshingIds, setRefreshingIds] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortField, setSortField] = useState<string>('last_checked');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Fetch monitors from the database
  const loadMonitors = async () => {
    try {
      setLoading(true);
      const data = await fetchMonitors();
      setMonitors(data || []);
    } catch (error) {
      console.error('Error fetching monitors:', error);
      toast({
        title: "Error",
        description: "Failed to load monitors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadMonitors();
    }
  }, [isAdmin]);

  // Function to handle refreshing a monitor
  const handleRefresh = async (id: string) => {
    try {
      // Find the monitor
      const monitor = monitors.find(m => m.id === id);
      if (!monitor) {
        throw new Error('Monitor not found');
      }

      // Add to refreshing list
      setRefreshingIds(prev => [...prev, id]);

      // Call the API to check the URL
      console.log(`Refreshing monitor: ${id} - ${monitor.url}`);
      await checkUrlWithBrightData(id, monitor.url, monitor.name);
      
      // Show success toast
      toast({
        title: "Check Initiated",
        description: "Stock check has been started. Results will update shortly.",
      });
      
      // Refresh monitors list after a delay to allow for processing
      setTimeout(() => {
        loadMonitors();
      }, 3000);
    } catch (error: any) {
      console.error('Error refreshing monitor:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to check URL. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Remove from refreshing list after a delay
      setTimeout(() => {
        setRefreshingIds(prev => prev.filter(item => item !== id));
      }, 3000);
    }
  };

  // Function to handle deleting a monitor
  const handleDelete = async () => {
    if (!monitorToDelete) return;
    
    try {
      await deleteStockMonitor(monitorToDelete);
      
      toast({
        title: "Monitor Deleted",
        description: "The stock monitor has been deleted successfully.",
      });
      
      // Close dialog and clear selected monitor
      setOpenDeleteDialog(false);
      setMonitorToDelete(null);
      
      // Refresh the monitors list
      loadMonitors();
    } catch (error) {
      console.error('Error deleting monitor:', error);
      toast({
        title: "Error",
        description: "Failed to delete monitor. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to toggle active state
  const handleToggleActive = async (id: string) => {
    try {
      const newState = await toggleMonitorActive(id);
      
      // Update the local state to reflect the change
      setMonitors(prev => 
        prev.map(monitor => 
          monitor.id === id ? { ...monitor, is_active: newState } : monitor
        )
      );
      
      toast({
        title: newState ? "Monitor Activated" : "Monitor Paused",
        description: `The stock monitor is now ${newState ? 'active' : 'paused'}.`,
      });
    } catch (error) {
      console.error('Error toggling monitor state:', error);
      toast({
        title: "Error",
        description: "Failed to update monitor status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to update frequency
  const handleUpdateFrequency = async (id: string, frequency: number) => {
    try {
      await updateCheckFrequency(id, frequency);
      
      // Update the local state to reflect the change
      setMonitors(prev => 
        prev.map(monitor => 
          monitor.id === id ? { ...monitor, check_frequency: frequency } : monitor
        )
      );
      
      toast({
        title: "Frequency Updated",
        description: `Check frequency updated to ${frequency} minutes.`,
      });
    } catch (error) {
      console.error('Error updating frequency:', error);
      toast({
        title: "Error",
        description: "Failed to update check frequency. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter monitors based on search query and filters
  const filteredMonitors = monitors.filter(monitor => {
    // Apply search filter
    const matchesSearch = 
      monitor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      monitor.url?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply status filter
    const matchesStatus = 
      statusFilter === 'all' || 
      monitor.status === statusFilter;
    
    // Apply active filter
    const matchesActive = 
      activeFilter === 'all' || 
      (activeFilter === 'active' && monitor.is_active) || 
      (activeFilter === 'paused' && !monitor.is_active);
    
    return matchesSearch && matchesStatus && matchesActive;
  });

  // Sort monitors based on sort field and order
  const sortedMonitors = [...filteredMonitors].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];
    
    // Handle null values
    if (valueA === null) valueA = '';
    if (valueB === null) valueB = '';
    
    // For date fields, convert to Date objects
    if (sortField.includes('date') || sortField.includes('checked') || sortField.includes('created_at')) {
      valueA = valueA ? new Date(valueA).getTime() : 0;
      valueB = valueB ? new Date(valueB).getTime() : 0;
    }
    
    // For string fields, convert to lowercase
    if (typeof valueA === 'string') valueA = valueA.toLowerCase();
    if (typeof valueB === 'string') valueB = valueB.toLowerCase();
    
    // Return comparison result
    if (sortOrder === 'asc') {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else {
      return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
    }
  });

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <Layout>
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need admin privileges to access this page.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Stock Monitoring</h1>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1"
          >
            {showAddForm ? 'Hide Form' : (
              <>
                <Plus size={16} />
                Add Monitor
              </>
            )}
          </Button>
        </div>

        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Using Bright Data Target API</AlertTitle>
          <AlertDescription className="text-blue-700">
            This system uses Bright Data's Target API to reliably check product availability. 
            Each check costs approximately $0.0015. Adjust the frequency to balance cost and 
            timely notifications.
          </AlertDescription>
        </Alert>

        {showAddForm && (
          <AddMonitorForm
            onSuccess={() => {
              loadMonitors();
              setShowAddForm(false);
            }}
          />
        )}
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Filters & Search</CardTitle>
            <CardDescription>
              Narrow down your monitors by different criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Search</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or URL..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Status Filter</label>
                <Select 
                  value={statusFilter} 
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Monitor Status</label>
                <ToggleGroup 
                  type="single" 
                  value={activeFilter}
                  onValueChange={(value) => value && setActiveFilter(value)}
                  className="justify-start"
                >
                  <ToggleGroupItem value="all" aria-label="All">
                    All
                  </ToggleGroupItem>
                  <ToggleGroupItem value="active" aria-label="Active">
                    Active
                  </ToggleGroupItem>
                  <ToggleGroupItem value="paused" aria-label="Paused">
                    Paused
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Sort by:</label>
                <Select 
                  value={sortField} 
                  onValueChange={setSortField}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="last_checked">Last Checked</SelectItem>
                    <SelectItem value="created_at">Created At</SelectItem>
                    <SelectItem value="check_frequency">Check Frequency</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? 
                    <ArrowUpZA className="h-4 w-4" /> : 
                    <ArrowDownAZ className="h-4 w-4" />
                  }
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {filteredMonitors.length} monitors
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadMonitors}
                  className="flex items-center gap-1"
                >
                  <RefreshCw size={14} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <p>Loading monitors...</p>
          ) : sortedMonitors.length > 0 ? (
            sortedMonitors.map(monitor => (
              <MonitoringItem
                key={monitor.id}
                id={monitor.id}
                url={monitor.url}
                name={monitor.name}
                last_checked={monitor.last_checked}
                status={monitor.status || 'unknown'}
                target_text={monitor.target_text}
                is_active={monitor.is_active}
                error_message={monitor.error_message}
                stock_status_reason={monitor.stock_status_reason}
                check_frequency={monitor.check_frequency}
                last_status_change={monitor.last_status_change}
                last_seen_in_stock={monitor.last_seen_in_stock}
                consecutive_errors={monitor.consecutive_errors}
                isRefreshing={refreshingIds.includes(monitor.id)}
                onToggleActive={handleToggleActive}
                onDelete={(id) => {
                  setMonitorToDelete(id);
                  setOpenDeleteDialog(true);
                }}
                onRefresh={handleRefresh}
                onUpdateFrequency={handleUpdateFrequency}
              />
            ))
          ) : (
            <div className="col-span-2 text-center py-10">
              <p className="text-gray-500 mb-4">No stock monitors found</p>
              <Button onClick={() => setShowAddForm(true)}>
                Add Your First Monitor
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this stock monitor? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default InStockMonitor;
