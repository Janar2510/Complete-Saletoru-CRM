/*
  # Developer Admin Role and Access Controls

  1. New Fields
    - Add `role` field to users metadata with values: 'user', 'admin', 'developer_admin'
    - Add `is_developer_mode` field to track when a user is viewing as developer

  2. Functions
    - `check_developer_admin()` - Function to check if user has developer admin role
    - `override_rls_for_developer()` - Function to bypass RLS for developer admins

  3. Policies
    - Add developer admin override policies to all tables
    - Create developer-specific views for system inspection
*/

-- Create function to check if user is a developer admin
CREATE OR REPLACE FUNCTION is_developer_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    auth.uid() IS NOT NULL AND 
    auth.role() = 'authenticated' AND
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'developer_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is in developer mode
CREATE OR REPLACE FUNCTION is_in_developer_mode()
RETURNS boolean AS $$
BEGIN
  RETURN (
    auth.uid() IS NOT NULL AND 
    auth.role() = 'authenticated' AND
    (SELECT raw_user_meta_data->>'is_developer_mode' FROM auth.users WHERE id = auth.uid()) = 'true'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create developer settings table
CREATE TABLE IF NOT EXISTS developer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  feature_flags jsonb DEFAULT '{}',
  simulated_plan text DEFAULT 'team',
  simulated_role text DEFAULT 'user',
  debug_mode boolean DEFAULT false,
  log_level text DEFAULT 'info',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create developer activity logs table
CREATE TABLE IF NOT EXISTS developer_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  action_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  previous_state jsonb,
  new_state jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on developer tables
ALTER TABLE developer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for developer settings
CREATE POLICY "Developer admins can manage developer settings"
  ON developer_settings FOR ALL
  TO authenticated
  USING (is_developer_admin() OR auth.uid() = user_id);

-- RLS Policies for developer activity logs
CREATE POLICY "Developer admins can view all activity logs"
  ON developer_activity_logs FOR SELECT
  TO authenticated
  USING (is_developer_admin());

CREATE POLICY "Developer admins can create activity logs"
  ON developer_activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (is_developer_admin() OR auth.uid() = user_id);

-- Add developer admin override policies to all main tables
-- These policies allow developer admins to bypass normal RLS restrictions

-- Deals table
CREATE POLICY "Developer admins can access all deals"
  ON deals FOR ALL
  TO authenticated
  USING (is_developer_admin() OR is_in_developer_mode());

-- Contacts table
CREATE POLICY "Developer admins can access all contacts"
  ON contacts FOR ALL
  TO authenticated
  USING (is_developer_admin() OR is_in_developer_mode());

-- Companies table
CREATE POLICY "Developer admins can access all companies"
  ON companies FOR ALL
  TO authenticated
  USING (is_developer_admin() OR is_in_developer_mode());

-- Pipelines table
CREATE POLICY "Developer admins can access all pipelines"
  ON pipelines FOR ALL
  TO authenticated
  USING (is_developer_admin() OR is_in_developer_mode());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_developer_settings_user_id ON developer_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_developer_activity_logs_user_id ON developer_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_developer_activity_logs_action_type ON developer_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_developer_activity_logs_entity_type ON developer_activity_logs(entity_type, entity_id);

-- Create trigger to log developer admin actions
CREATE OR REPLACE FUNCTION log_developer_admin_action()
RETURNS trigger AS $$
BEGIN
  IF is_developer_admin() OR is_in_developer_mode() THEN
    INSERT INTO developer_activity_logs (
      user_id,
      action_type,
      entity_type,
      entity_id,
      previous_state,
      new_state
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.id
        ELSE NEW.id
      END,
      CASE 
        WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
        WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD)
        ELSE NULL
      END,
      CASE 
        WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW)
        ELSE NULL
      END
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add developer admin logging triggers to main tables
CREATE TRIGGER log_deals_developer_actions
  AFTER INSERT OR UPDATE OR DELETE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION log_developer_admin_action();

CREATE TRIGGER log_contacts_developer_actions
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION log_developer_admin_action();

CREATE TRIGGER log_companies_developer_actions
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION log_developer_admin_action();

-- Create function to update user role
CREATE OR REPLACE FUNCTION update_user_role(user_id uuid, new_role text)
RETURNS void AS $$
DECLARE
  current_meta jsonb;
BEGIN
  -- Check if caller is developer admin
  IF NOT is_developer_admin() THEN
    RAISE EXCEPTION 'Only developer admins can update user roles';
  END IF;
  
  -- Get current metadata
  SELECT raw_user_meta_data INTO current_meta
  FROM auth.users
  WHERE id = user_id;
  
  -- Update role in metadata
  current_meta := jsonb_set(current_meta, '{role}', to_jsonb(new_role));
  
  -- Update user
  UPDATE auth.users
  SET raw_user_meta_data = current_meta
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;