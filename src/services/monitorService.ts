import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, differenceInMinutes } from "date-fns";

// Define monitor types
export type MonitorStatus = "in-stock" | "out-of-stock" | "unknown" | "error";

export interface MonitoringItem {
  id: string;
  name: string;
  url: string;
  target_text?: string;
  status: MonitorStatus;
  last_checked: string | null;
  is_active: boolean;
  error_message?: string;
  check_frequency?: number; // Minutes between checks
  last_status_change?: string | null;
  last_seen_in_stock?: string | null;
  consecutive_errors?: number;
  auto_checkout?: boolean; // Property for auto checkout
  checkout_status?: string; // Property for checkout status
}

// Convert database entry to frontend monitoring item
const convertToMonitoringItem = (item: any): MonitoringItem => {
  return {
    id: item.id,
    name: item.name,
    url: item.url,
    target_text: item.target_text,
    status: item.status || "unknown",
    last_checked: item.last_checked,
    is_active: item.is_active,
    error_message: item.error_message,
    check_frequency: item.check_frequency || 30, // Default to 30 minutes
    last_status_change: item.last_status_change,
    last_seen_in_stock: item.last_seen_in_stock,
    consecutive_errors: item.consecutive_errors || 0,
    auto_checkout: item.auto_checkout || false,
    checkout_status: item.checkout_status
  };
};

// Fetch all monitors for the current user
export const fetchMonitors = async (): Promise<MonitoringItem[]> => {
  try {
    const { data, error } = await supabase
      .from("stock_monitors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching monitors:", error);
      throw error;
    }

    // Convert database items to frontend items
    return (data || []).map(convertToMonitoringItem);
  } catch (error) {
    console.error("Error in fetchMonitors:", error);
    return [];
  }
};

// Add a new monitor for the current user
export const addMonitor = async (
  name: string,
  url: string,
  targetText?: string,
  checkFrequency: number = 30, // Default to 30 minutes
  autoCheckout: boolean = false // Default to no auto checkout
): Promise<MonitoringItem | null> => {
  try {
    const user = await supabase.auth.getUser();
    
    if (!user.data.user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("stock_monitors")
      .insert({
        name,
        url,
        target_text: targetText,
        user_id: user.data.user.id,
        status: "unknown",
        is_active: true,
        check_frequency: checkFrequency,
        auto_checkout: autoCheckout
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding monitor:", error);
      throw error;
    }

    // Immediately trigger a check for the new monitor
    setTimeout(() => {
      triggerCheck(data.id).catch(console.error);
    }, 500);

    return convertToMonitoringItem(data);
  } catch (error) {
    console.error("Error in addMonitor:", error);
    return null;
  }
};

// Toggle the active status of a monitor
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
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error in toggleMonitorStatus:", error);
    return false;
  }
};

// Toggle auto checkout for a monitor
export const toggleAutoCheckout = async (
  id: string,
  enableAutoCheckout: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("stock_monitors")
      .update({ auto_checkout: enableAutoCheckout })
      .eq("id", id);

    if (error) {
      console.error("Error toggling auto checkout:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error in toggleAutoCheckout:", error);
    return false;
  }
};

// Update check frequency for a monitor
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
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error in updateCheckFrequency:", error);
    return false;
  }
};

// Delete a monitor
export const deleteMonitor = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("stock_monitors")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting monitor:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteMonitor:", error);
    return false;
  }
};

// Format a date for display
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Never";
  
  try {
    return format(parseISO(dateString), "MMM d, yyyy h:mm a");
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Invalid date";
  }
};

// For preventing concurrent checks and managing timeouts
let checkInProgress: Record<string, boolean> = {};
let checkTimeouts: Record<string, number> = {};
let autoCheckIntervals: Record<string, number> = {};

// Safety mechanism to clean up stale in-progress flags
// This will run every minute to clear any in-progress flags that may have been left behind
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
setInterval(() => {
  const now = Date.now();
  const staleTime = 2 * 60 * 1000; // 2 minutes
  
  // Check for stale in-progress flags
  for (const id in checkInProgress) {
    const timestamp = checkTimeouts[`${id}_started`] || 0;
    if (now - timestamp > staleTime) {
      console.log(`Clearing stale in-progress flag for ${id} (after ${Math.round((now - timestamp) / 1000)}s)`);
      delete checkInProgress[id];
      delete checkTimeouts[`${id}_started`];
    }
  }
}, CLEANUP_INTERVAL);

// Helper function to create a detailed error message
const createDetailedErrorMessage = (error: any): string => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  } else if (typeof error === 'object' && error !== null) {
    try {
      // Try to stringify the object for more details
      return JSON.stringify(error);
    } catch (e) {
      // If circular reference or other JSON error
      return `[Complex error object: ${Object.keys(error).join(', ')}]`;
    }
  }
  return String(error);
};

// Trigger a manual check of a URL
export const triggerCheck = async (monitorId: string): Promise<MonitoringItem | null> => {
  console.log(`Starting check for monitor ID: ${monitorId}`);
  
  try {
    // Record start time for this check
    checkTimeouts[`${monitorId}_started`] = Date.now();
    
    // Clear any existing timeouts for this monitor ID
    if (checkTimeouts[monitorId]) {
      clearTimeout(checkTimeouts[monitorId]);
      delete checkTimeouts[monitorId];
    }
    
    // If check is already in progress for this ID, don't start another one
    if (checkInProgress[monitorId]) {
      console.log(`Check already in progress for monitor ${monitorId}, skipping duplicate request`);
      return null;
    }
    
    // Mark this check as in progress
    checkInProgress[monitorId] = true;
    console.log(`Set checkInProgress[${monitorId}] = true`);
    
    // First update status to unknown to show the check is in progress
    try {
      const { error: updateError } = await supabase
        .from("stock_monitors")
        .update({ 
          status: "unknown",
          error_message: null 
        })
        .eq("id", monitorId);
        
      if (updateError) {
        console.error("Error updating monitor status to unknown:", updateError);
      }
    } catch (e) {
      console.error("Error updating initial status:", e);
    }
    
    // Then fetch the monitor to get URL and target text
    let monitor;
    try {
      const { data, error } = await supabase
        .from("stock_monitors")
        .select("*")
        .eq("id", monitorId)
        .single();
        
      if (error) {
        throw error;
      }
      
      monitor = data;
    } catch (fetchError) {
      console.error("Error fetching monitor data:", fetchError);
      
      // Update DB with error
      await supabase
        .from("stock_monitors")
        .update({ 
          status: "error",
          error_message: "Failed to fetch monitor data: " + createDetailedErrorMessage(fetchError),
          last_checked: new Date().toISOString(),
          consecutive_errors: monitor?.consecutive_errors ? monitor.consecutive_errors + 1 : 1
        })
        .eq("id", monitorId);
      
      // Clean up the in-progress flag
      delete checkInProgress[monitorId];
      console.log(`Cleared checkInProgress for ${monitorId} after fetch error`);
      
      throw fetchError;
    }
    
    console.log("Triggering check for monitor:", monitor);
    
    try {
      // Call the edge function to check the URL status
      console.log(`Calling edge function for monitor ${monitorId} with URL: ${monitor.url}`);
      
      // Make sure to use the correctly formed function name and request body
      const { data, error } = await supabase.functions.invoke('check-url-stock', {
        body: { 
          id: monitorId,
          url: monitor.url,
          targetText: monitor.target_text,
          autoCheckout: monitor.auto_checkout || false
        }
      });

      if (error) {
        console.error("Error invoking edge function:", error);
        
        // Create a detailed error message
        const detailedError = createDetailedErrorMessage(error);
        
        // Update the monitor with detailed error status
        await supabase
          .from("stock_monitors")
          .update({ 
            status: "error",
            error_message: `Edge function error: ${detailedError}`,
            last_checked: new Date().toISOString(),
            consecutive_errors: monitor.consecutive_errors ? monitor.consecutive_errors + 1 : 1
          })
          .eq("id", monitorId);
          
        throw error;
      }
      
      console.log("Edge function response:", data);
      
      // Even if the edge function returns success=false, it should have updated the DB
      // so we fetch the updated monitor data
      const { data: monitorData, error: monitorError } = await supabase
        .from("stock_monitors")
        .select("*")
        .eq("id", monitorId)
        .single();

      if (monitorError) {
        console.error("Error fetching updated monitor:", monitorError);
        throw monitorError;
      }

      console.log("Updated monitor data:", monitorData);
      
      // If this was successful and previous checks had errors, reset consecutive errors
      if (monitorData.status !== "error" && monitorData.consecutive_errors > 0) {
        await supabase
          .from("stock_monitors")
          .update({ consecutive_errors: 0 })
          .eq("id", monitorId);
      }
      
      // Schedule next automatic check if the monitor is active
      scheduleNextCheck(monitorData);
      
      // Clean up the in-progress flag with a slight delay to prevent race conditions
      checkTimeouts[monitorId] = setTimeout(() => {
        delete checkInProgress[monitorId];
        delete checkTimeouts[monitorId];
        console.log(`Cleared checkInProgress for ${monitorId} after successful check`);
      }, 3000) as unknown as number;
      
      return convertToMonitoringItem(monitorData);
    } catch (error) {
      // If there was an error, make sure we still clear the in-progress flag
      console.error("Function invoke or fetch error:", error);
      
      const errorMessage = createDetailedErrorMessage(error);
      
      // Double-check that we update the DB with detailed error status if needed
      try {
        // First fetch to see if the status was updated by the edge function
        const { data: currentData } = await supabase
          .from("stock_monitors")
          .select("status, last_checked, consecutive_errors")
          .eq("id", monitorId)
          .single();
          
        // Only update if it's still in "unknown" state or hasn't been checked recently
        if (currentData?.status === "unknown" || 
            !currentData?.last_checked || 
            (new Date().getTime() - new Date(currentData.last_checked).getTime() > 10000)) {
          await supabase
            .from("stock_monitors")
            .update({ 
              status: "error",
              error_message: `Network or function error: ${errorMessage}`,
              last_checked: new Date().toISOString(),
              consecutive_errors: (currentData?.consecutive_errors || 0) + 1
            })
            .eq("id", monitorId);
        }
        
        // Schedule next check despite the error
        if (monitor && monitor.is_active) {
          scheduleNextCheck(monitor);
        }
      } catch (dbError) {
        console.error("Failed to update error status:", dbError);
      }
      
      // Clear the in-progress flag
      delete checkInProgress[monitorId];
      console.log(`Cleared checkInProgress for ${monitorId} after error`);
      
      return null;
    }
  } catch (error) {
    console.error("Error in triggerCheck:", error);
    
    const errorMessage = createDetailedErrorMessage(error);
    
    // Update the database with the detailed error
    try {
      await supabase
        .from("stock_monitors")
        .update({ 
          status: "error",
          error_message: `Check failed: ${errorMessage}`,
          last_checked: new Date().toISOString()
        })
        .eq("id", monitorId);
    } catch (dbError) {
      console.error("Failed to update error status after top-level error:", dbError);
    }
    
    // Clear the in-progress flag even if there was an error
    delete checkInProgress[monitorId];
    console.log(`Cleared checkInProgress for ${monitorId} after outer catch`);
    
    return null;
  }
};

// Schedule the next automatic check based on monitor settings and status
const scheduleNextCheck = (monitor: any) => {
  if (!monitor || !monitor.is_active) {
    return;
  }
  
  // Clear any existing scheduled checks
  if (autoCheckIntervals[monitor.id]) {
    clearTimeout(autoCheckIntervals[monitor.id]);
    delete autoCheckIntervals[monitor.id];
  }
  
  // Determine check frequency in minutes
  let checkFrequency = monitor.check_frequency || 30; // Default to 30 minutes
  
  // Adjust frequency based on status and error history
  if (monitor.status === "in-stock") {
    // Check less frequently if in stock (we already found what we want)
    checkFrequency = Math.max(checkFrequency, 60); // At least 60 minutes
  } else if (monitor.status === "error") {
    // Exponential backoff for errors
    const errorCount = monitor.consecutive_errors || 1;
    const backoffFactor = Math.min(Math.pow(2, errorCount - 1), 8); // Max 8x backoff
    checkFrequency = Math.min(checkFrequency * backoffFactor, 240); // Max 4 hours
  } else if (monitor.status === "out-of-stock") {
    // Possibly check more frequently if out of stock and we want to catch when it comes back
    checkFrequency = Math.min(checkFrequency, 15); // At least every 15 minutes
  }
  
  // Add some randomness to avoid hitting sites all at the same time
  const jitter = Math.floor(Math.random() * 5) - 2; // -2 to +2 minutes
  checkFrequency = Math.max(1, checkFrequency + jitter);
  
  // Convert to milliseconds
  const checkFrequencyMs = checkFrequency * 60 * 1000;
  
  console.log(`Scheduling next check for ${monitor.name} (ID: ${monitor.id}) in ${checkFrequency} minutes`);
  
  // Schedule the next check
  autoCheckIntervals[monitor.id] = setTimeout(() => {
    console.log(`Auto-triggering scheduled check for ${monitor.name} (ID: ${monitor.id})`);
    triggerCheck(monitor.id).catch(error => {
      console.error(`Error during scheduled check for ${monitor.id}:`, error);
    });
  }, checkFrequencyMs) as unknown as number;
};

// Initial auto-check setup for all active monitors
export const initializeAutoChecks = async () => {
  console.log("Initializing automatic checks for all active monitors");
  
  try {
    const monitors = await fetchMonitors();
    const activeMonitors = monitors.filter(m => m.is_active);
    
    console.log(`Found ${activeMonitors.length} active monitors to schedule`);
    
    // Schedule initial checks with staggered starts to avoid overwhelming systems
    activeMonitors.forEach((monitor, index) => {
      // Stagger initial checks 5-10 seconds apart
      const initialDelay = 5000 + (index * 5000);
      
      setTimeout(() => {
        // Check if it needs updating (hasn't been checked recently)
        const needsCheck = !monitor.last_checked || 
          differenceInMinutes(new Date(), parseISO(monitor.last_checked)) > (monitor.check_frequency || 30) / 2;
        
        if (needsCheck) {
          console.log(`Scheduling initial check for ${monitor.name} in ${Math.round(initialDelay/1000)} seconds`);
          triggerCheck(monitor.id).catch(console.error);
        } else {
          console.log(`${monitor.name} was checked recently, scheduling next regular check`);
          scheduleNextCheck(monitor);
        }
      }, initialDelay);
    });
    
    return true;
  } catch (error) {
    console.error("Error initializing auto checks:", error);
    return false;
  }
};

// Clean up all auto-check intervals when component unmounts
export const cleanupAutoChecks = () => {
  Object.values(autoCheckIntervals).forEach(interval => clearTimeout(interval));
  autoCheckIntervals = {};
  console.log("Cleaned up all automatic check intervals");
};

// Set up realtime updates for stock monitors
export const setupMonitorRealtime = (callback: (item: MonitoringItem) => void) => {
  console.log("Setting up realtime subscription for stock monitors...");
  
  const channel = supabase
    .channel('stock_monitors_changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'stock_monitors'
      },
      (payload) => {
        console.log("Realtime update received:", payload);
        const updatedItem = convertToMonitoringItem(payload.new);
        callback(updatedItem);
      }
    )
    .subscribe((status) => {
      console.log("Realtime subscription status:", status);
    });
    
  return channel;
};
