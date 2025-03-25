
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MonitorData {
  id?: string;
  url: string;
  name: string;
  target_text?: string;
  check_frequency?: number;
  is_active?: boolean;
}

/**
 * Creates a new stock monitor
 */
export const createStockMonitor = async (data: MonitorData) => {
  try {
    const { data: monitor, error } = await supabase
      .from('stock_monitors')
      .insert({
        url: data.url,
        name: data.name,
        target_text: data.target_text,
        check_frequency: data.check_frequency || 30,
        is_active: data.is_active !== undefined ? data.is_active : true
      })
      .select()
      .single();

    if (error) throw error;
    return monitor;
  } catch (error) {
    console.error('Error creating stock monitor:', error);
    throw error;
  }
};

/**
 * Updates an existing stock monitor
 */
export const updateStockMonitor = async (id: string, data: Partial<MonitorData>) => {
  try {
    const { data: monitor, error } = await supabase
      .from('stock_monitors')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return monitor;
  } catch (error) {
    console.error('Error updating stock monitor:', error);
    throw error;
  }
};

/**
 * Deletes a stock monitor
 */
export const deleteStockMonitor = async (id: string) => {
  try {
    const { error } = await supabase
      .from('stock_monitors')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting stock monitor:', error);
    throw error;
  }
};

/**
 * Checks a URL using the Bright Data Target API
 */
export const checkUrlWithBrightData = async (id: string, url: string, name: string) => {
  try {
    const response = await fetch('/api/bright-data-target-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        url,
        monitorName: name
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to check URL');
    }
    
    return data;
  } catch (error) {
    console.error('Error checking URL with Bright Data:', error);
    throw error;
  }
};

/**
 * Updates the check frequency for a monitor
 */
export const updateCheckFrequency = async (id: string, frequency: number) => {
  try {
    const { error } = await supabase
      .from('stock_monitors')
      .update({
        check_frequency: frequency,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating check frequency:', error);
    throw error;
  }
};

/**
 * Toggles the active state of a monitor
 */
export const toggleMonitorActive = async (id: string) => {
  try {
    // First get the current state
    const { data: monitor, error: fetchError } = await supabase
      .from('stock_monitors')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Toggle the state
    const { error } = await supabase
      .from('stock_monitors')
      .update({
        is_active: !monitor.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return !monitor.is_active; // Return the new state
  } catch (error) {
    console.error('Error toggling monitor active state:', error);
    throw error;
  }
};
