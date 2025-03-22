
-- Add last_status_change column if it doesn't exist
ALTER TABLE IF EXISTS public.stock_monitors 
ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMPTZ;

-- Add check_frequency column if it doesn't exist
ALTER TABLE IF EXISTS public.stock_monitors 
ADD COLUMN IF NOT EXISTS check_frequency INTEGER DEFAULT 30;

-- Add consecutive_errors column if it doesn't exist
ALTER TABLE IF EXISTS public.stock_monitors 
ADD COLUMN IF NOT EXISTS consecutive_errors INTEGER DEFAULT 0;

-- Add last_seen_in_stock column if it doesn't exist
ALTER TABLE IF EXISTS public.stock_monitors 
ADD COLUMN IF NOT EXISTS last_seen_in_stock TIMESTAMPTZ;

-- Create an index on last_seen_in_stock
CREATE INDEX IF NOT EXISTS stock_monitors_last_seen_idx 
ON public.stock_monitors(last_seen_in_stock);
