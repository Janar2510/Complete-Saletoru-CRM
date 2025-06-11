/*
  # Create Offers and Email Templates Tables

  1. New Tables
    - `offers`
      - `id` (uuid, primary key)
      - `offer_id` (text, unique, auto-generated)
      - `title` (text, required)
      - `description` (text, optional)
      - `contact_id` (uuid, foreign key to contacts)
      - `deal_id` (uuid, foreign key to deals, optional)
      - `status` (enum: draft, sent, viewed, accepted, declined, expired)
      - `sent_at` (timestamp, optional)
      - `viewed_at` (timestamp, optional)
      - `responded_at` (timestamp, optional)
      - `expires_at` (timestamp, optional)
      - `tracking_id` (text, unique, optional)
      - `metadata` (jsonb, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, foreign key to users)

    - `offer_files`
      - `id` (uuid, primary key)
      - `offer_id` (uuid, foreign key to offers)
      - `file_name` (text, required)
      - `file_size` (bigint, optional)
      - `file_type` (text, optional)
      - `storage_path` (text, required)
      - `storage_provider` (enum: supabase, google_drive, dropbox)
      - `uploaded_by` (uuid, foreign key to users)
      - `created_at` (timestamp)

    - `offer_activities`
      - `id` (uuid, primary key)
      - `offer_id` (uuid, foreign key to offers)
      - `activity_type` (enum: created, sent, viewed, downloaded, accepted, declined, expired)
      - `description` (text, required)
      - `metadata` (jsonb, optional)
      - `ip_address` (text, optional)
      - `user_agent` (text, optional)
      - `created_at` (timestamp)
      - `created_by` (uuid, foreign key to users, optional)

    - `email_templates`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `subject` (text, required)
      - `content` (text, required)
      - `category` (text, required)
      - `tags` (text array, optional)
      - `variables` (text array, optional)
      - `is_active` (boolean, default true)
      - `usage_count` (integer, default 0)
      - `last_used_at` (timestamp, optional)
      - `version` (integer, default 1)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, foreign key to users)

    - `email_template_versions`
      - `id` (uuid, primary key)
      - `template_id` (uuid, foreign key to email_templates)
      - `version` (integer, required)
      - `subject` (text, required)
      - `content` (text, required)
      - `changes_summary` (text, optional)
      - `created_at` (timestamp)
      - `created_by` (uuid, foreign key to users)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for viewing offers via tracking links

  3. Functions
    - Auto-generate offer IDs
    - Update timestamps automatically
*/

-- Create offer_id generation function
CREATE OR REPLACE FUNCTION generate_offer_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  counter INTEGER;
BEGIN
  -- Get current date in YYYYMMDD format
  SELECT TO_CHAR(NOW(), 'YYYYMMDD') INTO new_id;
  
  -- Get count of offers created today
  SELECT COUNT(*) + 1 INTO counter
  FROM offers 
  WHERE offer_id LIKE new_id || '%';
  
  -- Format: OFFER-YYYYMMDD-XXXX
  new_id := 'OFFER-' || new_id || '-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id text UNIQUE NOT NULL DEFAULT generate_offer_id(),
  title text NOT NULL,
  description text,
  contact_id uuid REFERENCES contacts(id),
  deal_id uuid REFERENCES deals(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired')),
  sent_at timestamptz,
  viewed_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz,
  tracking_id text UNIQUE,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create offer_files table
CREATE TABLE IF NOT EXISTS offer_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES offers(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint,
  file_type text,
  storage_path text NOT NULL,
  storage_provider text DEFAULT 'supabase' CHECK (storage_provider IN ('supabase', 'google_drive', 'dropbox')),
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create offer_activities table
CREATE TABLE IF NOT EXISTS offer_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES offers(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('created', 'sent', 'viewed', 'downloaded', 'accepted', 'declined', 'expired')),
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  variables text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create email_template_versions table
CREATE TABLE IF NOT EXISTS email_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES email_templates(id) ON DELETE CASCADE,
  version integer NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  changes_summary text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_offers_contact_id ON offers(contact_id);
CREATE INDEX IF NOT EXISTS idx_offers_deal_id ON offers(deal_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON offers(created_at);
CREATE INDEX IF NOT EXISTS idx_offers_tracking_id ON offers(tracking_id);

CREATE INDEX IF NOT EXISTS idx_offer_files_offer_id ON offer_files(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_activities_offer_id ON offer_activities(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_activities_created_at ON offer_activities(created_at);

CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_usage_count ON email_templates(usage_count);

CREATE INDEX IF NOT EXISTS idx_email_template_versions_template_id ON email_template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_email_template_versions_version ON email_template_versions(template_id, version);

-- Enable Row Level Security
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for offers
CREATE POLICY "Users can create offers" ON offers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can read offers they created" ON offers
  FOR SELECT TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can update offers they created" ON offers
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete offers they created" ON offers
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- Special policy for public offer viewing via tracking ID
CREATE POLICY "Public can view offers via tracking ID" ON offers
  FOR SELECT TO anon
  USING (tracking_id IS NOT NULL);

-- Create RLS policies for offer_files
CREATE POLICY "Users can manage offer files for their offers" ON offer_files
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM offers 
      WHERE offers.id = offer_files.offer_id 
      AND offers.created_by = auth.uid()
    )
  );

-- Create RLS policies for offer_activities
CREATE POLICY "Users can read activities for their offers" ON offer_activities
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM offers 
      WHERE offers.id = offer_activities.offer_id 
      AND offers.created_by = auth.uid()
    )
  );

CREATE POLICY "System can create offer activities" ON offer_activities
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow anonymous users to create activities for tracking
CREATE POLICY "Anonymous can create tracking activities" ON offer_activities
  FOR INSERT TO anon
  WITH CHECK (
    activity_type IN ('viewed', 'downloaded') AND
    EXISTS (
      SELECT 1 FROM offers 
      WHERE offers.id = offer_activities.offer_id 
      AND offers.tracking_id IS NOT NULL
    )
  );

-- Create RLS policies for email_templates
CREATE POLICY "Users can create email templates" ON email_templates
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can read all email templates" ON email_templates
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update their email templates" ON email_templates
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their email templates" ON email_templates
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- Create RLS policies for email_template_versions
CREATE POLICY "Users can manage template versions for their templates" ON email_template_versions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_templates 
      WHERE email_templates.id = email_template_versions.template_id 
      AND email_templates.created_by = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to set offer_id before insert
CREATE OR REPLACE FUNCTION set_offer_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.offer_id IS NULL OR NEW.offer_id = '' THEN
    NEW.offer_id := generate_offer_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_offer_id
  BEFORE INSERT ON offers
  FOR EACH ROW
  EXECUTE FUNCTION set_offer_id();