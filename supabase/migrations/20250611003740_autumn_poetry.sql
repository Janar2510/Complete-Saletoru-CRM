/*
  # Fix Calendar Attendees RLS Policy Infinite Recursion

  1. Policy Changes
    - Remove the recursive policy that causes infinite loop
    - Simplify the attendees viewing policy to avoid circular references
    - Ensure policies are efficient and don't create dependency loops

  2. Security
    - Maintain proper access control without recursion
    - Users can still only see attendees for events they have access to
    - Event creators can manage all attendees for their events
*/

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view attendees for events they can see" ON calendar_attendees;
DROP POLICY IF EXISTS "Users can manage attendees for their events" ON calendar_attendees;

-- Create simplified, non-recursive policies
CREATE POLICY "Users can manage attendees for their own events"
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

-- Allow users to view attendees for public events or events they created
CREATE POLICY "Users can view attendees for accessible events"
  ON calendar_attendees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events 
      WHERE calendar_events.id = calendar_attendees.event_id 
      AND (
        calendar_events.created_by = auth.uid() 
        OR calendar_events.visibility = 'public'
        OR (
          calendar_events.visibility = 'shared' 
          AND calendar_attendees.user_id = auth.uid()
        )
      )
    )
  );

-- Allow users to see their own attendee records
CREATE POLICY "Users can view their own attendee records"
  ON calendar_attendees
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());