
-- Enable Row Level Security
ALTER TABLE IF EXISTS public.stock_monitors ENABLE ROW LEVEL SECURITY;

-- Create the stock_monitors table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.stock_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  target_text TEXT,
  status TEXT DEFAULT 'unknown',
  last_checked TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  html_snapshot TEXT,
  error_message TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS stock_monitors_user_id_idx ON public.stock_monitors(user_id);
CREATE INDEX IF NOT EXISTS stock_monitors_status_idx ON public.stock_monitors(status);
CREATE INDEX IF NOT EXISTS stock_monitors_is_active_idx ON public.stock_monitors(is_active);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE stock_monitors;

-- Set up RLS policies
CREATE POLICY "Users can view their own monitors"
  ON public.stock_monitors
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own monitors"
  ON public.stock_monitors
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own monitors"
  ON public.stock_monitors
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own monitors"
  ON public.stock_monitors
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_monitors_updated_at
BEFORE UPDATE ON public.stock_monitors
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();
