/*
  # Cloud Storage Integration for Deals

  1. Tables
    - Ensure cloud_storage_connections table exists
    - Ensure deal_folders table exists
    - Add cloud sync fields to deal_files table

  2. Functions and Triggers
    - Create function to handle cloud folder creation
    - Create function to process file uploads
    - Add triggers only if they don't already exist

  3. Security
    - Enable RLS on tables
    - Add appropriate policies
*/

-- Ensure cloud_storage_connections table exists
CREATE TABLE IF NOT EXISTS cloud_storage_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  provider text NOT NULL CHECK (provider IN ('google_drive', 'onedrive', 'dropbox', 'box')),
  provider_user_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_active boolean DEFAULT true,
  scopes text[] DEFAULT '{}',
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure deal_folders table exists
CREATE TABLE IF NOT EXISTS deal_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
  storage_connection_id uuid REFERENCES cloud_storage_connections(id),
  folder_name text NOT NULL,
  folder_id text NOT NULL, -- External folder ID from cloud provider
  folder_path text,
  folder_url text,
  sync_enabled boolean DEFAULT true,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enhance deal_files table with cloud sync fields
DO $$
BEGIN
  -- Add cloud sync fields if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_files' AND column_name = 'cloud_sync_status') THEN
    ALTER TABLE deal_files ADD COLUMN cloud_sync_status text DEFAULT 'not_synced' CHECK (cloud_sync_status IN ('not_synced', 'syncing', 'synced', 'failed'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_files' AND column_name = 'cloud_file_id') THEN
    ALTER TABLE deal_files ADD COLUMN cloud_file_id text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_files' AND column_name = 'cloud_file_url') THEN
    ALTER TABLE deal_files ADD COLUMN cloud_file_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_files' AND column_name = 'category') THEN
    ALTER TABLE deal_files ADD COLUMN category text DEFAULT 'other' CHECK (category IN ('contract', 'proposal', 'invoice', 'presentation', 'image', 'pdf', 'spreadsheet', 'document', 'other'));
  END IF;
END $$;

-- Function to create cloud folder for new deals
CREATE OR REPLACE FUNCTION create_deal_cloud_folder()
RETURNS trigger AS $$
DECLARE
  connection_record cloud_storage_connections%ROWTYPE;
  folder_name text;
BEGIN
  -- Only proceed if there's an active cloud connection for the deal owner
  SELECT * INTO connection_record
  FROM cloud_storage_connections
  WHERE user_id = NEW.owner_id
  AND is_active = true
  LIMIT 1;
  
  IF connection_record.id IS NOT NULL THEN
    -- Create folder name using deal ID
    folder_name := 'Deal - ' || NEW.deal_id || ' - ' || NEW.title;
    
    -- Insert placeholder record - actual folder creation happens in application code
    INSERT INTO deal_folders (
      deal_id,
      storage_connection_id,
      folder_name,
      folder_id,
      folder_path,
      sync_enabled,
      created_by
    ) VALUES (
      NEW.id,
      connection_record.id,
      folder_name,
      'pending', -- Will be updated by application code
      '/SaleToru CRM/Deals/' || folder_name,
      true,
      NEW.created_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create cloud folder ONLY if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_create_deal_cloud_folder'
    AND tgrelid = 'deals'::regclass
  ) THEN
    CREATE TRIGGER trigger_create_deal_cloud_folder
      AFTER INSERT ON deals
      FOR EACH ROW
      EXECUTE FUNCTION create_deal_cloud_folder();
  END IF;
END $$;

-- Function to process file uploads and sync to cloud storage
CREATE OR REPLACE FUNCTION process_file_upload()
RETURNS trigger AS $$
DECLARE
  folder_exists boolean;
BEGIN
  -- Check if there's a cloud folder for this deal
  SELECT EXISTS (
    SELECT 1 FROM deal_folders
    WHERE deal_id = NEW.deal_id
    AND sync_enabled = true
  ) INTO folder_exists;
  
  -- Set initial cloud sync status
  IF folder_exists THEN
    NEW.cloud_sync_status := 'syncing';
  ELSE
    NEW.cloud_sync_status := 'not_synced';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to process file uploads ONLY if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_process_file_upload'
    AND tgrelid = 'deal_files'::regclass
  ) THEN
    CREATE TRIGGER trigger_process_file_upload
      BEFORE INSERT ON deal_files
      FOR EACH ROW
      EXECUTE FUNCTION process_file_upload();
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE cloud_storage_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cloud_storage_connections
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own cloud storage connections" ON cloud_storage_connections;

-- Create new policies
CREATE POLICY "Users can manage their own cloud storage connections"
  ON cloud_storage_connections FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for deal_folders
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can read deal folders they have access to" ON deal_folders;
DROP POLICY IF EXISTS "Users can create deal folders" ON deal_folders;

-- Create new policies
CREATE POLICY "Users can read deal folders they have access to"
  ON deal_folders FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM deals d 
      WHERE d.id = deal_folders.deal_id 
      AND (d.owner_id = auth.uid() OR d.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can create deal folders"
  ON deal_folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_cloud_storage_connections_user_id ON cloud_storage_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_storage_connections_provider ON cloud_storage_connections(provider);
CREATE INDEX IF NOT EXISTS idx_deal_folders_deal_id ON deal_folders(deal_id);