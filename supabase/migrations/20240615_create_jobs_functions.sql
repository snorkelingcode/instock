
-- Function to get a job by ID
CREATE OR REPLACE FUNCTION public.get_job_by_id(job_id UUID)
RETURNS TABLE (
  id UUID,
  job_type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  user_id UUID,
  result_summary JSONB,
  payload JSONB
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT j.id, j.job_type, j.status, j.created_at, j.updated_at, j.completed_at, j.error_message, j.user_id, j.result_summary, j.payload
  FROM public.jobs j
  WHERE j.id = job_id;
END;
$$;

-- Function to create a sync job
CREATE OR REPLACE FUNCTION public.create_sync_job(job_details JSONB)
RETURNS UUID SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  new_id UUID;
  job_type_val TEXT;
  user_id_val UUID;
BEGIN
  -- Extract values from the JSONB input
  job_type_val := job_details->>'job_type';
  user_id_val := (job_details->>'user_id')::UUID;
  
  INSERT INTO public.jobs (
    job_type,
    status,
    user_id,
    payload
  ) VALUES (
    job_type_val,
    'pending',
    user_id_val,
    jsonb_build_object(
      'sync_type', job_details->>'sync_type',
      'set_code', job_details->>'set_code'
    )
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Function to get active jobs for a user
CREATE OR REPLACE FUNCTION public.get_active_jobs_for_user(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  job_type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  user_id UUID,
  result_summary JSONB
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT j.id, j.job_type, j.status, j.created_at, j.updated_at, j.completed_at, j.error_message, j.user_id, j.result_summary
  FROM public.jobs j
  WHERE j.user_id = user_id_param
  AND j.status NOT IN ('completed', 'failed')
  ORDER BY j.created_at DESC;
END;
$$;

-- Function to update job status
CREATE OR REPLACE FUNCTION public.update_job_status(job_id UUID, new_status TEXT, error_msg TEXT DEFAULT NULL, result JSONB DEFAULT NULL)
RETURNS VOID SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.jobs
  SET 
    status = new_status,
    updated_at = now(),
    completed_at = CASE WHEN new_status IN ('completed', 'failed') THEN now() ELSE completed_at END,
    error_message = error_msg,
    result_summary = result
  WHERE id = job_id;
END;
$$;
