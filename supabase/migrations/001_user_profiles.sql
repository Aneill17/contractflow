-- Migration 001: user_profiles table + RLS
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  name       TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Only service role can write profiles (managed via API/dashboard)
-- No INSERT/UPDATE/DELETE policy for authenticated users = only service role can write

-- Seed initial users after creating them in Supabase Auth dashboard:
-- UPDATE user_profiles SET role = 'owner', name = 'Austin Neill' WHERE email = 'austin@eliasrangestays.ca';
-- UPDATE user_profiles SET role = 'owner', name = 'Braden' WHERE email = 'braden@eliasrangestays.ca';
