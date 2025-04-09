
-- Create RPC function to insert a new contact submission
-- This is used to avoid directly accessing the contact_submissions table
CREATE OR REPLACE FUNCTION public.insert_contact_submission(
  _first_name TEXT,
  _last_name TEXT,
  _email TEXT,
  _inquiry_type inquiry_type,
  _message TEXT,
  _newsletter_signup BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.contact_submissions (
    first_name,
    last_name,
    email,
    inquiry_type,
    message,
    newsletter_signup
  ) VALUES (
    _first_name,
    _last_name,
    _email,
    _inquiry_type,
    _message,
    _newsletter_signup
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Create RPC function to update contact submission status
CREATE OR REPLACE FUNCTION public.update_contact_submission_status(
  _id UUID,
  _status message_status,
  _read_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.contact_submissions
  SET 
    status = _status,
    read_at = COALESCE(_read_at, read_at)
  WHERE id = _id;
END;
$$;

-- Update the send-support-response function to handle contact form submissions
-- This is done through the edge function, which we already updated in the supabase/functions folder
