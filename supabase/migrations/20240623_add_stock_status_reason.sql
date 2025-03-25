
-- Add stock_status_reason column to stock_monitors table to help with debugging
ALTER TABLE IF EXISTS public.stock_monitors 
ADD COLUMN IF NOT EXISTS stock_status_reason TEXT;
