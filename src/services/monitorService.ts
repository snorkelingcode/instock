
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MonitoringItem {
  id: string;
  name: string;
  url: string;
  target_text?: string;
  status: 'in-stock' | 'out-of-stock' | 'unknown' | 'error';
  last_checked?: string;
  is_active: boolean;
  error_message?: string;
}

// Function to add a new monitor
export const addMonitor = async (values: { name: string; url: string; targetText?: string }): Promise<MonitoringItem | null> => {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    
    if (!user) {
      toast.error('You must be logged in to add monitors');
      return null;
    }

    const { data, error } = await supabase
      .from('stock_monitors')
      .insert({
        user_id: user.id,
        name: values.name,
        url: values.url,
        target_text: values.targetText || null,
        status: 'unknown',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error adding monitor:', error);
      toast.error('Failed to add monitor');
      return null;
    }

    toast.success('Monitor added successfully');
    
    // Format the data to match our component interface
    return {
      id: data.id,
      name: data.name,
      url: data.url,
      target_text: data.target_text,
      status: data.status as 'in-stock' | 'out-of-stock' | 'unknown' | 'error',
      last_checked: data.last_checked,
      is_active: data.is_active,
    };
  } catch (error) {
    console.error('Error in addMonitor:', error);
    toast.error('Failed to add monitor');
    return null;
  }
};

// Function to get all monitors for the current user
export const getMonitors = async (): Promise<MonitoringItem[]> => {
  try {
    const { data, error } = await supabase
      .from('stock_monitors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching monitors:', error);
      toast.error('Failed to fetch monitors');
      return [];
    }

    // Format the data to match our component interface
    return data.map(item => ({
      id: item.id,
      name: item.name,
      url: item.url,
      target_text: item.target_text,
      status: item.status as 'in-stock' | 'out-of-stock' | 'unknown' | 'error',
      last_checked: item.last_checked,
      is_active: item.is_active,
      error_message: item.error_message,
    }));
  } catch (error) {
    console.error('Error in getMonitors:', error);
    toast.error('Failed to fetch monitors');
    return [];
  }
};

// Function to toggle a monitor's active status
export const toggleMonitorActive = async (id: string, currentStatus: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('stock_monitors')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Error toggling monitor:', error);
      toast.error('Failed to update monitor');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in toggleMonitorActive:', error);
    toast.error('Failed to update monitor');
    return false;
  }
};

// Function to delete a monitor
export const deleteMonitor = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('stock_monitors')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting monitor:', error);
      toast.error('Failed to delete monitor');
      return false;
    }

    toast.success('Monitor deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteMonitor:', error);
    toast.error('Failed to delete monitor');
    return false;
  }
};

// Function to refresh a monitor (check its status)
export const refreshMonitor = async (id: string, url: string, targetText?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('check-url-stock', {
      body: {
        id,
        url,
        targetText,
      },
    });

    if (error || !data.success) {
      console.error('Error refreshing monitor:', error || data.error);
      toast.error('Failed to check URL status');
      return false;
    }

    // If the item is in stock, notify the user
    if (data.isInStock) {
      toast.success(`Item is in stock!`);
    } else {
      toast.info(`Item is currently out of stock`);
    }

    return true;
  } catch (error) {
    console.error('Error in refreshMonitor:', error);
    toast.error('Failed to check URL status');
    return false;
  }
};

// Function to set up real-time updates for monitors
export const setupMonitorRealtime = (onUpdate: (item: MonitoringItem) => void) => {
  const channel = supabase
    .channel('stock_monitors_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'stock_monitors',
      },
      (payload) => {
        // Format the data to match our component interface
        const item: MonitoringItem = {
          id: payload.new.id,
          name: payload.new.name,
          url: payload.new.url,
          target_text: payload.new.target_text,
          status: payload.new.status as 'in-stock' | 'out-of-stock' | 'unknown' | 'error',
          last_checked: payload.new.last_checked,
          is_active: payload.new.is_active,
          error_message: payload.new.error_message,
        };
        
        onUpdate(item);
      }
    )
    .subscribe();

  // Return the channel for cleanup
  return channel;
};
