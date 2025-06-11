/*
  # Import/Export and Bulk Actions Schema

  1. New Tables
    - `import_logs` - Tracks CSV import history and results
  
  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Import Logs Table
CREATE TABLE IF NOT EXISTS import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  type text NOT NULL CHECK (type IN ('contacts', 'companies', 'deals')),
  file_name text NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  success_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  errors jsonb,
  mapping jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX idx_import_logs_user_id ON import_logs(user_id);
CREATE INDEX idx_import_logs_type ON import_logs(type);
CREATE INDEX idx_import_logs_created_at ON import_logs(created_at);

-- Enable RLS
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own import logs"
  ON import_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create import logs"
  ON import_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);