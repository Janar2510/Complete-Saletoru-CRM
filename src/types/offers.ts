export interface Offer {
  id: string;
  offer_id: string;
  title: string;
  description?: string;
  contact_id: string;
  deal_id?: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  sent_at?: string;
  viewed_at?: string;
  responded_at?: string;
  expires_at?: string;
  tracking_id?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  created_by: string;
  
  // Relations
  contact?: Contact;
  deal?: Deal;
  files?: OfferFile[];
  activities?: OfferActivity[];
  creator?: any;
}

export interface OfferFile {
  id: string;
  offer_id: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  storage_path: string;
  storage_provider: 'supabase' | 'google_drive' | 'dropbox';
  uploaded_by: string;
  created_at: string;
  uploaded_by_user?: any;
}

export interface OfferActivity {
  id: string;
  offer_id: string;
  activity_type: 'created' | 'sent' | 'viewed' | 'downloaded' | 'accepted' | 'declined' | 'expired';
  description: string;
  metadata?: any;
  created_at: string;
  created_by?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  tags?: string[];
  variables?: string[];
  is_active: boolean;
  usage_count: number;
  last_used_at?: string;
  version: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  
  // Relations
  creator?: any;
  versions?: EmailTemplateVersion[];
}

export interface EmailTemplateVersion {
  id: string;
  template_id: string;
  version: number;
  subject: string;
  content: string;
  changes_summary?: string;
  created_at: string;
  created_by: string;
}

export interface CreateOfferData {
  title: string;
  description?: string;
  contact_id: string;
  deal_id?: string;
  expires_at?: string;
  metadata?: any;
}

export interface UpdateOfferData extends Partial<CreateOfferData> {
  id: string;
}

export interface CreateEmailTemplateData {
  name: string;
  subject: string;
  content: string;
  category: string;
  tags?: string[];
  variables?: string[];
}

export interface UpdateEmailTemplateData extends Partial<CreateEmailTemplateData> {
  id: string;
}

export interface OfferFilters {
  status?: Offer['status'];
  contact_id?: string;
  deal_id?: string;
  created_by?: string;
  date_range?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface EmailTemplateFilters {
  category?: string;
  tags?: string[];
  is_active?: boolean;
  search?: string;
}

// Import types from existing modules
interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  company?: any;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  stage?: any;
}