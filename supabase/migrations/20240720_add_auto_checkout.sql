
-- Add auto_checkout column to stock_monitors table
ALTER TABLE IF EXISTS public.stock_monitors 
ADD COLUMN IF NOT EXISTS auto_checkout BOOLEAN DEFAULT false;

-- Add checkout_status column to stock_monitors table
ALTER TABLE IF EXISTS public.stock_monitors 
ADD COLUMN IF NOT EXISTS checkout_status TEXT;
