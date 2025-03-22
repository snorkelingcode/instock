
-- Add new columns to stock_monitors table for enhanced monitoring capabilities
ALTER TABLE IF EXISTS public.stock_monitors 
ADD COLUMN IF NOT EXISTS check_frequency INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS consecutive_errors INTEGER DEFAULT 0;

-- Update the update_modified_column function to track status changes
CREATE OR REPLACE FUNCTION public.update_stock_monitor_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- If status has changed, update the last_status_change timestamp
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.last_status_change = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS update_stock_monitors_updated_at ON public.stock_monitors;

-- Create the new trigger that tracks both updated_at and status changes
CREATE TRIGGER update_stock_monitors_timestamps
BEFORE UPDATE ON public.stock_monitors
FOR EACH ROW
EXECUTE FUNCTION public.update_stock_monitor_timestamps();

-- Enable realtime for this table if not already enabled
ALTER PUBLICATION supabase_realtime ADD TABLE stock_monitors;

-- Set REPLICA IDENTITY to FULL to ensure all fields are included in change events
ALTER TABLE public.stock_monitors REPLICA IDENTITY FULL;

-- Add index on is_active and check_frequency for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_monitors_active_frequency
ON public.stock_monitors(is_active, check_frequency);
