
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface MonitoringItem {
  id: string;
  name: string;
  url: string;
  target_text?: string;
  status: "in-stock" | "out-of-stock" | "unknown" | "error";
  last_checked?: string | null;
  is_active: boolean;
  error_message?: string;
  stock_status_reason?: string;
  check_frequency?: number;
  last_status_change?: string | null;
  last_seen_in_stock?: string | null;
  consecutive_errors?: number;
  user_id?: string;
}

// Cache for preventing duplicate checks
const checkInProgress: Record<string, boolean> = {};
// Cache for remembering next check times
const nextCheckTimes: Record<string, number> = {};
// Interval reference for auto-checks
let autoCheckInterval: number | null = null;

// Function to fetch all monitors
export const fetchMonitors = async (): Promise<MonitoringItem[]> => {
  try {
    const { data, error } = await supabase
      .from("stock_monitors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching monitors:", error);
      return [];
    }

    return data as MonitoringItem[];
  } catch (error) {
    console.error("Error in fetchMonitors:", error);
    return [];
  }
};

// Function to add a new monitor
export const addMonitor = async (
  name: string,
  url: string,
  targetText?: string,
  frequency?: number
): Promise<MonitoringItem | null> => {
  try {
    const { data, error } = await supabase
      .from("stock_monitors")
      .insert({
        name,
        url,
        target_text: targetText,
        status: "unknown",
        is_active: true,
        check_frequency: frequency || 30, // Default to 30 minutes
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding monitor:", error);
      return null;
    }

    // Trigger an immediate check
    triggerCheck(data.id);

    return data as MonitoringItem;
  } catch (error) {
    console.error("Error in addMonitor:", error);
    return null;
  }
};

// Function to toggle monitor active status
export const toggleMonitorStatus = async (
  id: string,
  isActive: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("stock_monitors")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      console.error("Error toggling monitor status:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in toggleMonitorStatus:", error);
    return false;
  }
};

// Function to delete a monitor
export const deleteMonitor = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("stock_monitors")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting monitor:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteMonitor:", error);
    return false;
  }
};

// Function to update check frequency
export const updateCheckFrequency = async (
  id: string,
  frequency: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("stock_monitors")
      .update({ check_frequency: frequency })
      .eq("id", id);

    if (error) {
      console.error("Error updating check frequency:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateCheckFrequency:", error);
    return false;
  }
};

// Function to trigger a stock check
export const triggerCheck = async (id: string): Promise<boolean> => {
  try {
    // Prevent duplicate checks
    if (checkInProgress[id]) {
      console.log(`Check already in progress for monitor ID: ${id}`);
      return false;
    }

    console.log(`Starting check for monitor ID: ${id}`);
    checkInProgress[id] = true;
    console.log(`Set checkInProgress[${id}] = true`);

    // Get the monitor to check
    const { data: monitor, error: fetchError } = await supabase
      .from("stock_monitors")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !monitor) {
      console.error("Error fetching monitor:", fetchError);
      delete checkInProgress[id];
      return false;
    }

    console.log(`Triggering check for monitor:`, monitor);

    // Call the edge function to check the URL
    console.log(`Calling edge function for monitor ${id} with URL: ${monitor.url}`);
    const { data, error } = await supabase.functions.invoke("check-url-stock", {
      body: {
        id: monitor.id,
        url: monitor.url,
        targetText: monitor.target_text,
      },
    });

    console.log(`Edge function response:`, data);

    if (error) {
      console.error("Error calling check-url-stock function:", error);
      
      // Update monitor with error status
      await supabase
        .from("stock_monitors")
        .update({
          status: "error",
          last_checked: new Date().toISOString(),
          error_message: `Error calling stock check function: ${error.message}`,
          consecutive_errors: (monitor.consecutive_errors || 0) + 1,
        })
        .eq("id", id);
      
      delete checkInProgress[id];
      return false;
    }

    // The function handles updating the database directly
    console.log(`Updated monitor data:`, data);
    
    // Get the latest monitor data to schedule next check
    const { data: updatedMonitor } = await supabase
      .from("stock_monitors")
      .select("*")
      .eq("id", id)
      .single();
      
    if (updatedMonitor) {
      scheduleNextCheck(updatedMonitor);
    }
    
    delete checkInProgress[id];
    console.log(`Cleared checkInProgress for ${id} after successful check`);
    return true;
  } catch (error) {
    console.error("Error in triggerCheck:", error);
    delete checkInProgress[id];
    return false;
  }
};

// Calculate when a monitor should next be checked
const scheduleNextCheck = (monitor: MonitoringItem) => {
  if (!monitor.is_active) {
    console.log(`Monitor ${monitor.name} is inactive, not scheduling check`);
    delete nextCheckTimes[monitor.id];
    return;
  }
  
  let baseFrequency = monitor.check_frequency || 30; // Default to 30 minutes
  
  // Adjust frequency based on status
  let adjustedFrequency = baseFrequency;
  
  if (monitor.status === "in-stock") {
    // Check less frequently if in stock (at least once per hour)
    adjustedFrequency = Math.max(baseFrequency, 60);
  } else if (monitor.status === "error") {
    // Use exponential backoff for errors
    const backoffFactor = Math.min(Math.pow(2, (monitor.consecutive_errors || 1) - 1), 8);
    adjustedFrequency = Math.min(baseFrequency * backoffFactor, 240); // Cap at 4 hours
  } else if (monitor.status === "out-of-stock") {
    // Check more frequently if out of stock (but respect the minimum setting)
    adjustedFrequency = Math.min(baseFrequency, 15);
  }
  
  // Calculate next check time in milliseconds
  const nextCheckTime = Date.now() + adjustedFrequency * 60 * 1000;
  nextCheckTimes[monitor.id] = nextCheckTime;
  
  console.log(`Scheduling next check for ${monitor.name} (ID: ${monitor.id}) in ${adjustedFrequency} minutes`);
};

// Check if any monitors need to be checked
const checkPendingMonitors = async () => {
  const now = Date.now();
  
  // Get all active monitors
  const { data: activeMonitors, error } = await supabase
    .from("stock_monitors")
    .select("*")
    .eq("is_active", true);
    
  if (error || !activeMonitors) {
    console.error("Error fetching active monitors:", error);
    return;
  }
  
  // Schedule any monitors that don't have a next check time
  activeMonitors.forEach((monitor: MonitoringItem) => {
    if (!nextCheckTimes[monitor.id]) {
      scheduleNextCheck(monitor);
    }
  });
  
  // Check if any monitors are due
  for (const monitor of activeMonitors) {
    const nextCheck = nextCheckTimes[monitor.id];
    
    if (nextCheck && nextCheck <= now) {
      // Only check if not already in progress
      if (!checkInProgress[monitor.id]) {
        console.log(`Auto-checking monitor: ${monitor.name} (ID: ${monitor.id})`);
        await triggerCheck(monitor.id);
      }
    }
  }
};

// Initialize auto-checks
export const initializeAutoChecks = () => {
  if (autoCheckInterval) {
    clearInterval(autoCheckInterval);
  }
  
  // Check for monitors every minute
  autoCheckInterval = setInterval(checkPendingMonitors, 60 * 1000) as unknown as number;
  console.log("Initialized auto-checks for stock monitors");
  
  // Do an immediate check on startup
  setTimeout(checkPendingMonitors, 5000);
  
  return () => {
    if (autoCheckInterval) {
      clearInterval(autoCheckInterval);
      autoCheckInterval = null;
    }
  };
};

// Clean up auto-checks
export const cleanupAutoChecks = () => {
  if (autoCheckInterval) {
    clearInterval(autoCheckInterval);
    autoCheckInterval = null;
    console.log("Cleaned up auto-checks for stock monitors");
  }
};

// Set up realtime updates for monitors
export const setupMonitorRealtime = (onUpdate: (item: MonitoringItem) => void): RealtimeChannel => {
  console.log("Setting up realtime subscription for stock monitors...");
  
  const channel = supabase
    .channel('stock_monitor_changes')
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'stock_monitors' 
    }, (payload) => {
      console.log("Realtime update received:", payload);
      
      // Process the update
      if (payload.new) {
        const updatedItem = payload.new as MonitoringItem;
        onUpdate(updatedItem);
        
        // Re-schedule if active and frequency has changed
        if (updatedItem.is_active) {
          scheduleNextCheck(updatedItem);
        } else {
          // Remove from scheduling if not active
          delete nextCheckTimes[updatedItem.id];
        }
      }
    })
    .subscribe(status => {
      console.log("Realtime subscription status:", status);
    });
    
  return channel;
};
