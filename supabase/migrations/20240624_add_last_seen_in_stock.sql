
-- Add last_seen_in_stock column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS last_seen_in_stock TIMESTAMPTZ DEFAULT NULL;

-- Create an index on last_seen_in_stock for better query performance
CREATE INDEX IF NOT EXISTS idx_products_last_seen_in_stock
ON public.products(last_seen_in_stock);

-- Comment on the column to explain its purpose
COMMENT ON COLUMN public.products.last_seen_in_stock IS 'Timestamp when a product was last seen in stock before going out of stock';
