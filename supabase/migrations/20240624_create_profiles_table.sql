
-- Create profiles table to store user information including usernames
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable row level security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read all profiles (usernames are public)
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create trigger to update the updated_at column
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create a function to generate random usernames
CREATE OR REPLACE FUNCTION public.generate_random_username()
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY['happy', 'clever', 'brave', 'bright', 'eager', 'gentle', 'kind', 'lively', 'mighty', 'nice', 'proud', 'quick', 'smart', 'swift', 'wise'];
  nouns TEXT[] := ARRAY['fox', 'wolf', 'bear', 'eagle', 'tiger', 'lion', 'hawk', 'deer', 'rabbit', 'dragon', 'shark', 'dolphin', 'panda', 'koala', 'penguin'];
  adj TEXT;
  noun TEXT;
  num TEXT;
  username TEXT;
  unique_username BOOLEAN := false;
BEGIN
  WHILE NOT unique_username LOOP
    -- Select random adjective and noun
    adj := adjectives[1 + floor(random() * array_length(adjectives, 1))];
    noun := nouns[1 + floor(random() * array_length(nouns, 1))];
    -- Generate a random 3-digit number
    num := (1000 + floor(random() * 9000))::TEXT;
    -- Combine to create username
    username := adj || noun || num;
    
    -- Check if username is unique
    SELECT NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.username = username) INTO unique_username;
  END LOOP;
  
  RETURN username;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to create profiles on user signup
CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, public.generate_random_username());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_on_signup();

-- Create a function to get the username for a user
CREATE OR REPLACE FUNCTION public.get_username(user_id UUID)
RETURNS TEXT AS $$
  SELECT username FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Populate profiles for existing users (create random usernames)
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles) LOOP
    INSERT INTO public.profiles (id, username) 
    VALUES (user_record.id, public.generate_random_username());
  END LOOP;
END;
$$;
