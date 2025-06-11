import { supabase } from './supabase';
import { Notification, NotificationFilters, NotificationPreferences } from '../types/notifications';

export class NotificationService {
  /**
   * Get notifications for the current user
   */
  static async getNotifications(filters?: NotificationFilters, limit = 20, offset = 0): Promise<Notification[]> {
    try {
      let query = supabase
        .from('user_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);
      
      // Apply filters
      if (filters) {
        if (filters.type) query = query.eq('type', filters.type);
        if (filters.is_read !== undefined) query = query.eq('is_read', filters.is_read);
        if (filters.is_dismissed !== undefined) query = query.eq('is_dismissed', filters.is_dismissed);
        if (filters.priority) query = query.eq('priority', filters.priority);
        if (filters.entity_type) query = query.eq('entity_type', filters.entity_type);
        if (filters.entity_id) query = query.eq('entity_id', filters.entity_id);
        if (filters.from_date) query = query.gte('created_at', filters.from_date);
        if (filters.to_date) query = query.lte('created_at', filters.to_date);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }
  
  /**
   * Get unread notification count
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .eq('is_dismissed', false);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }
  
  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('mark_notification_read', { p_notification_id: notificationId });
      
      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
  
  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('mark_all_notifications_read');
      
      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }
  
  /**
   * Dismiss a notification
   */
  static async dismiss(notificationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('dismiss_notification', { p_notification_id: notificationId });
      
      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error dismissing notification:', error);
      return false;
    }
  }
  
  /**
   * Dismiss all notifications
   */
  static async dismissAll(): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('dismiss_all_notifications');
      
      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
      return 0;
    }
  }
  
  /**
   * Get user notification preferences
   */
  static async getNotificationPreferences(): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('notification_preferences')
        .maybeSingle();
      
      if (error) throw error;
      return data?.notification_preferences || null;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }
  
  /**
   * Update user notification preferences
   */
  static async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      // First get current preferences
      const { data: currentData, error: fetchError } = await supabase
        .from('user_settings')
        .select('notification_preferences')
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      // Merge with new preferences
      const mergedPreferences = {
        ...(currentData?.notification_preferences || {}),
        ...preferences
      };
      
      // Update preferences
      const { error } = await supabase
        .from('user_settings')
        .update({ notification_preferences: mergedPreferences })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }
  
  /**
   * Subscribe to real-time notifications
   */
  static subscribeToNotifications(callback: (notification: Notification) => void) {
    const channel = supabase
      .channel('user_notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'user_notifications',
          filter: `user_id=eq.${supabase.auth.getUser().then(res => res.data.user?.id)}`
        }, 
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }
  
  /**
   * Create a test notification (for development purposes)
   */
  static async createTestNotification(type: string = 'system'): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('create-test-notification', {
        body: { type }
      });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating test notification:', error);
      return false;
    }
  }
}