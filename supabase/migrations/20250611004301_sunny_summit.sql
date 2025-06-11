-- First, check if policies exist before dropping them
DO $$
BEGIN
  -- Drop calendar_events policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own calendar events' AND tablename = 'calendar_events') THEN
    DROP POLICY "Users can view their own calendar events" ON calendar_events;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own calendar events' AND tablename = 'calendar_events') THEN
    DROP POLICY "Users can update their own calendar events" ON calendar_events;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own calendar events' AND tablename = 'calendar_events') THEN
    DROP POLICY "Users can delete their own calendar events" ON calendar_events;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create calendar events' AND tablename = 'calendar_events') THEN
    DROP POLICY "Users can create calendar events" ON calendar_events;
  END IF;
  
  -- Drop calendar_attendees policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view attendees for events they can see' AND tablename = 'calendar_attendees') THEN
    DROP POLICY "Users can view attendees for events they can see" ON calendar_attendees;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage attendees for their events' AND tablename = 'calendar_attendees') THEN
    DROP POLICY "Users can manage attendees for their events" ON calendar_attendees;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own attendee records' AND tablename = 'calendar_attendees') THEN
    DROP POLICY "Users can view their own attendee records" ON calendar_attendees;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view attendees for events they created' AND tablename = 'calendar_attendees') THEN
    DROP POLICY "Users can view attendees for events they created" ON calendar_attendees;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view attendees for public events' AND tablename = 'calendar_attendees') THEN
    DROP POLICY "Users can view attendees for public events" ON calendar_attendees;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Event creators can manage attendees' AND tablename = 'calendar_attendees') THEN
    DROP POLICY "Event creators can manage attendees" ON calendar_attendees;
  END IF;
END $$;

-- Now create new policies, but check if they exist first
DO $$
BEGIN
  -- Create calendar_events policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create calendar events' AND tablename = 'calendar_events') THEN
    CREATE POLICY "Users can create calendar events"
      ON calendar_events
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own calendar events' AND tablename = 'calendar_events') THEN
    CREATE POLICY "Users can view their own calendar events"
      ON calendar_events
      FOR SELECT
      TO authenticated
      USING (auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view public calendar events' AND tablename = 'calendar_events') THEN
    CREATE POLICY "Users can view public calendar events"
      ON calendar_events
      FOR SELECT
      TO authenticated
      USING (visibility = 'public');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view shared events they attend' AND tablename = 'calendar_events') THEN
    CREATE POLICY "Users can view shared events they attend"
      ON calendar_events
      FOR SELECT
      TO authenticated
      USING (
        visibility = 'shared' AND 
        EXISTS (
          SELECT 1 FROM calendar_attendees 
          WHERE calendar_attendees.event_id = calendar_events.id 
          AND calendar_attendees.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own calendar events' AND tablename = 'calendar_events') THEN
    CREATE POLICY "Users can update their own calendar events"
      ON calendar_events
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own calendar events' AND tablename = 'calendar_events') THEN
    CREATE POLICY "Users can delete their own calendar events"
      ON calendar_events
      FOR DELETE
      TO authenticated
      USING (auth.uid() = created_by);
  END IF;

  -- Create calendar_attendees policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view attendees for events they created' AND tablename = 'calendar_attendees') THEN
    CREATE POLICY "Users can view attendees for events they created"
      ON calendar_attendees
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM calendar_events 
          WHERE calendar_events.id = calendar_attendees.event_id 
          AND calendar_events.created_by = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view attendees for public events' AND tablename = 'calendar_attendees') THEN
    CREATE POLICY "Users can view attendees for public events"
      ON calendar_attendees
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM calendar_events 
          WHERE calendar_events.id = calendar_attendees.event_id 
          AND calendar_events.visibility = 'public'
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own attendee records' AND tablename = 'calendar_attendees') THEN
    CREATE POLICY "Users can view their own attendee records"
      ON calendar_attendees
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Event creators can manage attendees' AND tablename = 'calendar_attendees') THEN
    CREATE POLICY "Event creators can manage attendees"
      ON calendar_attendees
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM calendar_events 
          WHERE calendar_events.id = calendar_attendees.event_id 
          AND calendar_events.created_by = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM calendar_events 
          WHERE calendar_events.id = calendar_attendees.event_id 
          AND calendar_events.created_by = auth.uid()
        )
      );
  END IF;
END $$;