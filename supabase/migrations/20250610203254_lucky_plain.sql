/*
  # Notifications and User Settings System
  
  1. New Tables
     - `notifications` - Stores user notifications
     - `user_settings` - Stores user preferences including notification settings
  
  2. Functions
     - `create_notification` - Helper function to create notifications
     - `process_deal_mention` - Trigger function for deal mentions
     - `notify_deal_stage_change` - Trigger function for deal stage changes
     - `notify_task_assignment` - Trigger function for task assignments
     
  3. Triggers
     - For deal mentions, stage changes, and task assignments
     
  4. Security
     - RLS policies for notifications and user settings
*/

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  type text NOT NULL CHECK (type IN ('mention', 'deal_update', 'task_assigned', 'email_received', 'ai_suggestion', 'calendar_reminder', 'workflow_triggered')),
  title text NOT NULL,
  message text NOT NULL,
  entity_type text CHECK (entity_type IN ('deal', 'contact', 'task', 'email', 'calendar', 'workflow')),
  entity_id uuid,
  read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- User Settings Table (includes notification preferences)
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  theme text DEFAULT 'dark',
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  notification_preferences jsonb DEFAULT '{
    "email_notifications": true,
    "push_notifications": true,
    "sound_enabled": true,
    "notification_types": {
      "mentions": true,
      "deal_updates": true,
      "task_assignments": true,
      "email_notifications": true,
      "ai_suggestions": true,
      "calendar_reminders": true,
      "workflow_alerts": true
    }
  }'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes (with IF NOT EXISTS to avoid errors)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_type, entity_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
CREATE POLICY "Users can view their own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
CREATE POLICY "Users can insert their own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger for user_settings
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();

-- Create function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id,
    p_metadata
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for deal mentions
CREATE OR REPLACE FUNCTION process_deal_mention()
RETURNS TRIGGER AS $$
BEGIN
  -- If mentions were processed already, skip
  IF NEW.mentions_processed THEN
    RETURN NEW;
  END IF;
  
  -- For each mentioned user, create a notification
  IF NEW.mentioned_users IS NOT NULL AND array_length(NEW.mentioned_users, 1) > 0 THEN
    FOR i IN 1..array_length(NEW.mentioned_users, 1) LOOP
      PERFORM create_notification(
        NEW.mentioned_users[i],
        'mention',
        'You were mentioned in a deal note',
        substring(NEW.content from 1 for 100) || '...',
        'deal',
        NEW.deal_id,
        jsonb_build_object('note_id', NEW.id, 'mentioned_by', NEW.created_by)
      );
    END LOOP;
  END IF;
  
  -- Mark mentions as processed
  NEW.mentions_processed := TRUE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for deal mentions if the table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'deal_notes' AND column_name = 'mentioned_users'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_process_deal_mention ON deal_notes;
    CREATE TRIGGER trigger_process_deal_mention
    BEFORE INSERT OR UPDATE ON deal_notes
    FOR EACH ROW
    WHEN (NEW.mentioned_users IS NOT NULL AND array_length(NEW.mentioned_users, 1) > 0 AND NOT NEW.mentions_processed)
    EXECUTE FUNCTION process_deal_mention();
  END IF;
END $$;

-- Create trigger function for deal stage changes
CREATE OR REPLACE FUNCTION notify_deal_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  v_old_stage_name text;
  v_new_stage_name text;
BEGIN
  -- Only proceed if stage_id changed
  IF OLD.stage_id = NEW.stage_id THEN
    RETURN NEW;
  END IF;
  
  -- Get stage names
  SELECT name INTO v_old_stage_name FROM pipeline_stages WHERE id = OLD.stage_id;
  SELECT name INTO v_new_stage_name FROM pipeline_stages WHERE id = NEW.stage_id;
  
  -- Create notification for deal owner
  IF NEW.owner_id IS NOT NULL THEN
    PERFORM create_notification(
      NEW.owner_id,
      'deal_update',
      'Deal Stage Changed',
      NEW.title || ' moved from ' || v_old_stage_name || ' to ' || v_new_stage_name,
      'deal',
      NEW.id,
      jsonb_build_object(
        'old_stage', v_old_stage_name,
        'new_stage', v_new_stage_name,
        'changed_by', auth.uid()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for deal stage changes if the table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'deals' AND column_name = 'stage_id'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_notify_deal_stage_change ON deals;
    CREATE TRIGGER trigger_notify_deal_stage_change
    AFTER UPDATE OF stage_id ON deals
    FOR EACH ROW
    EXECUTE FUNCTION notify_deal_stage_change();
  END IF;
END $$;

-- Create trigger function for task assignments
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if assigned_to changed or new task
  IF TG_OP = 'UPDATE' AND OLD.assigned_to = NEW.assigned_to THEN
    RETURN NEW;
  END IF;
  
  -- Create notification for assignee
  IF NEW.assigned_to IS NOT NULL THEN
    PERFORM create_notification(
      NEW.assigned_to,
      'task_assigned',
      'Task Assigned',
      NEW.title,
      'task',
      NEW.id,
      jsonb_build_object(
        'due_date', NEW.due_date,
        'priority', NEW.priority,
        'assigned_by', COALESCE(auth.uid(), NEW.created_by)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task assignments if tasks table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') 
  AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
    DROP TRIGGER IF EXISTS trigger_notify_task_assignment ON tasks;
    CREATE TRIGGER trigger_notify_task_assignment
    AFTER INSERT OR UPDATE OF assigned_to ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_task_assignment();
  END IF;
END $$;