
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

// Trigger a manual check of a URL with debounce protection
let checkInProgress: Record<string, boolean> = {};

// Trigger a manual check of a URL
export const triggerCheck = async (monitorId: string): Promise<MonitoringItem | null> => {
  try {
    // If check is already in progress for this ID, don't start another one
    if (checkInProgress[monitorId]) {
      console.log(`Check already in progress for monitor ${monitorId}, skipping duplicate request`);
      return null;
    }
    
    // Mark this check as in progress
    checkInProgress[monitorId] = true;
    
    // First fetch the monitor to get URL and target text
    const { data: monitor, error: fetchError } = await supabase
      .from("stock_monitors")
      .select("*")
      .eq("id", monitorId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching monitor data:", fetchError);
      throw fetchError;
    }
    
    console.log("Triggering check for monitor:", monitor);
    
    // Update status to unknown to show the check is in progress
    await supabase
      .from("stock_monitors")
      .update({ status: "unknown" })
      .eq("id", monitorId);
    
    // Call the edge function to check the URL status
    const { data, error } = await supabase.functions.invoke('check-url-stock', {
      body: { 
        id: monitorId,
        url: monitor.url,
        targetText: monitor.target_text
      }
    });

    if (error) {
      console.error("Error triggering URL check:", error);
      throw error;
    }

    // Fetch the updated monitor data
    const { data: monitorData, error: monitorError } = await supabase
      .from("stock_monitors")
      .select("*")
      .eq("id", monitorId)
      .single();

    if (monitorError) {
      console.error("Error fetching updated monitor:", monitorError);
      throw monitorError;
    }

    // Clear the in-progress flag
    delete checkInProgress[monitorId];
    
    return convertToMonitoringItem(monitorData);
  } catch (error) {
    console.error("Error in triggerCheck:", error);
    // Clear the in-progress flag even if there was an error
    delete checkInProgress[monitorId];
    return null;
  }
};

// Set up realtime updates for stock monitors
export const setupMonitorRealtime = (callback: (item: MonitoringItem) => void) => {
  return supabase
    .channel('stock_monitors_changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'stock_monitors'
      },
      (payload) => {
        const updatedItem = convertToMonitoringItem(payload.new);
        callback(updatedItem);
      }
    )
    .subscribe();
};
