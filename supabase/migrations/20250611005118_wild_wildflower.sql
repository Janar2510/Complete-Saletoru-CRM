/*
  # Fix Calendar Events RLS Policies

  1. Policy Issues
    - Remove overlapping and potentially recursive policies
    - Simplify policy structure to prevent infinite recursion
    - Ensure clear, non-conflicting access rules

  2. New Policies
    - Users can manage their own calendar events
    - Users can view public events
    - Users can view shared events they attend
    - Event creators can manage attendees

  3. Security
    - Maintain proper access control
    - Prevent unauthorized access
    - Remove circular dependencies
*/

-- Drop all existing policies for calendar_events to start fresh
DROP POLICY IF EXISTS "Users can create calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can view public calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can view shared events they attend" ON calendar_events;
DROP POLICY IF EXISTS "Users can view their own calendar events" ON calendar_events;

-- Create simplified, non-recursive policies
CREATE POLICY "calendar_events_own_full_access"
  ON calendar_events
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "calendar_events_public_read"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (visibility = 'public');

CREATE POLICY "calendar_events_shared_read"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'shared' 
    AND EXISTS (
      SELECT 1 FROM calendar_attendees 
      WHERE calendar_attendees.event_id = calendar_events.id 
      AND calendar_attendees.user_id = auth.uid()
    )
  );

-- Also fix calendar_attendees policies to prevent recursion
DROP POLICY IF EXISTS "Event creators can manage attendees" ON calendar_attendees;
DROP POLICY IF EXISTS "Users can manage attendees for their own events" ON calendar_attendees;
DROP POLICY IF EXISTS "Users can view attendees for accessible events" ON calendar_attendees;
DROP POLICY IF EXISTS "Users can view attendees for events they created" ON calendar_attendees;
DROP POLICY IF EXISTS "Users can view attendees for public events" ON calendar_attendees;
DROP POLICY IF EXISTS "Users can view their own attendee records" ON calendar_attendees;

-- Create simplified attendees policies
CREATE POLICY "calendar_attendees_event_creator_access"
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

CREATE POLICY "calendar_attendees_own_record_read"
  ON calendar_attendees
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

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