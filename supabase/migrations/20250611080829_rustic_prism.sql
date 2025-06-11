/*
  # Create tasks table and security policies

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text)
      - `due_date` (date)
      - `due_time` (time)
      - `priority` (text, check constraint)
      - `status` (text, check constraint)
      - `assigned_to` (uuid, references auth.users)
      - `related_deal_id` (uuid, references deals)
      - `related_contact_id` (uuid, references contacts)
      - `is_recurring` (boolean)
      - `recurrence_pattern` (text, check constraint)
      - `recurrence_end_date` (date)
      - `recurrence_custom` (text)
      - `reminder` (boolean)
      - `reminder_time` (integer)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references auth.users)
  
  2. Security
    - Enable RLS on `tasks` table
    - Add policies for CRUD operations
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  due_date date,
  due_time time,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to uuid REFERENCES auth.users(id),
  related_deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  related_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  is_recurring boolean DEFAULT false,
  recurrence_pattern text CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'custom')),
  recurrence_end_date date,
  recurrence_custom text,
  reminder boolean DEFAULT false,
  reminder_time integer, -- minutes before due
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_related_deal_id ON tasks(related_deal_id);
CREATE INDEX idx_tasks_related_contact_id ON tasks(related_contact_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create tasks" 
  ON tasks FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can read tasks they have access to" 
  ON tasks FOR SELECT 
  TO authenticated 
  USING (
    created_by = auth.uid() OR 
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM deals d 
      WHERE d.id = tasks.related_deal_id AND 
      (d.owner_id = auth.uid() OR d.created_by = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM contacts c 
      WHERE c.id = tasks.related_contact_id AND 
      (c.owner_id = auth.uid() OR c.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can update tasks they created or are assigned to" 
  ON tasks FOR UPDATE 
  TO authenticated 
  USING (created_by = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Users can delete tasks they created" 
  ON tasks FOR DELETE 
  TO authenticated 
  USING (created_by = auth.uid());