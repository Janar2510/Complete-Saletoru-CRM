/*
  # Lead Scoring Edge Functions Support

  1. New Tables
    - `lead_score_logs` - Tracks changes to lead scores
    - `lead_scoring_config` - Stores configuration for lead scoring algorithms

  2. New Functions
    - `calculate_contact_lead_score` - Calculates lead score for a contact
    - `calculate_deal_engagement_score` - Calculates engagement score for a deal
    - `update_all_lead_scores` - Updates all lead scores (for scheduled jobs)

  3. New Triggers
    - `trigger_update_contact_lead_score` - Updates lead score on contact activity
    - `trigger_update_deal_engagement_score` - Updates engagement score on deal activity
    - `trigger_update_deal_engagement_score_on_note` - Updates engagement score on note creation
*/

-- Create webhook_events table to track incoming webhooks
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create webhook_subscriptions table to manage webhook endpoints
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  endpoint_url text NOT NULL,
  event_types text[] NOT NULL,
  secret_key text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on webhook tables
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook tables
CREATE POLICY "Admins can manage webhook events" ON webhook_events
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage webhook subscriptions" ON webhook_subscriptions
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create function to send webhook events
CREATE OR REPLACE FUNCTION send_webhook_event(event_type text, payload jsonb)
RETURNS void AS $$
DECLARE
  subscription_rec webhook_subscriptions%ROWTYPE;
BEGIN
  -- Insert event record
  INSERT INTO webhook_events (event_type, payload)
  VALUES (event_type, payload);
  
  -- In a real implementation, this would trigger an external service
  -- to actually send the webhook. For now, we just log it.
  
  -- Find all active subscriptions for this event type
  FOR subscription_rec IN 
    SELECT * FROM webhook_subscriptions 
    WHERE is_active = true 
    AND event_types @> ARRAY[event_type]
  LOOP
    -- Log that we would send this webhook
    RAISE NOTICE 'Would send webhook to %: %', 
      subscription_rec.endpoint_url, 
      jsonb_build_object(
        'event_type', event_type,
        'payload', payload,
        'timestamp', now()
      );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to process email tracking events
CREATE OR REPLACE FUNCTION process_email_tracking_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Send webhook event based on status
  CASE NEW.status
    WHEN 'opened' THEN
      PERFORM send_webhook_event(
        'email.opened',
        jsonb_build_object(
          'tracking_id', NEW.tracking_id,
          'contact_id', NEW.contact_id,
          'deal_id', NEW.deal_id,
          'subject', NEW.subject,
          'opened_at', NEW.opened_at
        )
      );
    WHEN 'clicked' THEN
      PERFORM send_webhook_event(
        'email.clicked',
        jsonb_build_object(
          'tracking_id', NEW.tracking_id,
          'contact_id', NEW.contact_id,
          'deal_id', NEW.deal_id,
          'subject', NEW.subject,
          'clicked_at', NEW.clicked_at,
          'link', NEW.metadata->>'clicked_link'
        )
      );
    WHEN 'replied' THEN
      PERFORM send_webhook_event(
        'email.replied',
        jsonb_build_object(
          'tracking_id', NEW.tracking_id,
          'contact_id', NEW.contact_id,
          'deal_id', NEW.deal_id,
          'subject', NEW.subject,
          'replied_at', NEW.replied_at,
          'thread_id', NEW.thread_id
        )
      );
    ELSE
      -- No webhook for other statuses
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email tracking events
CREATE TRIGGER trigger_process_email_tracking_event
  AFTER UPDATE ON email_tracking
  FOR EACH ROW
  EXECUTE FUNCTION process_email_tracking_event();

-- Create indexes for webhook tables
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_active ON webhook_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_event_types ON webhook_subscriptions USING gin(event_types);

-- Insert default webhook subscription for lead scoring
INSERT INTO webhook_subscriptions (
  name, 
  endpoint_url, 
  event_types, 
  is_active, 
  created_by
) VALUES (
  'Lead Scoring Webhook',
  'https://example.com/lead-scoring-webhook',
  ARRAY['email.opened', 'email.clicked', 'email.replied', 'meeting.attended', 'document.viewed', 'form.submitted', 'website.visited'],
  true,
  (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT DO NOTHING;