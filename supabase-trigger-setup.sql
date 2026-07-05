-- =======================================================
-- BULLETPROOF SUPABASE POSTGRESQL TRIGGER & SCHEMA SETUP
-- =======================================================
-- This script sets up a public profiles table and a highly robust
-- database trigger to automatically synchronize Google OAuth user sign-ups.
-- 
-- It contains nested EXCEPTION blocks so that any database column
-- mismatch or constraint error NEVER blocks the actual user signup transaction.

-- 1. Create public.profiles table (if it doesn't already exist)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row-Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Setup security policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Create trigger function with nested EXCEPTION blocks to handle column mismatches
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_name TEXT;
  extracted_avatar TEXT;
BEGIN
  -- Extract user metadata
  extracted_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  extracted_avatar := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

  -- LEVEL 1: Try inserting with 'full_name' and 'avatar_url' (Standard structure)
  BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (new.id, extracted_name, new.email, extracted_avatar)
    ON CONFLICT (id) DO UPDATE
    SET 
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      avatar_url = EXCLUDED.avatar_url;
  EXCEPTION WHEN OTHERS THEN
    -- LEVEL 2: Fallback to inserting with 'name' and 'avatar' (Common template structures)
    BEGIN
      INSERT INTO public.profiles (id, name, email, avatar)
      VALUES (new.id, extracted_name, new.email, extracted_avatar)
      ON CONFLICT (id) DO UPDATE
      SET 
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        avatar = EXCLUDED.avatar;
    EXCEPTION WHEN OTHERS THEN
      -- LEVEL 3: Fallback to inserting just 'id' and 'email' (Bare-minimum structure)
      BEGIN
        INSERT INTO public.profiles (id, email)
        VALUES (new.id, new.email)
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email;
      EXCEPTION WHEN OTHERS THEN
        -- LEVEL 4: If everything fails, raise warning but DO NOT abort transaction.
        -- This guarantees that the auth.users signup will ALWAYS succeed.
        RAISE WARNING 'profiles sync skipped. Error: %', SQLERRM;
      END;
    END;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
