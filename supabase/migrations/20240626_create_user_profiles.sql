
-- Create a user_profiles table to store user display names
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a unique index on user_id
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_user_id_idx ON public.user_profiles(user_id);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow users to view all profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to update their own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create a trigger function to update the updated_at column
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that calls the function before an update
CREATE TRIGGER update_user_profiles_updated_at_trigger
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_profiles_updated_at();

-- Create a trigger function to auto-create user profiles
CREATE OR REPLACE FUNCTION create_user_profile_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'display_user_id')::TEXT,
      'user_' || substring(NEW.id::TEXT, 1, 8)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that calls the function after an insert to auth.users
CREATE TRIGGER create_profile_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_profile_from_auth();
