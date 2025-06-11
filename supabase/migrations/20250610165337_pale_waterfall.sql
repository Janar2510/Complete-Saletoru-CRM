/*
  # Calendar Integration for SaleToruGuru

  1. New Tables
    - `calendar_events` - Stores all calendar events
    - `calendar_attendees` - Stores attendees for calendar events
    - `calendar_integrations` - Manages connections to external calendar providers
    - `calendar_settings` - User-specific calendar settings and preferences
  
  2. Security
    - Enable RLS on all calendar tables
    - Add policies for authenticated users to manage their own data
    - Add policies for shared calendar visibility
  
  3. Features
    - Support for recurring events
    - External calendar sync
    - Attendee management
    - Visibility controls
*/

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text,
  is_all_day boolean DEFAULT false,
  related_contact_id uuid REFERENCES contacts(id),
  related_deal_id uuid REFERENCES deals(id),
  status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
  visibility text DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'shared')),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  calendar_id text,
  source text DEFAULT 'internal' CHECK (source IN ('internal', 'google', 'outlook', 'other')),
  recurrence text,
  recurrence_end timestamptz,
  metadata jsonb DEFAULT '{}'
);

-- Calendar attendees table
CREATE TABLE IF NOT EXISTS calendar_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  status text DEFAULT 'needs_action' CHECK (status IN ('accepted', 'declined', 'tentative', 'needs_action')),
  is_organizer boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id),
  contact_id uuid REFERENCES contacts(id),
  created_at timestamptz DEFAULT now()
);

-- Calendar integrations table
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  provider text NOT NULL CHECK (provider IN ('google', 'outlook', 'other')),
  provider_id text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  calendar_id text NOT NULL,
  calendar_name text NOT NULL,
  is_primary boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sync_enabled boolean DEFAULT true,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider, calendar_id)
);

-- Calendar settings table
CREATE TABLE IF NOT EXISTS calendar_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  working_hours jsonb NOT NULL DEFAULT '{
    "monday": [{"start": "09:00", "end": "17:00"}],
    "tuesday": [{"start": "09:00", "end": "17:00"}],
    "wednesday": [{"start": "09:00", "end": "17:00"}],
    "thursday": [{"start": "09:00", "end": "17:00"}],
    "friday": [{"start": "09:00", "end": "17:00"}],
    "saturday": [],
    "sunday": []
  }',
  timezone text DEFAULT 'UTC',
  default_meeting_duration integer DEFAULT 30,
  buffer_time integer DEFAULT 15,
  visibility_settings jsonb DEFAULT '{
    "show_free_busy": true,
    "show_meeting_details": false,
    "show_attendees": false
  }',
  notification_settings jsonb DEFAULT '{
    "email_reminders": true,
    "push_reminders": true,
    "reminder_time": 15
  }',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_events
CREATE POLICY "Users can create calendar events"
  ON calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their own calendar events"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by OR
    visibility = 'public' OR
    (visibility = 'shared' AND EXISTS (
      SELECT 1 FROM calendar_attendees
      WHERE calendar_attendees.event_id = calendar_events.id
      AND calendar_attendees.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update their own calendar events"
  ON calendar_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own calendar events"
  ON calendar_events FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for calendar_attendees
CREATE POLICY "Users can view attendees for events they can see"
  ON calendar_attendees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events
      WHERE calendar_events.id = calendar_attendees.event_id
      AND (
        calendar_events.created_by = auth.uid() OR
        calendar_events.visibility = 'public' OR
        (calendar_events.visibility = 'shared' AND EXISTS (
          SELECT 1 FROM calendar_attendees ca
          WHERE ca.event_id = calendar_events.id
          AND ca.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can manage attendees for their events"
  ON calendar_attendees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events
      WHERE calendar_events.id = calendar_attendees.event_id
      AND calendar_events.created_by = auth.uid()
    )
  );

-- RLS Policies for calendar_integrations
CREATE POLICY "Users can manage their own calendar integrations"
  ON calendar_integrations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for calendar_settings
CREATE POLICY "Users can manage their own calendar settings"
  ON calendar_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_integrations_updated_at
  BEFORE UPDATE ON calendar_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_settings_updated_at
  BEFORE UPDATE ON calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_related_contact ON calendar_events(related_contact_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_related_deal ON calendar_events(related_deal_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_visibility ON calendar_events(visibility);

CREATE INDEX IF NOT EXISTS idx_calendar_attendees_event_id ON calendar_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_attendees_user_id ON calendar_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_attendees_contact_id ON calendar_attendees(contact_id);
CREATE INDEX IF NOT EXISTS idx_calendar_attendees_email ON calendar_attendees(email);

CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_id ON calendar_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_provider ON calendar_integrations(provider);