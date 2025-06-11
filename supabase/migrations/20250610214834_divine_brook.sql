-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  type text NOT NULL CHECK (type IN (
    'deal_assignment', 'task_reminder', 'ai_suggestion', 
    'email_tracking', 'calendar_reminder', 'workflow_update',
    'mention', 'lead_engagement', 'deal_stage_change', 'system'
  )),
  title text NOT NULL,
  content text NOT NULL,
  entity_type text CHECK (entity_type IN (
    'deal', 'contact', 'company', 'task', 'email', 
    'calendar_event', 'workflow', 'system'
  )),
  entity_id uuid,
  action_url text,
  action_text text,
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  delivery_status text DEFAULT 'delivered' CHECK (delivery_status IN ('pending', 'delivered', 'failed', 'retrying')),
  retry_count integer DEFAULT 0
);

-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title_template text NOT NULL,
  content_template text NOT NULL,
  action_url_template text,
  action_text_template text,
  default_priority text DEFAULT 'normal' CHECK (default_priority IN ('low', 'normal', 'high', 'urgent')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create notification_delivery_logs table
CREATE TABLE IF NOT EXISTS notification_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES user_notifications(id),
  delivery_attempt_at timestamptz DEFAULT now(),
  status text NOT NULL CHECK (status IN ('success', 'failure')),
  error_message text,
  metadata jsonb DEFAULT '{}'
);

-- Enhance user_settings table with notification preferences if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_settings') THEN
    -- Check if notification_preferences column exists
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'user_settings' AND column_name = 'notification_preferences') THEN
      -- Add notification_preferences column
      ALTER TABLE user_settings 
      ADD COLUMN notification_preferences jsonb DEFAULT '{
        "email_notifications": true,
        "push_notifications": true,
        "sound_enabled": true,
        "notification_types": {
          "deal_assignment": true,
          "task_reminder": true,
          "ai_suggestion": true,
          "email_tracking": true,
          "calendar_reminder": true,
          "workflow_update": true,
          "mention": true,
          "lead_engagement": true,
          "deal_stage_change": true,
          "system": true
        },
        "quiet_hours": {
          "enabled": false,
          "start": "22:00",
          "end": "08:00",
          "timezone": "UTC"
        },
        "frequency": "realtime"
      }'::jsonb;
    END IF;
  ELSE
    -- Create user_settings table if it doesn't exist
    CREATE TABLE user_settings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
      theme text DEFAULT 'dark',
      timezone text DEFAULT 'UTC',
      language text DEFAULT 'en',
      notification_preferences jsonb DEFAULT '{
        "email_notifications": true,
        "push_notifications": true,
        "sound_enabled": true,
        "notification_types": {
          "deal_assignment": true,
          "task_reminder": true,
          "ai_suggestion": true,
          "email_tracking": true,
          "calendar_reminder": true,
          "workflow_update": true,
          "mention": true,
          "lead_engagement": true,
          "deal_stage_change": true,
          "system": true
        },
        "quiet_hours": {
          "enabled": false,
          "start": "22:00",
          "end": "08:00",
          "timezone": "UTC"
        },
        "frequency": "realtime"
      }'::jsonb,
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz DEFAULT now() NOT NULL
    );
  END IF;
END $$;

-- Create function to check if notification should be delivered based on user preferences
CREATE OR REPLACE FUNCTION should_deliver_notification(
  user_id uuid,
  notification_type text
) RETURNS boolean AS $$
DECLARE
  preferences jsonb;
  quiet_hours_enabled boolean;
  quiet_start time;
  quiet_end time;
  user_timezone text;
  current_user_time time;
BEGIN
  -- Get user preferences
  SELECT notification_preferences INTO preferences
  FROM user_settings
  WHERE user_settings.user_id = user_id;
  
  -- If no preferences found, default to true
  IF preferences IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if notification type is enabled
  IF NOT (preferences->'notification_types'->notification_type)::boolean THEN
    RETURN false;
  END IF;
  
  -- Check quiet hours
  quiet_hours_enabled := (preferences->'quiet_hours'->>'enabled')::boolean;
  
  IF quiet_hours_enabled THEN
    quiet_start := (preferences->'quiet_hours'->>'start')::time;
    quiet_end := (preferences->'quiet_hours'->>'end')::time;
    user_timezone := COALESCE(preferences->'quiet_hours'->>'timezone', 'UTC');
    
    -- Get current time in user's timezone
    current_user_time := (now() AT TIME ZONE user_timezone)::time;
    
    -- Check if current time is within quiet hours
    IF quiet_start < quiet_end THEN
      -- Simple case: quiet hours within same day
      IF current_user_time >= quiet_start AND current_user_time <= quiet_end THEN
        RETURN false;
      END IF;
    ELSE
      -- Complex case: quiet hours span midnight
      IF current_user_time >= quiet_start OR current_user_time <= quiet_end THEN
        RETURN false;
      END IF;
    END IF;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_content text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_action_url text DEFAULT NULL,
  p_action_text text DEFAULT NULL,
  p_priority text DEFAULT 'normal',
  p_metadata jsonb DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
  v_should_deliver boolean;
BEGIN
  -- Check if notification should be delivered based on user preferences
  SELECT should_deliver_notification(p_user_id, p_type) INTO v_should_deliver;
  
  -- If notification should not be delivered, return NULL
  IF NOT v_should_deliver THEN
    RETURN NULL;
  END IF;
  
  -- Create notification
  INSERT INTO user_notifications (
    user_id,
    type,
    title,
    content,
    entity_type,
    entity_id,
    action_url,
    action_text,
    priority,
    metadata,
    delivery_status
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_content,
    p_entity_type,
    p_entity_id,
    p_action_url,
    p_action_text,
    p_priority,
    p_metadata,
    'delivered'
  ) RETURNING id INTO v_notification_id;
  
  -- Log successful delivery
  INSERT INTO notification_delivery_logs (
    notification_id,
    status
  ) VALUES (
    v_notification_id,
    'success'
  );
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id uuid,
  p_is_read boolean DEFAULT true
) RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user_id of notification
  SELECT user_id INTO v_user_id
  FROM user_notifications
  WHERE id = p_notification_id;
  
  -- Check if user is authorized to update this notification
  IF v_user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  -- Update notification
  UPDATE user_notifications
  SET is_read = p_is_read
  WHERE id = p_notification_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(
  p_user_id uuid DEFAULT NULL
) RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  -- Default to current user if not specified
  p_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Check if user is authorized
  IF p_user_id != auth.uid() THEN
    RETURN 0;
  END IF;
  
  -- Update notifications
  UPDATE user_notifications
  SET is_read = true
  WHERE user_id = p_user_id AND is_read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to dismiss notification
CREATE OR REPLACE FUNCTION dismiss_notification(
  p_notification_id uuid
) RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user_id of notification
  SELECT user_id INTO v_user_id
  FROM user_notifications
  WHERE id = p_notification_id;
  
  -- Check if user is authorized to update this notification
  IF v_user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  -- Update notification
  UPDATE user_notifications
  SET is_dismissed = true
  WHERE id = p_notification_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to dismiss all notifications
CREATE OR REPLACE FUNCTION dismiss_all_notifications(
  p_user_id uuid DEFAULT NULL
) RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  -- Default to current user if not specified
  p_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Check if user is authorized
  IF p_user_id != auth.uid() THEN
    RETURN 0;
  END IF;
  
  -- Update notifications
  UPDATE user_notifications
  SET is_dismissed = true
  WHERE user_id = p_user_id AND is_dismissed = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for deal assignments
CREATE OR REPLACE FUNCTION notify_deal_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if owner_id changed or new deal
  IF TG_OP = 'UPDATE' AND OLD.owner_id = NEW.owner_id THEN
    RETURN NEW;
  END IF;
  
  -- Create notification for new owner
  IF NEW.owner_id IS NOT NULL THEN
    PERFORM create_notification(
      NEW.owner_id,
      'deal_assignment',
      'Deal Assigned to You',
      'You have been assigned to the deal: ' || NEW.title,
      'deal',
      NEW.id,
      '/deals?id=' || NEW.id,
      'View Deal',
      'normal',
      jsonb_build_object(
        'deal_id', NEW.id,
        'deal_title', NEW.title,
        'deal_value', NEW.value,
        'assigned_by', COALESCE(auth.uid(), NEW.created_by)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for deal assignments
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'deals' AND column_name = 'owner_id'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_notify_deal_assignment ON deals;
    CREATE TRIGGER trigger_notify_deal_assignment
    AFTER INSERT OR UPDATE OF owner_id ON deals
    FOR EACH ROW
    EXECUTE FUNCTION notify_deal_assignment();
  END IF;
END $$;

-- Create trigger function for deal stage changes
CREATE OR REPLACE FUNCTION notify_deal_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  v_old_stage_name text;
  v_new_stage_name text;
  v_stakeholders uuid[];
BEGIN
  -- Only proceed if stage_id changed
  IF OLD.stage_id = NEW.stage_id THEN
    RETURN NEW;
  END IF;
  
  -- Get stage names
  SELECT name INTO v_old_stage_name FROM pipeline_stages WHERE id = OLD.stage_id;
  SELECT name INTO v_new_stage_name FROM pipeline_stages WHERE id = NEW.stage_id;
  
  -- Get stakeholders (owner, creator, and any team members with access)
  v_stakeholders := ARRAY[NEW.owner_id, NEW.created_by];
  
  -- Notify each stakeholder
  FOR i IN 1..array_length(v_stakeholders, 1) LOOP
    IF v_stakeholders[i] IS NOT NULL THEN
      PERFORM create_notification(
        v_stakeholders[i],
        'deal_stage_change',
        'Deal Stage Changed: ' || NEW.title,
        'Deal moved from ' || v_old_stage_name || ' to ' || v_new_stage_name,
        'deal',
        NEW.id,
        '/deals?id=' || NEW.id,
        'View Deal',
        CASE
          WHEN NEW.value > 50000 THEN 'high'
          WHEN NEW.value > 10000 THEN 'normal'
          ELSE 'low'
        END,
        jsonb_build_object(
          'deal_id', NEW.id,
          'deal_title', NEW.title,
          'deal_value', NEW.value,
          'old_stage', v_old_stage_name,
          'new_stage', v_new_stage_name,
          'changed_by', auth.uid()
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for deal stage changes
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

-- Create trigger function for task reminders
CREATE OR REPLACE FUNCTION notify_task_due_soon()
RETURNS TRIGGER AS $$
DECLARE
  v_due_date date;
  v_now date;
  v_days_until_due integer;
BEGIN
  -- Only proceed if due_date is set and changed
  IF NEW.due_date IS NULL OR (TG_OP = 'UPDATE' AND OLD.due_date = NEW.due_date) THEN
    RETURN NEW;
  END IF;
  
  v_due_date := NEW.due_date::date;
  v_now := current_date;
  v_days_until_due := v_due_date - v_now;
  
  -- Create notification if due date is today or tomorrow
  IF v_days_until_due BETWEEN 0 AND 1 THEN
    PERFORM create_notification(
      NEW.assigned_to,
      'task_reminder',
      'Task Due ' || CASE WHEN v_days_until_due = 0 THEN 'Today' ELSE 'Tomorrow' END,
      NEW.title,
      'task',
      NEW.id,
      '/tasks?id=' || NEW.id,
      'View Task',
      CASE
        WHEN v_days_until_due = 0 THEN 'urgent'
        ELSE 'high'
      END,
      jsonb_build_object(
        'task_id', NEW.id,
        'task_title', NEW.title,
        'due_date', NEW.due_date,
        'days_until_due', v_days_until_due
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task reminders if tasks table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') 
  AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'due_date') THEN
    DROP TRIGGER IF EXISTS trigger_notify_task_due_soon ON tasks;
    CREATE TRIGGER trigger_notify_task_due_soon
    AFTER INSERT OR UPDATE OF due_date ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_task_due_soon();
  END IF;
END $$;

-- Create trigger function for email tracking notifications
CREATE OR REPLACE FUNCTION notify_email_tracking_event()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_notification_type text;
  v_title text;
  v_content text;
BEGIN
  -- Only proceed if status changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get user who sent the email
  v_user_id := NEW.created_by;
  
  -- Set notification details based on status
  CASE NEW.status
    WHEN 'opened' THEN
      v_notification_type := 'email_tracking';
      v_title := 'Email Opened';
      v_content := 'Your email "' || NEW.subject || '" was opened.';
    WHEN 'clicked' THEN
      v_notification_type := 'email_tracking';
      v_title := 'Email Link Clicked';
      v_content := 'A link in your email "' || NEW.subject || '" was clicked.';
    WHEN 'replied' THEN
      v_notification_type := 'email_tracking';
      v_title := 'Email Replied';
      v_content := 'Your email "' || NEW.subject || '" received a reply.';
    ELSE
      -- No notification for other statuses
      RETURN NEW;
  END CASE;
  
  -- Create notification
  IF v_user_id IS NOT NULL THEN
    PERFORM create_notification(
      v_user_id,
      v_notification_type,
      v_title,
      v_content,
      'email',
      NEW.id,
      CASE
        WHEN NEW.thread_id IS NOT NULL THEN '/emails?thread=' || NEW.thread_id
        ELSE NULL
      END,
      'View Email',
      'normal',
      jsonb_build_object(
        'email_id', NEW.id,
        'subject', NEW.subject,
        'status', NEW.status,
        'contact_id', NEW.contact_id,
        'deal_id', NEW.deal_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email tracking notifications
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_tracking') THEN
    DROP TRIGGER IF EXISTS trigger_notify_email_tracking_event ON email_tracking;
    CREATE TRIGGER trigger_notify_email_tracking_event
    AFTER UPDATE OF status ON email_tracking
    FOR EACH ROW
    EXECUTE FUNCTION notify_email_tracking_event();
  END IF;
END $$;

-- Create trigger function for lead engagement alerts
CREATE OR REPLACE FUNCTION notify_lead_engagement_gap()
RETURNS TRIGGER AS $$
DECLARE
  v_days_since_interaction integer;
  v_owner_id uuid;
BEGIN
  -- Only proceed if lead_score is high enough (worth monitoring)
  IF (NEW.lead_score IS NULL OR NEW.lead_score < 50) THEN
    RETURN NEW;
  END IF;
  
  -- Check if last_interaction_at is set
  IF NEW.last_interaction_at IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate days since last interaction
  v_days_since_interaction := EXTRACT(DAY FROM (now() - NEW.last_interaction_at));
  
  -- Only notify if gap is 10+ days
  IF v_days_since_interaction < 10 THEN
    RETURN NEW;
  END IF;
  
  -- Get owner
  v_owner_id := NEW.owner_id;
  
  -- If no owner, use creator
  IF v_owner_id IS NULL THEN
    v_owner_id := NEW.created_by;
  END IF;
  
  -- Create notification
  IF v_owner_id IS NOT NULL THEN
    PERFORM create_notification(
      v_owner_id,
      'lead_engagement',
      'Lead Engagement Gap',
      'No interaction with ' || NEW.first_name || ' ' || NEW.last_name || ' for ' || v_days_since_interaction || ' days',
      'contact',
      NEW.id,
      '/contacts?id=' || NEW.id,
      'View Contact',
      CASE
        WHEN v_days_since_interaction > 30 THEN 'high'
        WHEN v_days_since_interaction > 20 THEN 'normal'
        ELSE 'low'
      END,
      jsonb_build_object(
        'contact_id', NEW.id,
        'contact_name', NEW.first_name || ' ' || NEW.last_name,
        'lead_score', NEW.lead_score,
        'days_since_interaction', v_days_since_interaction
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for lead engagement alerts
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'lead_score'
  ) AND EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'last_interaction_at'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_notify_lead_engagement_gap ON contacts;
    CREATE TRIGGER trigger_notify_lead_engagement_gap
    AFTER UPDATE OF lead_score, last_interaction_at ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION notify_lead_engagement_gap();
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_dismissed ON user_notifications(is_dismissed);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_entity ON user_notifications(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_priority ON user_notifications(priority);

CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_notification_id ON notification_delivery_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_status ON notification_delivery_logs(status);

-- Enable RLS on new tables
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_notifications
CREATE POLICY "Users can view their own notifications"
  ON user_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON user_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for notification_templates
CREATE POLICY "Users can view notification templates"
  ON notification_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage notification templates"
  ON notification_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'role' = 'admin' OR
        auth.users.raw_user_meta_data->>'role' = 'developer_admin'
      )
    )
  );

-- RLS Policies for notification_delivery_logs
CREATE POLICY "Users can view their own notification delivery logs"
  ON notification_delivery_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_notifications
      WHERE user_notifications.id = notification_delivery_logs.notification_id
      AND user_notifications.user_id = auth.uid()
    )
  );

-- Insert default notification templates
INSERT INTO notification_templates (type, title_template, content_template, action_url_template, action_text_template, default_priority)
VALUES
  ('deal_assignment', 'Deal Assigned: {{deal_title}}', 'You have been assigned to the deal {{deal_title}} worth {{deal_value}}', '/deals?id={{deal_id}}', 'View Deal', 'normal'),
  ('task_reminder', 'Task Due {{due_text}}: {{task_title}}', 'Your task "{{task_title}}" is due {{due_text}}', '/tasks?id={{task_id}}', 'View Task', 'high'),
  ('ai_suggestion', '{{suggestion_title}}', '{{suggestion_content}}', '{{suggestion_url}}', '{{suggestion_action}}', 'normal'),
  ('email_tracking', 'Email {{tracking_event}}: {{email_subject}}', 'Your email "{{email_subject}}" was {{tracking_event_past}}', '/emails?thread={{thread_id}}', 'View Email', 'normal'),
  ('calendar_reminder', 'Upcoming: {{event_title}}', 'Your event "{{event_title}}" starts in {{time_until}} minutes', '/calendar?event={{event_id}}', 'View Event', 'high'),
  ('workflow_update', 'Workflow: {{workflow_title}}', '{{workflow_message}}', '/workflows?id={{workflow_id}}', 'View Workflow', 'normal'),
  ('mention', 'Mentioned in {{entity_type}}: {{entity_title}}', '{{mentioned_by}} mentioned you in {{entity_type}}: "{{mention_content}}"', '{{entity_url}}', 'View {{entity_type}}', 'normal'),
  ('lead_engagement', 'Lead Engagement Gap: {{contact_name}}', 'No interaction with {{contact_name}} for {{days}} days', '/contacts?id={{contact_id}}', 'View Contact', 'normal'),
  ('deal_stage_change', 'Deal Stage Changed: {{deal_title}}', 'Deal "{{deal_title}}" moved from {{old_stage}} to {{new_stage}}', '/deals?id={{deal_id}}', 'View Deal', 'normal'),
  ('system', 'System: {{title}}', '{{content}}', '{{action_url}}', '{{action_text}}', 'normal')
ON CONFLICT DO NOTHING;