
-- Function to get a user's display name from user_profiles
CREATE OR REPLACE FUNCTION public.get_user_display_name(user_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  display_name_val TEXT;
BEGIN
  SELECT display_name INTO display_name_val
  FROM public.user_profiles
  WHERE user_id = user_id_param;
  
  -- If no display name found, return a generated one
  IF display_name_val IS NULL THEN
    RETURN 'user_' || substring(user_id_param::TEXT, 1, 8);
  ELSE
    RETURN display_name_val;
  END IF;
END;
$$;
