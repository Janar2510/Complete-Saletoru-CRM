/*
  # Enhanced Contacts and Companies Schema

  1. Enhanced Tables
    - Enhanced `contacts` table with additional fields
    - Enhanced `companies` table with hierarchy support
    - New `contact_activities` table for timeline tracking
    - New `company_hierarchy` table for parent-child relationships
    - New `contact_duplicates` table for duplicate management
    - New `data_enrichment_logs` table for API tracking

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users

  3. Indexes
    - Performance indexes for search and filtering
    - Full-text search indexes
*/

-- Enhanced contacts table
DO $$
BEGIN
  -- Add new columns to contacts table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'status') THEN
    ALTER TABLE contacts ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect', 'customer'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'last_contacted_at') THEN
    ALTER TABLE contacts ADD COLUMN last_contacted_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'owner_id') THEN
    ALTER TABLE contacts ADD COLUMN owner_id uuid REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'lead_source') THEN
    ALTER TABLE contacts ADD COLUMN lead_source text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_url') THEN
    ALTER TABLE contacts ADD COLUMN linkedin_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'twitter_url') THEN
    ALTER TABLE contacts ADD COLUMN twitter_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'notes') THEN
    ALTER TABLE contacts ADD COLUMN notes text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'country_code') THEN
    ALTER TABLE contacts ADD COLUMN country_code text DEFAULT '+1';
  END IF;
END $$;

-- Enhanced companies table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'annual_revenue') THEN
    ALTER TABLE companies ADD COLUMN annual_revenue numeric(15,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'employee_count') THEN
    ALTER TABLE companies ADD COLUMN employee_count integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'status') THEN
    ALTER TABLE companies ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect', 'customer', 'partner'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'parent_company_id') THEN
    ALTER TABLE companies ADD COLUMN parent_company_id uuid REFERENCES companies(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'founded_year') THEN
    ALTER TABLE companies ADD COLUMN founded_year integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'linkedin_url') THEN
    ALTER TABLE companies ADD COLUMN linkedin_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'twitter_url') THEN
    ALTER TABLE companies ADD COLUMN twitter_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'description') THEN
    ALTER TABLE companies ADD COLUMN description text;
  END IF;
END $$;

-- Contact activities table for timeline tracking
CREATE TABLE IF NOT EXISTS contact_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('email', 'call', 'meeting', 'note', 'task', 'deal_created', 'deal_updated')),
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Company hierarchy table
CREATE TABLE IF NOT EXISTS company_hierarchy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  child_company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  relationship_type text DEFAULT 'subsidiary' CHECK (relationship_type IN ('subsidiary', 'branch', 'division', 'partner')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(parent_company_id, child_company_id)
);

-- Contact duplicates table
CREATE TABLE IF NOT EXISTS contact_duplicates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id_1 uuid REFERENCES contacts(id) ON DELETE CASCADE,
  contact_id_2 uuid REFERENCES contacts(id) ON DELETE CASCADE,
  similarity_score numeric(3,2) DEFAULT 0.0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'merged', 'ignored')),
  merge_decision jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  UNIQUE(contact_id_1, contact_id_2)
);

-- Data enrichment logs
CREATE TABLE IF NOT EXISTS data_enrichment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('contact', 'company')),
  entity_id uuid NOT NULL,
  provider text NOT NULL,
  request_data jsonb DEFAULT '{}',
  response_data jsonb DEFAULT '{}',
  status text DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Contact notes table
CREATE TABLE IF NOT EXISTS contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  content text NOT NULL,
  note_type text DEFAULT 'general' CHECK (note_type IN ('general', 'call', 'email', 'meeting', 'task')),
  mentioned_users uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Company notes table
CREATE TABLE IF NOT EXISTS company_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  content text NOT NULL,
  note_type text DEFAULT 'general' CHECK (note_type IN ('general', 'call', 'email', 'meeting', 'task')),
  mentioned_users uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Contact files table
CREATE TABLE IF NOT EXISTS contact_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint,
  file_type text,
  storage_path text NOT NULL,
  storage_provider text DEFAULT 'supabase' CHECK (storage_provider IN ('supabase', 'google_drive', 'dropbox')),
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Company files table
CREATE TABLE IF NOT EXISTS company_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint,
  file_type text,
  storage_path text NOT NULL,
  storage_provider text DEFAULT 'supabase' CHECK (storage_provider IN ('supabase', 'google_drive', 'dropbox')),
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contact_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_enrichment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read contact activities" ON contact_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create contact activities" ON contact_activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can read company hierarchy" ON company_hierarchy FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage company hierarchy" ON company_hierarchy FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read contact duplicates" ON contact_duplicates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage contact duplicates" ON contact_duplicates FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read enrichment logs" ON data_enrichment_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create enrichment logs" ON data_enrichment_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can read contact notes" ON contact_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create contact notes" ON contact_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can read company notes" ON company_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create company notes" ON company_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can read contact files" ON contact_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage contact files" ON contact_files FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read company files" ON company_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage company files" ON company_files FOR ALL TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_last_contacted ON contacts(last_contacted_at);
CREATE INDEX IF NOT EXISTS idx_contacts_full_name ON contacts(first_name, last_name);

CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_parent ON companies(parent_company_id);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_size ON companies(size);

CREATE INDEX IF NOT EXISTS idx_contact_activities_contact_id ON contact_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_activities_created_at ON contact_activities(created_at);

CREATE INDEX IF NOT EXISTS idx_contact_duplicates_status ON contact_duplicates(status);
CREATE INDEX IF NOT EXISTS idx_contact_duplicates_score ON contact_duplicates(similarity_score);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_contacts_search ON contacts USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(email, '')));
CREATE INDEX IF NOT EXISTS idx_companies_search ON companies USING gin(to_tsvector('english', name || ' ' || COALESCE(industry, '') || ' ' || COALESCE(description, '')));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contact_notes_updated_at BEFORE UPDATE ON contact_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_notes_updated_at BEFORE UPDATE ON company_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();