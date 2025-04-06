
-- Create a secure function to fetch display user IDs
CREATE OR REPLACE FUNCTION public.get_user_display_names(user_ids UUID[])
RETURNS TABLE(
  id UUID,
  display_user_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    COALESCE(
      (au.raw_user_meta_data->>'display_user_id')::TEXT, 
      'user' || substring(au.id::TEXT, 1, 4)
    ) as display_user_id
  FROM 
    auth.users au
  WHERE
    au.id = ANY(user_ids);
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.get_user_display_names IS 'Securely fetch display names for users by their IDs';

-- Grant usage permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_display_names TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_display_names TO anon;
