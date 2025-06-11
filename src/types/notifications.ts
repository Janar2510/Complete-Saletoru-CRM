export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  entity_type?: EntityType;
  entity_id?: string;
  action_url?: string;
  action_text?: string;
  is_read: boolean;
  is_dismissed: boolean;
  priority: NotificationPriority;
  metadata?: Record<string, any>;
  created_at: string;
  expires_at?: string;
  delivery_status: DeliveryStatus;
  retry_count: number;
}

export type NotificationType = 
  | 'deal_assignment'
  | 'task_reminder'
  | 'ai_suggestion'
  | 'email_tracking'
  | 'calendar_reminder'
  | 'workflow_update'
  | 'mention'
  | 'lead_engagement'
  | 'deal_stage_change'
  | 'system';

export type EntityType = 
  | 'deal'
  | 'contact'
  | 'company'
  | 'task'
  | 'email'
  | 'calendar_event'
  | 'workflow'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying';

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title_template: string;
  content_template: string;
  action_url_template?: string;
  action_text_template?: string;
  default_priority: NotificationPriority;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  sound_enabled: boolean;
  notification_types: {
    [key in NotificationType]: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
    timezone: string;
  };
  frequency: 'realtime' | 'hourly' | 'daily';
}

export interface NotificationFilters {
  type?: NotificationType;
  is_read?: boolean;
  is_dismissed?: boolean;
  priority?: NotificationPriority;
  entity_type?: EntityType;
  entity_id?: string;
  from_date?: string;
  to_date?: string;
}