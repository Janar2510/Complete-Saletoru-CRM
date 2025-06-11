-- Email threads table
CREATE TABLE IF NOT EXISTS email_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES contacts(id),
  subject text NOT NULL,
  participants jsonb DEFAULT '[]',
  last_message_at timestamptz,
  message_count integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'spam')),
  labels text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Email messages table
CREATE TABLE IF NOT EXISTS email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES email_threads(id) ON DELETE CASCADE,
  message_id text UNIQUE, -- External email message ID
  from_email text NOT NULL,
  from_name text,
  to_emails text[] NOT NULL,
  cc_emails text[] DEFAULT '{}',
  bcc_emails text[] DEFAULT '{}',
  subject text NOT NULL,
  body_text text,
  body_html text,
  sent_at timestamptz NOT NULL,
  received_at timestamptz,
  is_outbound boolean DEFAULT false,
  has_attachments boolean DEFAULT false,
  attachment_count integer DEFAULT 0,
  attachment_details jsonb DEFAULT '[]',
  read_status boolean DEFAULT false,
  importance text DEFAULT 'normal' CHECK (importance IN ('low', 'normal', 'high')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Deal mentions table
CREATE TABLE IF NOT EXISTS deal_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
  note_id uuid REFERENCES deal_notes(id) ON DELETE CASCADE,
  mentioned_user_id uuid REFERENCES auth.users(id),
  mentioned_by uuid REFERENCES auth.users(id),
  content_snippet text,
  is_read boolean DEFAULT false,
  notification_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Cloud storage connections table
CREATE TABLE IF NOT EXISTS cloud_storage_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  provider text NOT NULL CHECK (provider IN ('google_drive', 'onedrive', 'dropbox', 'box')),
  provider_user_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_active boolean DEFAULT true,
  scopes text[] DEFAULT '{}',
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Deal folders table
CREATE TABLE IF NOT EXISTS deal_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
  storage_connection_id uuid REFERENCES cloud_storage_connections(id),
  folder_name text NOT NULL,
  folder_id text NOT NULL, -- External folder ID from cloud provider
  folder_path text,
  folder_url text,
  sync_enabled boolean DEFAULT true,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Email intent categories table for smart assistant
CREATE TABLE IF NOT EXISTS email_intent_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  keywords text[] DEFAULT '{}',
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Contact intent classifications table
CREATE TABLE IF NOT EXISTS contact_intent_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  intent_category_id uuid REFERENCES email_intent_categories(id),
  confidence_score numeric(3,2) DEFAULT 0.0,
  evidence_message_ids text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  classified_at timestamptz DEFAULT now(),
  classified_by text DEFAULT 'system' CHECK (classified_by IN ('system', 'manual', 'ai')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add thread_id to email_tracking table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_tracking' AND column_name = 'thread_id') THEN
    ALTER TABLE email_tracking ADD COLUMN thread_id uuid REFERENCES email_threads(id);
  END IF;
END $$;

-- Add markdown and mentions support to deal_notes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_notes' AND column_name = 'is_markdown') THEN
    ALTER TABLE deal_notes ADD COLUMN is_markdown boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_notes' AND column_name = 'mentions_processed') THEN
    ALTER TABLE deal_notes ADD COLUMN mentions_processed boolean DEFAULT false;
  END IF;
END $$;

-- Add cloud sync status to deal_files
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_files' AND column_name = 'cloud_sync_status') THEN
    ALTER TABLE deal_files ADD COLUMN cloud_sync_status text DEFAULT 'not_synced' CHECK (cloud_sync_status IN ('not_synced', 'syncing', 'synced', 'failed'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_files' AND column_name = 'cloud_file_id') THEN
    ALTER TABLE deal_files ADD COLUMN cloud_file_id text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_files' AND column_name = 'cloud_file_url') THEN
    ALTER TABLE deal_files ADD COLUMN cloud_file_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_files' AND column_name = 'category') THEN
    ALTER TABLE deal_files ADD COLUMN category text DEFAULT 'other' CHECK (category IN ('contract', 'proposal', 'invoice', 'presentation', 'image', 'pdf', 'spreadsheet', 'document', 'other'));
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_storage_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_intent_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_intent_classifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_threads
CREATE POLICY "Users can read email threads they have access to"
  ON email_threads FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM deals d 
      WHERE d.id = email_threads.deal_id 
      AND (d.owner_id = auth.uid() OR d.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can create email threads"
  ON email_threads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- RLS Policies for email_messages
CREATE POLICY "Users can read email messages they have access to"
  ON email_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_threads et 
      WHERE et.id = email_messages.thread_id 
      AND (
        et.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM deals d 
          WHERE d.id = et.deal_id 
          AND (d.owner_id = auth.uid() OR d.created_by = auth.uid())
        )
      )
    )
  );

-- RLS Policies for deal_mentions
CREATE POLICY "Users can read mentions they're involved in"
  ON deal_mentions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = mentioned_user_id OR
    auth.uid() = mentioned_by OR
    EXISTS (
      SELECT 1 FROM deals d 
      WHERE d.id = deal_mentions.deal_id 
      AND (d.owner_id = auth.uid() OR d.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can create mentions"
  ON deal_mentions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = mentioned_by);

-- RLS Policies for cloud_storage_connections
CREATE POLICY "Users can manage their own cloud storage connections"
  ON cloud_storage_connections FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for deal_folders
CREATE POLICY "Users can read deal folders they have access to"
  ON deal_folders FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM deals d 
      WHERE d.id = deal_folders.deal_id 
      AND (d.owner_id = auth.uid() OR d.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can create deal folders"
  ON deal_folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- RLS Policies for email_intent_categories
CREATE POLICY "Users can read email intent categories"
  ON email_intent_categories FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for contact_intent_classifications
CREATE POLICY "Users can read contact intent classifications"
  ON contact_intent_classifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts c 
      WHERE c.id = contact_intent_classifications.contact_id 
      AND (c.owner_id = auth.uid() OR c.created_by = auth.uid())
    )
  );

-- Function to process @mentions in deal notes
CREATE OR REPLACE FUNCTION process_deal_note_mentions()
RETURNS TRIGGER AS $$
DECLARE
  mention_match text;
  mentioned_username text;
  mentioned_user_id uuid;
BEGIN
  -- Mark as processed
  NEW.mentions_processed := true;
  
  -- Look for @mentions in the content
  FOR mention_match IN 
    SELECT regexp_matches(NEW.content, '@([a-zA-Z0-9_]+)', 'g')
  LOOP
    mentioned_username := mention_match;
    
    -- Find the user ID for this username
    SELECT id INTO mentioned_user_id
    FROM auth.users
    WHERE raw_user_meta_data->>'username' = mentioned_username
    OR raw_user_meta_data->>'full_name' ILIKE '%' || mentioned_username || '%'
    LIMIT 1;
    
    IF mentioned_user_id IS NOT NULL THEN
      -- Create a mention record
      INSERT INTO deal_mentions (
        deal_id,
        note_id,
        mentioned_user_id,
        mentioned_by,
        content_snippet,
        created_at
      ) VALUES (
        NEW.deal_id,
        NEW.id,
        mentioned_user_id,
        NEW.created_by,
        substring(NEW.content from 1 for 100),
        NEW.created_at
      );
      
      -- Create a notification
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        entity_type,
        entity_id
      ) VALUES (
        mentioned_user_id,
        'mention',
        'You were mentioned in a deal note',
        'You were mentioned in a note on deal: ' || (SELECT title FROM deals WHERE id = NEW.deal_id),
        'deal',
        NEW.deal_id
      );
      
      -- Add to mentioned_users array if not already there
      IF NOT (NEW.mentioned_users @> ARRAY[mentioned_user_id]) THEN
        NEW.mentioned_users := array_append(NEW.mentioned_users, mentioned_user_id);
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_deal_note_mentions
  BEFORE INSERT ON deal_notes
  FOR EACH ROW
  EXECUTE FUNCTION process_deal_note_mentions();

-- Function to create cloud folder for new deals
CREATE OR REPLACE FUNCTION create_deal_cloud_folder()
RETURNS TRIGGER AS $$
DECLARE
  connection_record cloud_storage_connections%ROWTYPE;
  folder_name text;
BEGIN
  -- Only proceed if there's an active cloud connection for the deal owner
  SELECT * INTO connection_record
  FROM cloud_storage_connections
  WHERE user_id = NEW.owner_id
  AND is_active = true
  LIMIT 1;
  
  IF connection_record.id IS NOT NULL THEN
    -- Create folder name using deal ID
    folder_name := 'Deal - ' || NEW.deal_id || ' - ' || NEW.title;
    
    -- Insert placeholder record - actual folder creation happens in application code
    INSERT INTO deal_folders (
      deal_id,
      storage_connection_id,
      folder_name,
      folder_id,
      folder_path,
      sync_enabled,
      created_by
    ) VALUES (
      NEW.id,
      connection_record.id,
      folder_name,
      'pending', -- Will be updated by application code
      '/SaleToru CRM/' || folder_name,
      true,
      NEW.created_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_deal_cloud_folder
  AFTER INSERT ON deals
  FOR EACH ROW
  EXECUTE FUNCTION create_deal_cloud_folder();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_threads_deal_id ON email_threads(deal_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_contact_id ON email_threads(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_last_message_at ON email_threads(last_message_at);

CREATE INDEX IF NOT EXISTS idx_email_messages_thread_id ON email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_message_id ON email_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_sent_at ON email_messages(sent_at);

CREATE INDEX IF NOT EXISTS idx_deal_mentions_deal_id ON deal_mentions(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_mentions_mentioned_user_id ON deal_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_deal_mentions_is_read ON deal_mentions(is_read);

CREATE INDEX IF NOT EXISTS idx_deal_folders_deal_id ON deal_folders(deal_id);
CREATE INDEX IF NOT EXISTS idx_cloud_storage_connections_user_id ON cloud_storage_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_storage_connections_provider ON cloud_storage_connections(provider);

CREATE INDEX IF NOT EXISTS idx_contact_intent_contact_id ON contact_intent_classifications(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_intent_category_id ON contact_intent_classifications(intent_category_id);

-- Insert default email intent categories
INSERT INTO email_intent_categories (name, description, keywords, is_system)
VALUES 
  ('Interested', 'Contact shows interest in products/services', ARRAY['interested', 'tell me more', 'pricing', 'demo', 'features'], true),
  ('Ready to Buy', 'Contact is ready to make a purchase', ARRAY['purchase', 'buy', 'order', 'payment', 'credit card'], true),
  ('Hesitating', 'Contact is interested but has concerns', ARRAY['concerned', 'expensive', 'competitor', 'think about', 'not sure'], true),
  ('Need Support', 'Contact needs technical or customer support', ARRAY['help', 'support', 'issue', 'problem', 'doesn''t work'], true),
  ('Unsubscribe', 'Contact wants to opt out of communications', ARRAY['unsubscribe', 'opt out', 'stop sending', 'remove me'], true),
  ('Referral', 'Contact is referring someone else', ARRAY['referral', 'colleague', 'friend', 'might be interested'], true),
  ('Out of Office', 'Contact is away or unavailable', ARRAY['out of office', 'vacation', 'holiday', 'away', 'return on'], true),
  ('Positive Feedback', 'Contact provides positive feedback', ARRAY['great', 'awesome', 'thank you', 'appreciate', 'excellent'], true),
  ('Negative Feedback', 'Contact provides negative feedback', ARRAY['disappointed', 'unhappy', 'frustrated', 'cancel', 'refund'], true),
  ('Silent', 'Contact has not responded in a while', ARRAY[]::text[], true);