import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, differenceInMinutes } from "date-fns";

// Extended type definition for monitor items to include the missing fields
export interface MonitoringItem {
  id: string;
  name: string;
  url: string;
  target_text?: string;
  status: string;
  last_checked: string | null;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
  html_snapshot?: string;
  check_frequency?: number; // Added field
  consecutive_errors?: number; // Added field
}

// Function to fetch all monitoring items
export const fetchMonitors = async (): Promise<MonitoringItem[]> => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("stock_monitors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Apply type assertion to include our additional fields
    return (data || []) as MonitoringItem[];
  } catch (error) {
    console.error("Error fetching monitors:", error);
    return [];
  }
};

// Function to add a new monitoring item
export const addMonitor = async (
  name: string,
  url: string,
  targetText?: string,
  checkFrequency: number = 30
): Promise<MonitoringItem | null> => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      throw new Error("User not authenticated");
    }

    // Since we're dealing with typings that might not be updated,
    // we need to create a base object and then add the potentially missing fields
    const monitorData: any = {
      name,
      url,
      target_text: targetText,
      user_id: user.data.user.id,
      status: "unknown",
      is_active: true
    };
    
    // Add the check_frequency field
    monitorData.check_frequency = checkFrequency;

    const { data, error } = await supabase
      .from("stock_monitors")
      .insert(monitorData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as MonitoringItem;
  } catch (error) {
    console.error("Error adding monitor:", error);
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
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error toggling monitor status:", error);
    return false;
  }
};

// Function to delete a monitor
export const deleteMonitor = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("stock_monitors").delete().eq("id", id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error deleting monitor:", error);
    return false;
  }
};

// Function to update check frequency
export const updateCheckFrequency = async (
  id: string,
  frequency: number
): Promise<boolean> => {
  try {
    // Using type assertion for the check_frequency field
    const { error } = await supabase
      .from("stock_monitors")
      .update({ check_frequency: frequency } as any)
      .eq("id", id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error updating check frequency:", error);
    return false;
  }
};

// Function to trigger a check
export const triggerCheck = async (id: string): Promise<void> => {
  try {
    const { data, error } = await supabase.functions.invoke("check-url-stock", {
      body: { monitorId: id }
    });

    if (error) {
      console.error("Error triggering check:", error);
      
      // If the edge function fails, update the monitor status with the error
      const detailedError = data?.error || error.message || "Unknown error";
      
      await supabase
        .from("stock_monitors")
        .update({
          status: "error",
          error_message: `Edge function error: ${detailedError}`,
          last_checked: new Date().toISOString(),
          consecutive_errors: 1 // Reset error count since this was a manual check
        } as any)
        .eq("id", id);
    }
  } catch (error) {
    console.error("Error in triggerCheck:", error);
  }
};

// Set up realtime subscription
export const setupMonitorRealtime = (
  callback: (updatedItem: MonitoringItem) => void
) => {
  try {
    const channel = supabase
      .channel("stock_monitors_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stock_monitors"
        },
        (payload) => {
          // Type assertion to include our additional fields
          const updatedItem = payload.new as MonitoringItem;
          callback(updatedItem);
        }
      )
      .subscribe();

    return channel;
  } catch (error) {
    console.error("Error setting up realtime subscription:", error);
    return null;
  }
};

// Initialize auto-checking of monitors
let autoCheckIntervalId: NodeJS.Timeout | null = null;

export const initializeAutoChecks = () => {
  if (autoCheckIntervalId) {
    clearInterval(autoCheckIntervalId);
  }

  // Check every minute for items that need to be checked
  autoCheckIntervalId = setInterval(checkDueMonitors, 60000);
  
  // Run an initial check right away
  checkDueMonitors();
};

export const cleanupAutoChecks = () => {
  if (autoCheckIntervalId) {
    clearInterval(autoCheckIntervalId);
    autoCheckIntervalId = null;
  }
};

// Function to determine which monitors are due for a check
const checkDueMonitors = async () => {
  try {
    console.log("Checking for monitors due for checking...");
    
    // Get all active monitors
    const { data: monitors, error } = await supabase
      .from("stock_monitors")
      .select("*")
      .eq("is_active", true);
    
    if (error) {
      throw error;
    }
    
    // Apply type assertion to include our additional fields
    const monitorItems = monitors as unknown as MonitoringItem[];
    
    const now = new Date();
    const dueMonitors = monitorItems.filter(monitor => {
      // If never checked before, it's due
      if (!monitor.last_checked) return true;
      
      const lastChecked = parseISO(monitor.last_checked);
      const minutesSinceLastCheck = differenceInMinutes(now, lastChecked);
      
      // Determine check frequency based on status
      // If check_frequency is not available, use a default
      const baseFrequency = monitor.check_frequency || 30; // minutes
      
      let actualFrequency = baseFrequency;
      
      // Items that are out of stock should be checked more frequently
      if (monitor.status === "out-of-stock") {
        actualFrequency = Math.max(5, Math.floor(baseFrequency / 2));
      }
      
      // Items that are in stock can be checked less frequently
      if (monitor.status === "in-stock") {
        actualFrequency = baseFrequency * 2;
      }
      
      // If there were errors, use exponential backoff
      if (monitor.status === "error" && typeof monitor.consecutive_errors === 'number') {
        const backoffFactor = Math.min(Math.pow(2, monitor.consecutive_errors), 8);
        actualFrequency = baseFrequency * backoffFactor;
      }
      
      return minutesSinceLastCheck >= actualFrequency;
    });
    
    if (dueMonitors.length > 0) {
      console.log(`Found ${dueMonitors.length} monitors due for checking`);
      
      // Check up to 3 monitors at a time to avoid rate limiting
      const batchSize = 3;
      const monitorsToCheck = dueMonitors.slice(0, batchSize);
      
      for (const monitor of monitorsToCheck) {
        console.log(`Auto-checking monitor: ${monitor.name}`);
        await triggerCheck(monitor.id);
        
        // Add a small delay between checks
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } else {
      console.log("No monitors due for checking at this time");
    }
  } catch (error) {
    console.error("Error in checkDueMonitors:", error);
  }
};

// Function to create a new monitor
export const createMonitor = async (monitorData: {
  name: string;
  url: string;
  target_text?: string;
  check_frequency?: number;
}): Promise<MonitoringItem | null> => {
  try {
    // Get user ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Insert the monitor with the new field
    const { data, error } = await supabase
      .from('stock_monitors')
      .insert({
        name: monitorData.name,
        url: monitorData.url,
        target_text: monitorData.target_text || null,
        user_id: user.id,
        is_active: true,
        status: 'pending',
        check_frequency: monitorData.check_frequency || 30,
      } as any)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating monitor:", error);
      throw error;
    }
    
    return data as unknown as MonitoringItem;
  } catch (error) {
    console.error("Error in createMonitor:", error);
    return null;
  }
};

// Function to reset consecutive errors
export const resetConsecutiveErrors = async (monitorId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('stock_monitors')
      .update({ 
        consecutive_errors: 0,
        status: 'active'
      } as any)
      .eq('id', monitorId);
    
    if (error) {
      console.error("Error resetting consecutive errors:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error in resetConsecutiveErrors:", error);
    return false;
  }
};

// Function to get monitor stats
export const getMonitorStats = async (): Promise<{
  total: number;
  active: number;
  paused: number;
  error: number;
  inStock: number;
}> => {
  try {
    const { data, error } = await supabase
      .from('stock_monitors')
      .select('status, last_checked')
      .order('last_checked', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Safely handle data with type assertions
    const monitors = data as unknown as MonitoringItem[];
    const total = monitors.length;
    const active = monitors.filter(m => m.is_active).length;
    const paused = monitors.filter(m => !m.is_active).length;
    const error = monitors.filter(m => m.status === 'error' && m.consecutive_errors && m.consecutive_errors > 2).length;
    const inStock = monitors.filter(m => m.status === 'in_stock').length;
    
    return { total, active, paused, error, inStock };
  } catch (error) {
    console.error("Error getting monitor stats:", error);
    return { total: 0, active: 0, paused: 0, error: 0, inStock: 0 };
  }
};
