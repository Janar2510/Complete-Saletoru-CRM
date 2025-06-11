/*
  # Lead Scoring System for SaleToru CRM

  1. New Fields
    - `contacts.lead_score` (integer) - Overall lead score from 0-100
    - `contacts.last_interaction_at` (timestamp) - Last meaningful interaction
    - `contacts.engagement_metrics` (jsonb) - Detailed metrics for scoring
    - `deals.engagement_score` (integer) - Deal engagement score
    - `deals.last_activity_at` (timestamp) - Last activity on deal
    - `lead_score_logs` (table) - History of score changes

  2. Functions
    - `calculate_contact_lead_score()` - Calculates lead score based on multiple factors
    - `calculate_deal_engagement_score()` - Calculates deal engagement based on activity
    - `update_lead_scores()` - Scheduled function to update all scores

  3. Triggers
    - Auto-update scores on relevant activity
    - Log score changes for analytics
*/

-- Add lead scoring fields to contacts table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'lead_score') THEN
    ALTER TABLE contacts ADD COLUMN lead_score integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'last_interaction_at') THEN
    ALTER TABLE contacts ADD COLUMN last_interaction_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'engagement_metrics') THEN
    ALTER TABLE contacts ADD COLUMN engagement_metrics jsonb DEFAULT '{
      "email_opens": 0,
      "email_replies": 0,
      "meetings_attended": 0,
      "calls_answered": 0,
      "website_visits": 0,
      "form_submissions": 0,
      "document_views": 0,
      "manual_adjustment": 0
    }'::jsonb;
  END IF;
END $$;

-- Add engagement score fields to deals table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'engagement_score') THEN
    ALTER TABLE deals ADD COLUMN engagement_score integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'last_activity_at') THEN
    ALTER TABLE deals ADD COLUMN last_activity_at timestamptz;
  END IF;
END $$;

-- Create lead score logs table
CREATE TABLE IF NOT EXISTS lead_score_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('contact', 'deal')),
  entity_id uuid NOT NULL,
  previous_score integer NOT NULL,
  new_score integer NOT NULL,
  change_reason text,
  change_source text NOT NULL CHECK (change_source IN ('automatic', 'manual', 'system')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create lead scoring configuration table
CREATE TABLE IF NOT EXISTS lead_scoring_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  config_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Function to calculate contact lead score
CREATE OR REPLACE FUNCTION calculate_contact_lead_score(contact_id uuid)
RETURNS integer AS $$
DECLARE
  contact_record contacts%ROWTYPE;
  base_score integer := 0;
  recency_score integer := 0;
  engagement_score integer := 0;
  profile_score integer := 0;
  activity_score integer := 0;
  manual_adjustment integer := 0;
  final_score integer := 0;
BEGIN
  -- Get contact record
  SELECT * INTO contact_record FROM contacts WHERE id = contact_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Base score (20 points)
  -- Everyone starts with some points just for being in the system
  base_score := 20;
  
  -- Recency score (0-20 points)
  -- More recent interactions get higher scores
  IF contact_record.last_interaction_at IS NOT NULL THEN
    CASE
      WHEN contact_record.last_interaction_at > now() - interval '7 days' THEN recency_score := 20;
      WHEN contact_record.last_interaction_at > now() - interval '30 days' THEN recency_score := 15;
      WHEN contact_record.last_interaction_at > now() - interval '90 days' THEN recency_score := 10;
      WHEN contact_record.last_interaction_at > now() - interval '180 days' THEN recency_score := 5;
      ELSE recency_score := 0;
    END CASE;
  END IF;
  
  -- Engagement score (0-30 points)
  -- Based on email opens, replies, meetings, etc.
  IF contact_record.engagement_metrics IS NOT NULL THEN
    engagement_score := 
      LEAST(10, (contact_record.engagement_metrics->>'email_opens')::integer / 2) +
      LEAST(10, (contact_record.engagement_metrics->>'email_replies')::integer * 2) +
      LEAST(5, (contact_record.engagement_metrics->>'meetings_attended')::integer * 2) +
      LEAST(5, (contact_record.engagement_metrics->>'calls_answered')::integer * 2);
  END IF;
  
  -- Profile completeness score (0-10 points)
  -- More complete profiles get higher scores
  profile_score := 0;
  IF contact_record.email IS NOT NULL THEN profile_score := profile_score + 2; END IF;
  IF contact_record.phone IS NOT NULL THEN profile_score := profile_score + 2; END IF;
  IF contact_record.title IS NOT NULL THEN profile_score := profile_score + 2; END IF;
  IF contact_record.company_id IS NOT NULL THEN profile_score := profile_score + 2; END IF;
  IF contact_record.linkedin_url IS NOT NULL THEN profile_score := profile_score + 2; END IF;
  
  -- Activity score (0-10 points)
  -- Based on number of activities
  SELECT LEAST(10, COUNT(*) / 2) INTO activity_score 
  FROM contact_activities 
  WHERE contact_id = contact_record.id;
  
  -- Manual adjustment (-20 to +20 points)
  -- Allow manual override by sales reps
  IF contact_record.engagement_metrics IS NOT NULL AND contact_record.engagement_metrics->>'manual_adjustment' IS NOT NULL THEN
    manual_adjustment := (contact_record.engagement_metrics->>'manual_adjustment')::integer;
  END IF;
  
  -- Calculate final score (capped at 0-100)
  final_score := GREATEST(0, LEAST(100, base_score + recency_score + engagement_score + profile_score + activity_score + manual_adjustment));
  
  RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate deal engagement score
CREATE OR REPLACE FUNCTION calculate_deal_engagement_score(deal_id uuid)
RETURNS integer AS $$
DECLARE
  deal_record deals%ROWTYPE;
  activity_count integer := 0;
  note_count integer := 0;
  file_count integer := 0;
  stage_progress integer := 0;
  recency_score integer := 0;
  final_score integer := 0;
BEGIN
  -- Get deal record
  SELECT * INTO deal_record FROM deals WHERE id = deal_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Count activities
  SELECT COUNT(*) INTO activity_count FROM deal_activities WHERE deal_id = deal_record.id;
  
  -- Count notes
  SELECT COUNT(*) INTO note_count FROM deal_notes WHERE deal_id = deal_record.id;
  
  -- Count files
  SELECT COUNT(*) INTO file_count FROM deal_files WHERE deal_id = deal_record.id;
  
  -- Calculate stage progress (0-30 points)
  -- Higher stages get more points
  SELECT 
    CASE 
      WHEN ps.position = 1 THEN 5
      ELSE LEAST(30, (ps.position * 5))
    END INTO stage_progress
  FROM pipeline_stages ps
  WHERE ps.id = deal_record.stage_id;
  
  -- Recency score (0-20 points)
  IF deal_record.updated_at IS NOT NULL THEN
    CASE
      WHEN deal_record.updated_at > now() - interval '3 days' THEN recency_score := 20;
      WHEN deal_record.updated_at > now() - interval '7 days' THEN recency_score := 15;
      WHEN deal_record.updated_at > now() - interval '14 days' THEN recency_score := 10;
      WHEN deal_record.updated_at > now() - interval '30 days' THEN recency_score := 5;
      ELSE recency_score := 0;
    END CASE;
  END IF;
  
  -- Calculate final score (capped at 0-100)
  final_score := GREATEST(0, LEAST(100, 
    stage_progress + 
    recency_score + 
    LEAST(20, activity_count * 2) + 
    LEAST(15, note_count * 3) + 
    LEAST(15, file_count * 3)
  ));
  
  RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update all lead scores (for scheduled jobs)
CREATE OR REPLACE FUNCTION update_all_lead_scores()
RETURNS void AS $$
DECLARE
  contact_rec record;
  deal_rec record;
  new_score integer;
BEGIN
  -- Update contact lead scores
  FOR contact_rec IN SELECT id, lead_score FROM contacts LOOP
    new_score := calculate_contact_lead_score(contact_rec.id);
    
    IF new_score != contact_rec.lead_score THEN
      -- Log the change
      INSERT INTO lead_score_logs (
        entity_type, 
        entity_id, 
        previous_score, 
        new_score, 
        change_reason, 
        change_source
      ) VALUES (
        'contact',
        contact_rec.id,
        contact_rec.lead_score,
        new_score,
        'Scheduled update',
        'system'
      );
      
      -- Update the score
      UPDATE contacts SET 
        lead_score = new_score,
        updated_at = now()
      WHERE id = contact_rec.id;
    END IF;
  END LOOP;
  
  -- Update deal engagement scores
  FOR deal_rec IN SELECT id, engagement_score FROM deals LOOP
    new_score := calculate_deal_engagement_score(deal_rec.id);
    
    IF new_score != deal_rec.engagement_score THEN
      -- Log the change
      INSERT INTO lead_score_logs (
        entity_type, 
        entity_id, 
        previous_score, 
        new_score, 
        change_reason, 
        change_source
      ) VALUES (
        'deal',
        deal_rec.id,
        deal_rec.engagement_score,
        new_score,
        'Scheduled update',
        'system'
      );
      
      -- Update the score
      UPDATE deals SET 
        engagement_score = new_score,
        updated_at = now()
      WHERE id = deal_rec.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update contact lead score on activity
CREATE OR REPLACE FUNCTION update_contact_lead_score_on_activity()
RETURNS TRIGGER AS $$
DECLARE
  old_score integer;
  new_score integer;
BEGIN
  -- Get current score
  SELECT lead_score INTO old_score FROM contacts WHERE id = NEW.contact_id;
  
  -- Update last interaction time
  UPDATE contacts SET 
    last_interaction_at = now(),
    updated_at = now()
  WHERE id = NEW.contact_id;
  
  -- Calculate new score
  new_score := calculate_contact_lead_score(NEW.contact_id);
  
  -- Update score if changed
  IF new_score != old_score THEN
    -- Log the change
    INSERT INTO lead_score_logs (
      entity_type, 
      entity_id, 
      previous_score, 
      new_score, 
      change_reason, 
      change_source
    ) VALUES (
      'contact',
      NEW.contact_id,
      old_score,
      new_score,
      'New activity: ' || NEW.activity_type,
      'automatic'
    );
    
    -- Update the score
    UPDATE contacts SET 
      lead_score = new_score,
      updated_at = now()
    WHERE id = NEW.contact_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_lead_score
  AFTER INSERT ON contact_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_lead_score_on_activity();

-- Trigger to update deal engagement score on activity
CREATE OR REPLACE FUNCTION update_deal_engagement_score_on_activity()
RETURNS TRIGGER AS $$
DECLARE
  old_score integer;
  new_score integer;
BEGIN
  -- Get current score
  SELECT engagement_score INTO old_score FROM deals WHERE id = NEW.deal_id;
  
  -- Update last activity time
  UPDATE deals SET 
    last_activity_at = now(),
    updated_at = now()
  WHERE id = NEW.deal_id;
  
  -- Calculate new score
  new_score := calculate_deal_engagement_score(NEW.deal_id);
  
  -- Update score if changed
  IF new_score != old_score THEN
    -- Log the change
    INSERT INTO lead_score_logs (
      entity_type, 
      entity_id, 
      previous_score, 
      new_score, 
      change_reason, 
      change_source
    ) VALUES (
      'deal',
      NEW.deal_id,
      old_score,
      new_score,
      'New activity: ' || NEW.activity_type,
      'automatic'
    );
    
    -- Update the score
    UPDATE deals SET 
      engagement_score = new_score,
      updated_at = now()
    WHERE id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_deal_engagement_score
  AFTER INSERT ON deal_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_engagement_score_on_activity();

-- Trigger to update deal engagement score on note
CREATE OR REPLACE FUNCTION update_deal_engagement_score_on_note()
RETURNS TRIGGER AS $$
DECLARE
  old_score integer;
  new_score integer;
BEGIN
  -- Get current score
  SELECT engagement_score INTO old_score FROM deals WHERE id = NEW.deal_id;
  
  -- Update last activity time
  UPDATE deals SET 
    last_activity_at = now(),
    updated_at = now()
  WHERE id = NEW.deal_id;
  
  -- Calculate new score
  new_score := calculate_deal_engagement_score(NEW.deal_id);
  
  -- Update score if changed
  IF new_score != old_score THEN
    -- Log the change
    INSERT INTO lead_score_logs (
      entity_type, 
      entity_id, 
      previous_score, 
      new_score, 
      change_reason, 
      change_source
    ) VALUES (
      'deal',
      NEW.deal_id,
      old_score,
      new_score,
      'New note added',
      'automatic'
    );
    
    -- Update the score
    UPDATE deals SET 
      engagement_score = new_score,
      updated_at = now()
    WHERE id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_deal_engagement_score_on_note
  AFTER INSERT ON deal_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_engagement_score_on_note();

-- Enable RLS on new tables
ALTER TABLE lead_score_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scoring_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read lead score logs" ON lead_score_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can read lead scoring config" ON lead_scoring_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage lead scoring config" ON lead_scoring_config
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_lead_score ON contacts(lead_score);
CREATE INDEX IF NOT EXISTS idx_contacts_last_interaction ON contacts(last_interaction_at);
CREATE INDEX IF NOT EXISTS idx_deals_engagement_score ON deals(engagement_score);
CREATE INDEX IF NOT EXISTS idx_deals_last_activity ON deals(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_lead_score_logs_entity ON lead_score_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_lead_score_logs_created_at ON lead_score_logs(created_at);

-- Insert default scoring configuration
INSERT INTO lead_scoring_config (name, description, config_data, created_by)
VALUES (
  'Default Scoring Model',
  'Standard lead scoring model based on engagement and profile data',
  '{
    "weights": {
      "recency": 20,
      "engagement": 30,
      "profile": 10,
      "activity": 10,
      "base": 20
    },
    "thresholds": {
      "cold": 40,
      "warm": 70,
      "hot": 90
    },
    "decay": {
      "enabled": true,
      "rate": 5,
      "period": "30 days"
    }
  }'::jsonb,
  (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Run initial scoring
SELECT update_all_lead_scores();