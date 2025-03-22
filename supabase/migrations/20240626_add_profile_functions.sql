
-- This file is left with the existing functions for future reference, 
-- but we're not using these RPC functions in the code right now due to type issues.
-- Instead, we're using direct table access.

-- Function to get a user's profile
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.display_name
  FROM 
    public.profiles p
  WHERE 
    p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a username is available
CREATE OR REPLACE FUNCTION public.is_username_available(
  username_to_check TEXT,
  current_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM public.profiles
  WHERE 
    username = username_to_check
    AND id != current_user_id;
  
  RETURN existing_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update a user's username
CREATE OR REPLACE FUNCTION public.update_user_username(
  user_id UUID,
  new_username TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET 
    username = new_username,
    updated_at = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple function to get just the username for a user
CREATE OR REPLACE FUNCTION public.get_username(user_id UUID)
RETURNS TEXT AS $$
  SELECT username FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
