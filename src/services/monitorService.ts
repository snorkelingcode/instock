
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

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
    error_message: item.error_message
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
  targetText?: string
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
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding monitor:", error);
      throw error;
    }

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

// Trigger a manual check of a URL
export const triggerCheck = async (monitorId: string): Promise<MonitoringItem | null> => {
  console.log(`Starting check for monitor ID: ${monitorId}`);
  
  try {
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
    
    // Then fetch the monitor to get URL and target text
    const { data: monitor, error: fetchError } = await supabase
      .from("stock_monitors")
      .select("*")
      .eq("id", monitorId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching monitor data:", fetchError);
      
      // Update DB with error
      await supabase
        .from("stock_monitors")
        .update({ 
          status: "error",
          error_message: "Failed to fetch monitor data",
          last_checked: new Date().toISOString()
        })
        .eq("id", monitorId);
      
      // Clean up the in-progress flag after a delay
      checkTimeouts[monitorId] = setTimeout(() => {
        delete checkInProgress[monitorId];
        delete checkTimeouts[monitorId];
        console.log(`Cleared checkInProgress for ${monitorId} after fetch error`);
      }, 2000) as unknown as number;
      
      throw fetchError;
    }
    
    console.log("Triggering check for monitor:", monitor);
    
    try {
      // Call the edge function to check the URL status
      console.log(`Calling edge function for monitor ${monitorId} with URL: ${monitor.url}`);
      const { data, error } = await supabase.functions.invoke('check-url-stock', {
        body: { 
          id: monitorId,
          url: monitor.url,
          targetText: monitor.target_text
        }
      });

      if (error) {
        console.error("Error triggering URL check:", error);
        
        // Update the monitor with error status
        await supabase
          .from("stock_monitors")
          .update({ 
            status: "error",
            error_message: error.message || "Error invoking check function",
            last_checked: new Date().toISOString()
          })
          .eq("id", monitorId);
          
        throw error;
      }
      
      console.log("Edge function response:", data);
      
      // Fetch the updated monitor data since the edge function should have updated it
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
      
      // Clean up the in-progress flag with delay to prevent race conditions
      checkTimeouts[monitorId] = setTimeout(() => {
        delete checkInProgress[monitorId];
        delete checkTimeouts[monitorId];
        console.log(`Cleared checkInProgress for ${monitorId} after successful check`);
      }, 2000) as unknown as number;
      
      return convertToMonitoringItem(monitorData);
    } catch (error) {
      // If there was an error, make sure we still clear the in-progress flag after a delay
      console.error("Function invoke or fetch error:", error);
      
      // Ensure we update the DB with error status if not already done
      await supabase
        .from("stock_monitors")
        .update({ 
          status: "error",
          error_message: error instanceof Error ? error.message : "Unknown error occurred",
          last_checked: new Date().toISOString()
        })
        .eq("id", monitorId);
      
      checkTimeouts[monitorId] = setTimeout(() => {
        delete checkInProgress[monitorId];
        delete checkTimeouts[monitorId];
        console.log(`Cleared checkInProgress for ${monitorId} after error`);
      }, 2000) as unknown as number;
      
      // Return null to indicate an error
      return null;
    }
  } catch (error) {
    console.error("Error in triggerCheck:", error);
    
    // Clear the in-progress flag even if there was an error
    setTimeout(() => {
      delete checkInProgress[monitorId];
      console.log(`Cleared checkInProgress for ${monitorId} after outer catch`);
    }, 2000);
    
    return null;
  }
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
