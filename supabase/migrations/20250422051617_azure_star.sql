/*
  # Initial Schema for Modulern Application

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users.id)
      - `created_at` (timestamp with time zone, default now())
      - `updated_at` (timestamp with time zone, default now())
      - `username` (text, nullable)
      - `email` (text, not null)
    
    - `skills`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `created_at` (timestamp with time zone, default now())
      - `user_id` (uuid, references profiles.id)
      - `skill_name` (text, not null)
      - `experience_level` (text, not null)
      - `current_step` (integer, default 0)
      - `total_steps` (integer, default 0)
      - `completed` (boolean, default false)
    
    - `curricula`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `created_at` (timestamp with time zone, default now())
      - `skill_id` (uuid, references skills.id)
      - `title` (text, not null)
      - `description` (text, not null)
      - `modules` (jsonb, not null)
    
    - `assignments`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `created_at` (timestamp with time zone, default now())
      - `skill_id` (uuid, references skills.id)
      - `module_index` (integer, not null)
      - `step_index` (integer, not null)
      - `title` (text, not null)
      - `description` (text, not null)
      - `completed` (boolean, default false)

  2. Security
    - Enable RLS on all tables
    - Create policies for user-specific data access
    - Create trigger to sync auth users with profiles
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  username TEXT,
  email TEXT NOT NULL
);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  skill_name TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  current_step INTEGER DEFAULT 0 NOT NULL,
  total_steps INTEGER DEFAULT 0 NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL
);

-- Create curricula table
CREATE TABLE IF NOT EXISTS curricula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  modules JSONB NOT NULL
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  module_index INTEGER NOT NULL,
  step_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE curricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for skills
CREATE POLICY "Users can view their own skills"
  ON skills FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own skills"
  ON skills FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own skills"
  ON skills FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own skills"
  ON skills FOR DELETE
  USING (user_id = auth.uid());

-- Create policies for curricula
CREATE POLICY "Users can view curricula for their skills"
  ON curricula FOR SELECT
  USING (skill_id IN (
    SELECT id FROM skills WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create curricula for their skills"
  ON curricula FOR INSERT
  WITH CHECK (skill_id IN (
    SELECT id FROM skills WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update curricula for their skills"
  ON curricula FOR UPDATE
  USING (skill_id IN (
    SELECT id FROM skills WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete curricula for their skills"
  ON curricula FOR DELETE
  USING (skill_id IN (
    SELECT id FROM skills WHERE user_id = auth.uid()
  ));

-- Create policies for assignments
CREATE POLICY "Users can view assignments for their skills"
  ON assignments FOR SELECT
  USING (skill_id IN (
    SELECT id FROM skills WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create assignments for their skills"
  ON assignments FOR INSERT
  WITH CHECK (skill_id IN (
    SELECT id FROM skills WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update assignments for their skills"
  ON assignments FOR UPDATE
  USING (skill_id IN (
    SELECT id FROM skills WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete assignments for their skills"
  ON assignments FOR DELETE
  USING (skill_id IN (
    SELECT id FROM skills WHERE user_id = auth.uid()
  ));

-- Create function to automatically create profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();