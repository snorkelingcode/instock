
-- Create table for tracking TCG card download jobs
CREATE TABLE IF NOT EXISTS public.tcg_download_jobs (
  id UUID PRIMARY KEY,
  game TEXT NOT NULL,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL,
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_tcg_download_jobs_status ON public.tcg_download_jobs(status);

-- Create index on game for faster queries
CREATE INDEX IF NOT EXISTS idx_tcg_download_jobs_game ON public.tcg_download_jobs(game);
