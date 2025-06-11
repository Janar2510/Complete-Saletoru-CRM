export interface AILog {
  id: string;
  session_id: string;
  user_id: string;
  prompt_text: string;
  response_text: string;
  response_type: 'general' | 'analytics' | 'suggestion' | 'command' | 'error' | 'lead_summary' | 'pipeline_coach' | 'user_report' | 'email_draft';
  context_data?: any;
  processing_time_ms?: number;
  tokens_used?: number;
  confidence_score?: number;
  feedback_rating?: number;
  created_at: string;
}

export interface AISession {
  id: string;
  user_id: string;
  session_name?: string;
  context_summary?: string;
  last_activity_at: string;
  is_active: boolean;
  session_data?: any;
  created_at: string;
  expires_at: string;
}

export interface AIPreferences {
  id: string;
  user_id: string;
  response_style: 'professional' | 'casual' | 'detailed' | 'concise';
  auto_suggestions: boolean;
  digest_frequency: 'never' | 'daily' | 'weekly' | 'monthly';
  preferred_timezone: string;
  notification_settings: {
    mentions: boolean;
    digests: boolean;
    alerts: boolean;
  };
  data_access_level: 'limited' | 'standard' | 'full';
  created_at: string;
  updated_at: string;
}

export interface AIKnowledgeBase {
  id: string;
  category: 'deals' | 'contacts' | 'companies' | 'analytics' | 'workflows' | 'general';
  topic: string;
  content: string;
  keywords: string[];
  relevance_score: number;
  usage_count: number;
  last_used_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AICommandTemplate {
  id: string;
  command_name: string;
  command_pattern: string;
  response_template: string;
  required_permissions: string[];
  category: string;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: any;
  confidence?: number;
  actions?: ChatAction[];
}

export interface ChatAction {
  id: string;
  label: string;
  action: string;
  data?: any;
}

export interface AIAnalytics {
  pipeline_summary: {
    total_deals: number;
    total_value: number;
    conversion_rate: number;
    avg_deal_size: number;
    top_stage: string;
  };
  performance_metrics: {
    deals_closed_this_month: number;
    revenue_this_month: number;
    activities_completed: number;
    response_time_avg: number;
  };
  insights: string[];
  recommendations: string[];
}

export interface AIContext {
  user_role: string;
  permissions: string[];
  recent_activity: any[];
  current_page: string;
  selected_entities: any[];
}

// New interfaces for enhanced CRM intelligence

export interface PipelineAnalysis {
  totalDeals: number;
  totalValue: number;
  stageDistribution: Record<string, {
    count: number;
    value: number;
    conversionRate: number;
  }>;
  bottlenecks: {
    stageId: string;
    stageName: string;
    dropoffRate: number;
  }[];
  insights: string[];
  recommendations: string[];
}

export interface LeadPrioritization {
  topLeads: {
    id: string;
    name: string;
    score: number;
    company?: string;
    lastInteraction?: string;
    engagementMetrics?: any;
  }[];
  recommendations: string[];
}

export interface EmailDraft {
  subject: string;
  body: string;
  dealInfo: {
    id: string;
    title: string;
    value: number;
    stage: string;
  };
  contactInfo?: {
    name: string;
    email: string;
  };
}

export interface UserPerformance {
  userId: string;
  userName: string;
  metrics: {
    totalDeals: number;
    openDeals: number;
    wonDeals: number;
    lostDeals: number;
    totalValue: number;
    wonValue: number;
    winRate: number;
  };
  recentActivity: {
    type: string;
    timestamp: string;
    details: any;
  }[];
  insights: string[];
  recommendations: string[];
}

// AI Task API interfaces
export interface SuggestedTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: 'follow_up' | 'research' | 'proposal' | 'meeting' | 'admin';
  dealId?: string;
  contactId?: string;
  estimatedTime: number; // in minutes
  dueDate?: string;
  reasoning: string;
}

export interface TaskSuggestion {
  id: string;
  title: string;
  description?: string;
  type: 'follow_up' | 'check_in' | 'prepare' | 'review';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  related_deal?: {
    id: string;
    title: string;
  };
  related_contact?: {
    id: string;
    name: string;
  };
  reason: string;
}

export interface Bottleneck {
  id: string;
  type: 'deal' | 'task' | 'contact';
  entity_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  idle_days: number;
}

export interface ProductivityInsight {
  id: string;
  category: 'time_management' | 'deal_progress' | 'contact_engagement' | 'task_completion';
  title: string;
  description: string;
  metric_value?: number;
  metric_unit?: string;
  metric_change?: number;
  action_url?: string;
  action_label?: string;
}

export interface FocusTimeSlot {
  start: string;
  end: string;
  quality_score: number;
  reason: string;
}