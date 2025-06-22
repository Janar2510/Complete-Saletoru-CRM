/*
  # Fix RLS Policy Infinite Recursion

  1. Problem
    - Infinite recursion detected in policy for relation "profiles"
    - Circular dependencies between deals, contacts, and profiles policies
    - Cross-table policy checks creating recursive loops

  2. Solution
    - Simplify RLS policies to remove circular dependencies
    - Use direct user ID checks instead of complex joins
    - Remove policies that reference other tables with their own RLS policies
    - Ensure policies are self-contained and don't create loops

  3. Changes
    - Update deals policies to use direct user checks
    - Update contacts policies to use direct user checks
    - Simplify profiles policies
    - Remove circular references between tables
*/

-- First, drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "deals_admin_access" ON deals;
DROP POLICY IF EXISTS "deals_owner_access" ON deals;
DROP POLICY IF EXISTS "contacts_admin_access" ON contacts;
DROP POLICY IF EXISTS "contacts_owner_access" ON contacts;
DROP POLICY IF EXISTS "profiles_admin_access" ON profiles;
DROP POLICY IF EXISTS "tasks_admin_access" ON tasks;
DROP POLICY IF EXISTS "tasks_owner_access" ON tasks;

-- Simplify profiles policies to avoid recursion
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "profiles_own_access"
  ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create simple, non-recursive policies for deals
CREATE POLICY "deals_user_access"
  ON deals
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = owner_id OR 
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.raw_user_meta_data ->> 'role') = 'admin' OR
        (auth.users.raw_user_meta_data ->> 'role') = 'developer_admin'
      )
    )
  )
  WITH CHECK (
    auth.uid() = owner_id OR 
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.raw_user_meta_data ->> 'role') = 'admin' OR
        (auth.users.raw_user_meta_data ->> 'role') = 'developer_admin'
      )
    )
  );

-- Create simple, non-recursive policies for contacts
CREATE POLICY "contacts_user_access"
  ON contacts
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = owner_id OR 
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.raw_user_meta_data ->> 'role') = 'admin' OR
        (auth.users.raw_user_meta_data ->> 'role') = 'developer_admin'
      )
    )
  )
  WITH CHECK (
    auth.uid() = owner_id OR 
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.raw_user_meta_data ->> 'role') = 'admin' OR
        (auth.users.raw_user_meta_data ->> 'role') = 'developer_admin'
      )
    )
  );

-- Create simple, non-recursive policies for companies
DROP POLICY IF EXISTS "companies_user_access" ON companies;
CREATE POLICY "companies_user_access"
  ON companies
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.raw_user_meta_data ->> 'role') = 'admin' OR
        (auth.users.raw_user_meta_data ->> 'role') = 'developer_admin'
      )
    )
  )
  WITH CHECK (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.raw_user_meta_data ->> 'role') = 'admin' OR
        (auth.users.raw_user_meta_data ->> 'role') = 'developer_admin'
      )
    )
  );

-- Create simple, non-recursive policies for tasks
CREATE POLICY "tasks_user_access"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = assigned_to OR 
    auth.uid() = created_by OR
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.raw_user_meta_data ->> 'role') = 'admin' OR
        (auth.users.raw_user_meta_data ->> 'role') = 'developer_admin'
      )
    )
  )
  WITH CHECK (
    auth.uid() = assigned_to OR 
    auth.uid() = created_by OR
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.raw_user_meta_data ->> 'role') = 'admin' OR
        (auth.users.raw_user_meta_data ->> 'role') = 'developer_admin'
      )
    )
  );

-- Remove any remaining problematic policies that might reference profiles
DROP POLICY IF EXISTS "Developer admins can access all contacts" ON contacts;
DROP POLICY IF EXISTS "Developer admins can access all companies" ON companies;
DROP POLICY IF EXISTS "Developer admins can access all deals" ON deals;

-- Ensure pipeline and stage access is simple
DROP POLICY IF EXISTS "Admins can manage pipelines" ON pipelines;
DROP POLICY IF EXISTS "Admins can manage stages" ON stages;

CREATE POLICY "pipelines_access"
  ON pipelines
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "stages_access"
  ON pipeline_stages
  FOR ALL
  TO authenticated
  USING (true);

-- Ensure other related tables have simple policies
CREATE POLICY "deal_activities_access"
  ON deal_activities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_activities.deal_id 
      AND (deals.owner_id = auth.uid() OR deals.created_by = auth.uid())
    )
  );

CREATE POLICY "deal_notes_access"
  ON deal_notes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_notes.deal_id 
      AND (deals.owner_id = auth.uid() OR deals.created_by = auth.uid())
    )
  )
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_notes.deal_id 
      AND (deals.owner_id = auth.uid() OR deals.created_by = auth.uid())
    )
  );

CREATE POLICY "contact_activities_access"
  ON contact_activities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts 
      WHERE contacts.id = contact_activities.contact_id 
      AND (contacts.owner_id = auth.uid() OR contacts.created_by = auth.uid())
    )
  )
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "contact_notes_access"
  ON contact_notes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts 
      WHERE contacts.id = contact_notes.contact_id 
      AND (contacts.owner_id = auth.uid() OR contacts.created_by = auth.uid())
    )
  )
  WITH CHECK (auth.uid() = created_by);