import { Contact } from './contacts';

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  stages?: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  description?: string;
  probability: number;
  position: number;
  color: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  phone?: string;
  email?: string;
  address?: any;
  website?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Deal {
  id: string;
  deal_id: string;
  title: string;
  description?: string;
  value: number;
  currency: string;
  stage_id: string;
  pipeline_id: string;
  contact_id?: string;
  company_id?: string;
  owner_id: string;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;
  status: 'open' | 'won' | 'lost';
  lost_reason?: string;
  tags?: string[];
  custom_fields?: any;
  engagement_score?: number; // Lead scoring field
  last_activity_at?: string; // Last activity timestamp
  created_at: string;
  updated_at: string;
  created_by: string;
  
  // Relations
  stage?: PipelineStage;
  pipeline?: Pipeline;
  contact?: Contact;
  company?: Company;
  owner?: any;
  activities?: DealActivity[];
  notes?: DealNote[];
  files?: DealFile[];
  email_threads?: EmailThread[];
  cloud_folders?: DealFolder[];
}

export interface DealNote {
  id: string;
  deal_id: string;
  content: string;
  note_type: 'general' | 'call' | 'email' | 'meeting' | 'task';
  mentioned_users?: string[];
  is_markdown?: boolean;
  mentions_processed?: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_user?: any;
}

export interface DealFile {
  id: string;
  deal_id: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  storage_path: string;
  storage_provider: 'supabase' | 'google_drive' | 'onedrive' | 'dropbox' | 'box';
  category?: 'contract' | 'proposal' | 'invoice' | 'presentation' | 'image' | 'pdf' | 'spreadsheet' | 'document' | 'other';
  cloud_sync_status?: 'not_synced' | 'syncing' | 'synced' | 'failed';
  cloud_file_id?: string;
  cloud_file_url?: string;
  uploaded_by: string;
  created_at: string;
  uploaded_by_user?: any;
}

export interface DealActivity {
  id: string;
  deal_id: string;
  activity_type: 'created' | 'updated' | 'stage_changed' | 'note_added' | 'file_uploaded' | 'email_sent' | 'call_logged' | 'meeting_scheduled';
  description: string;
  metadata?: any;
  created_at: string;
  created_by: string;
  created_by_user?: any;
}

export interface DealContact {
  id: string;
  deal_id: string;
  contact_id: string;
  role: string;
  is_primary: boolean;
  created_at: string;
  contact?: Contact;
}

export interface EmailThread {
  id: string;
  deal_id?: string;
  contact_id?: string;
  subject: string;
  participants: any[];
  last_message_at?: string;
  message_count: number;
  status: 'active' | 'archived' | 'spam';
  labels?: string[];
  metadata?: any;
  created_at: string;
  created_by: string;
  messages?: EmailMessage[];
}

export interface EmailMessage {
  id: string;
  thread_id: string;
  message_id: string;
  from_email: string;
  from_name?: string;
  to_emails: string[];
  cc_emails?: string[];
  bcc_emails?: string[];
  subject: string;
  body_text?: string;
  body_html?: string;
  sent_at: string;
  received_at?: string;
  is_outbound: boolean;
  has_attachments: boolean;
  attachment_count?: number;
  attachment_details?: any[];
  read_status: boolean;
  importance: 'low' | 'normal' | 'high';
  metadata?: any;
  created_at: string;
}

export interface DealMention {
  id: string;
  deal_id: string;
  note_id: string;
  mentioned_user_id: string;
  mentioned_by: string;
  content_snippet?: string;
  is_read: boolean;
  notification_sent: boolean;
  created_at: string;
  mentioned_user?: any;
}

export interface DealFolder {
  id: string;
  deal_id: string;
  storage_connection_id: string;
  folder_name: string;
  folder_id: string;
  folder_path?: string;
  folder_url?: string;
  sync_enabled: boolean;
  last_synced_at?: string;
  created_at: string;
  created_by: string;
  storage_connection?: CloudStorageConnection;
}

export interface CloudStorageConnection {
  id: string;
  user_id: string;
  provider: 'google_drive' | 'onedrive' | 'dropbox' | 'box';
  provider_user_id?: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  is_active: boolean;
  scopes?: string[];
  settings?: any;
  created_at: string;
  updated_at: string;
}

export interface EmailTracking {
  id: string;
  deal_id?: string;
  contact_id?: string;
  thread_id?: string;
  tracking_id: string;
  subject: string;
  sent_at: string;
  opened_at?: string;
  clicked_at?: string;
  replied_at?: string;
  bounce_reason?: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced';
  metadata?: any;
  created_by: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'mention' | 'deal_update' | 'task_assigned' | 'email_received';
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  read: boolean;
  created_at: string;
}

export interface CreateDealData {
  title: string;
  description?: string;
  value?: number;
  currency?: string;
  stage_id: string;
  pipeline_id: string;
  contact_id?: string;
  company_id?: string;
  probability?: number;
  expected_close_date?: string;
  tags?: string[];
  custom_fields?: any;
  engagement_score?: number;
}

export interface UpdateDealData extends Partial<CreateDealData> {
  id: string;
}

export interface DealFilters {
  stage_id?: string;
  owner_id?: string;
  company_id?: string;
  pipeline_id?: string;
  status?: Deal['status'];
  search?: string;
  engagement_score_min?: number;
  engagement_score_max?: number;
  date_range?: {
    start: string;
    end: string;
  };
  last_activity_range?: {
    start: string;
    end: string;
  };
}

export interface KanbanColumn {
  stage: PipelineStage;
  deals: Deal[];
  totalValue: number;
  count: number;
}

export interface EmailIntentCategory {
  id: string;
  name: string;
  description?: string;
  keywords?: string[];
  is_system: boolean;
  created_at: string;
  created_by?: string;
}

export interface ContactIntentClassification {
  id: string;
  contact_id: string;
  intent_category_id: string;
  confidence_score: number;
  evidence_message_ids?: string[];
  is_active: boolean;
  classified_at: string;
  classified_by: 'system' | 'manual' | 'ai';
  created_at: string;
  updated_at: string;
  intent_category?: EmailIntentCategory;
}

// Custom fields configuration
export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'url';
  options?: string[]; // For dropdown type
  required: boolean;
  default_value?: any;
  placeholder?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Lead scoring configuration
export interface LeadScoringConfig {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  scoring_factors: {
    base_score: number;
    activity_weights: {
      email: number;
      call: number;
      meeting: number;
      note: number;
      file: number;
    };
    stage_weights: {
      [stage_id: string]: number;
    };
    recency_penalties: {
      days_7_14: number;
      days_14_plus: number;
    };
    probability_weights: {
      range_0_25: number;
      range_26_50: number;
      range_51_75: number;
      range_76_100: number;
    };
  };
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Lead score log
export interface LeadScoreLog {
  id: string;
  deal_id: string;
  previous_score: number;
  new_score: number;
  change_reason?: string;
  change_source: 'automatic' | 'manual' | 'system';
  created_at: string;
  created_by?: string;
}