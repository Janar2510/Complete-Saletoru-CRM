import { Deal } from './deals';

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  country_code?: string;
  title?: string;
  company_id?: string;
  avatar_url?: string;
  social_profiles?: any;
  tags?: string[];
  status: 'active' | 'inactive' | 'prospect' | 'customer';
  last_contacted_at?: string;
  last_interaction_at?: string; // New field for lead scoring
  lead_score?: number; // New field for lead scoring
  engagement_metrics?: any; // New field for lead scoring
  owner_id?: string;
  lead_source?: string;
  linkedin_url?: string;
  twitter_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  
  // Relations
  company?: Company;
  owner?: any;
  activities?: ContactActivity[];
  notes_list?: ContactNote[];
  files?: ContactFile[];
  deals_count?: number;
  deals?: Deal[];
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
  annual_revenue?: number;
  employee_count?: number;
  status: 'active' | 'inactive' | 'prospect' | 'customer' | 'partner';
  parent_company_id?: string;
  founded_year?: number;
  linkedin_url?: string;
  twitter_url?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  
  // Relations
  parent_company?: Company;
  child_companies?: Company[];
  contacts?: Contact[];
  contacts_count?: number;
  deals_count?: number;
  total_deal_value?: number;
  notes_list?: CompanyNote[];
  files?: CompanyFile[];
}

export interface ContactActivity {
  id: string;
  contact_id: string;
  activity_type: 'email' | 'call' | 'meeting' | 'note' | 'task' | 'deal_created' | 'deal_updated';
  title: string;
  description?: string;
  metadata?: any;
  created_at: string;
  created_by: string;
  created_by_user?: any;
}

export interface ContactNote {
  id: string;
  contact_id: string;
  content: string;
  note_type: 'general' | 'call' | 'email' | 'meeting' | 'task';
  mentioned_users?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_user?: any;
}

export interface CompanyNote {
  id: string;
  company_id: string;
  content: string;
  note_type: 'general' | 'call' | 'email' | 'meeting' | 'task';
  mentioned_users?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_user?: any;
}

export interface ContactFile {
  id: string;
  contact_id: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  storage_path: string;
  storage_provider: 'supabase' | 'google_drive' | 'dropbox';
  uploaded_by: string;
  created_at: string;
  uploaded_by_user?: any;
}

export interface CompanyFile {
  id: string;
  company_id: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  storage_path: string;
  storage_provider: 'supabase' | 'google_drive' | 'dropbox';
  uploaded_by: string;
  created_at: string;
  uploaded_by_user?: any;
}

export interface ContactDuplicate {
  id: string;
  contact_id_1: string;
  contact_id_2: string;
  similarity_score: number;
  status: 'pending' | 'merged' | 'ignored';
  merge_decision?: any;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  contact_1?: Contact;
  contact_2?: Contact;
}

export interface DataEnrichmentLog {
  id: string;
  entity_type: 'contact' | 'company';
  entity_id: string;
  provider: string;
  request_data?: any;
  response_data?: any;
  status: 'success' | 'failed' | 'partial';
  created_at: string;
  created_by: string;
}

export interface LeadScoreLog {
  id: string;
  entity_type: 'contact' | 'deal';
  entity_id: string;
  previous_score: number;
  new_score: number;
  change_reason?: string;
  change_source: 'automatic' | 'manual' | 'system';
  created_at: string;
  created_by?: string;
}

export interface LeadScoringConfig {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  config_data: any;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateContactData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  country_code?: string;
  title?: string;
  company_id?: string;
  avatar_url?: string;
  social_profiles?: any;
  tags?: string[];
  status?: Contact['status'];
  owner_id?: string;
  lead_source?: string;
  linkedin_url?: string;
  twitter_url?: string;
  notes?: string;
  lead_score?: number;
  engagement_metrics?: any;
}

export interface UpdateContactData extends Partial<CreateContactData> {
  id: string;
}

export interface CreateCompanyData {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  phone?: string;
  email?: string;
  address?: any;
  website?: string;
  logo_url?: string;
  annual_revenue?: number;
  employee_count?: number;
  status?: Company['status'];
  parent_company_id?: string;
  founded_year?: number;
  linkedin_url?: string;
  twitter_url?: string;
  description?: string;
}

export interface UpdateCompanyData extends Partial<CreateCompanyData> {
  id: string;
}

export interface ContactFilters {
  search?: string;
  status?: Contact['status'];
  owner_id?: string;
  company_id?: string;
  tags?: string[];
  lead_source?: string;
  lead_score_min?: number;
  lead_score_max?: number;
  last_contacted_range?: {
    start: string;
    end: string;
  };
  last_interaction_range?: {
    start: string;
    end: string;
  };
}

export interface CompanyFilters {
  search?: string;
  status?: Company['status'];
  industry?: string;
  size?: string;
  revenue_range?: {
    min: number;
    max: number;
  };
  employee_range?: {
    min: number;
    max: number;
  };
}

export interface BulkAction {
  action: 'delete' | 'assign' | 'update_status' | 'add_tags' | 'export' | 'update_lead_score';
  entity_ids: string[];
  data?: any;
}

export interface EnrichmentProvider {
  name: string;
  api_key?: string;
  enabled: boolean;
  rate_limit?: number;
  cost_per_request?: number;
}