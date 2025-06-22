/*
  # Fix RLS Policy Infinite Recursion

  This migration fixes the infinite recursion issue in RLS policies for the profiles table
  by removing problematic policies and creating simpler, non-recursive ones.

  ## Changes Made:
  1. Drop all existing policies on profiles table that might cause recursion
  2. Create new, simplified policies that don't reference profiles within themselves
  3. Ensure policies use direct user ID checks instead of complex joins
*/

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin read" ON profiles;
DROP POLICY IF EXISTS "Allow admin update" ON profiles;
DROP POLICY IF EXISTS "Allow self read" ON profiles;
DROP POLICY IF EXISTS "Allow self update" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Create simple, non-recursive policies for profiles table
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a simple admin policy that doesn't cause recursion
CREATE POLICY "profiles_admin_access" ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'developer_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'developer_admin')
    )
  );

-- Fix contacts policies that might be causing issues
DROP POLICY IF EXISTS "Allow contact owner read" ON contacts;
DROP POLICY IF EXISTS "Allow contact owner update" ON contacts;
DROP POLICY IF EXISTS "Allow contact owner insert" ON contacts;
DROP POLICY IF EXISTS "Allow contact owner delete" ON contacts;
DROP POLICY IF EXISTS "Allow contact read" ON contacts;
DROP POLICY IF EXISTS "Allow contact update" ON contacts;
DROP POLICY IF EXISTS "Allow contact insert" ON contacts;
DROP POLICY IF EXISTS "Allow contact delete" ON contacts;

-- Create simplified contact policies
CREATE POLICY "contacts_owner_access" ON contacts
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = created_by)
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = created_by);

CREATE POLICY "contacts_admin_access" ON contacts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'developer_admin')
    )
  );

-- Fix deals policies that might be causing issues
DROP POLICY IF EXISTS "Allow deal contacts tasks lead scores read" ON deals;
DROP POLICY IF EXISTS "Allow deal delete" ON deals;
DROP POLICY IF EXISTS "Allow deal insert" ON deals;
DROP POLICY IF EXISTS "Allow deal read" ON deals;
DROP POLICY IF EXISTS "Allow deal update" ON deals;

-- Create simplified deals policies
CREATE POLICY "deals_owner_access" ON deals
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = created_by)
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = created_by);

CREATE POLICY "deals_admin_access" ON deals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'developer_admin')
    )
  );

-- Fix tasks policies that might be causing issues
DROP POLICY IF EXISTS "Allow task delete" ON tasks;
DROP POLICY IF EXISTS "Allow task insert" ON tasks;
DROP POLICY IF EXISTS "Allow task read" ON tasks;
DROP POLICY IF EXISTS "Allow task update" ON tasks;

-- Create simplified tasks policies
CREATE POLICY "tasks_owner_access" ON tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = created_by OR auth.uid() = assigned_to)
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "tasks_admin_access" ON tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'developer_admin')
    )
  );

-- Fix lead_scores policies
DROP POLICY IF EXISTS "Allow lead score insert" ON lead_scores;
DROP POLICY IF EXISTS "Allow lead score read" ON lead_scores;

-- Create simplified lead_scores policies
CREATE POLICY "lead_scores_contact_owner_access" ON lead_scores
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts 
      WHERE contacts.id = lead_scores.contact_id 
      AND (contacts.owner_id = auth.uid() OR contacts.created_by = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts 
      WHERE contacts.id = lead_scores.contact_id 
      AND (contacts.owner_id = auth.uid() OR contacts.created_by = auth.uid())
    )
  );

CREATE POLICY "lead_scores_admin_access" ON lead_scores
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'developer_admin')
    )
  );