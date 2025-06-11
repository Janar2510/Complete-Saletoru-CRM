-- First, check if policies exist before dropping them
DO $$
BEGIN
  -- Drop calendar_events policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'calendar_events_shared_read' AND tablename = 'calendar_events') THEN
    DROP POLICY "calendar_events_shared_read" ON calendar_events;
  END IF;
  
  -- Drop calendar_attendees policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'calendar_attendees_event_creator_access' AND tablename = 'calendar_attendees') THEN
    DROP POLICY "calendar_attendees_event_creator_access" ON calendar_attendees;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'calendar_attendees_own_record_read' AND tablename = 'calendar_attendees') THEN
    DROP POLICY "calendar_attendees_own_record_read" ON calendar_attendees;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'calendar_attendees_public_events_read' AND tablename = 'calendar_attendees') THEN
    DROP POLICY "calendar_attendees_public_events_read" ON calendar_attendees;
  END IF;
END $$;

-- Now create new policies, but check if they exist first
DO $$
BEGIN
  -- Create calendar_events policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'calendar_events_own_full_access' AND tablename = 'calendar_events') THEN
    CREATE POLICY "calendar_events_own_full_access"
      ON calendar_events
      FOR ALL
      TO authenticated
      USING (created_by = auth.uid())
      WITH CHECK (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'calendar_events_public_read' AND tablename = 'calendar_events') THEN
    CREATE POLICY "calendar_events_public_read"
      ON calendar_events
      FOR SELECT
      TO authenticated
      USING (visibility = 'public');
  END IF;

  -- Simplified shared events policy without subquery to calendar_attendees
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'calendar_events_shared_read' AND tablename = 'calendar_events') THEN
    CREATE POLICY "calendar_events_shared_read"
      ON calendar_events
      FOR SELECT
      TO authenticated
      USING (visibility = 'shared');
  END IF;

  -- Create calendar_attendees policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'calendar_attendees_own_access' AND tablename = 'calendar_attendees') THEN
    CREATE POLICY "calendar_attendees_own_access"
      ON calendar_attendees
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'calendar_attendees_event_owner_access' AND tablename = 'calendar_attendees') THEN
    CREATE POLICY "calendar_attendees_event_owner_access"
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

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'calendar_attendees_public_events_read' AND tablename = 'calendar_attendees') THEN
    CREATE POLICY "calendar_attendees_public_events_read"
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
END $$;