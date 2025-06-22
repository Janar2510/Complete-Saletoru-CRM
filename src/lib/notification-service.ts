import { supabase } from './supabase';
import { Notification, NotificationFilters, NotificationPreferences } from '../types/notifications';

export class NotificationService {
  private static channel: any = null;
  private static callbacks: Set<(notification: Notification) => void> = new Set();
  private static isSubscribed = false;

  /**
   * Get notifications for the current user
   */
  static async getNotifications(filters?: NotificationFilters, limit = 20, offset = 0): Promise<Notification[]> {
    try {
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return [];
      }

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
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return 0;
      }

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
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return false;
      }

      const { data, error } = await supabase.rpc('mark_notification_read', { p_notification_id: notificationId });
      
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
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return 0;
      }

      const { data, error } = await supabase.rpc('mark_all_notifications_read');
      
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
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return false;
      }

      const { data, error } = await supabase.rpc('dismiss_notification', { p_notification_id: notificationId });
      
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
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return 0;
      }

      const { data, error } = await supabase.rpc('dismiss_all_notifications');
      
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
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return null;
      }

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
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return false;
      }

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
   * Initialize the channel subscription if not already done
   */
  private static async initializeChannel() {
    // Return early if already subscribed
    if (this.isSubscribed || !supabase) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user found');
        return;
      }

      this.channel = supabase
        .channel('user_notifications')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'user_notifications',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            const notification = payload.new as Notification;
            // Call all registered callbacks
            this.callbacks.forEach(callback => {
              try {
                callback(notification);
              } catch (error) {
                console.error('Error in notification callback:', error);
              }
            });
          }
        )
        .subscribe();
      
      // Set subscribed flag immediately after subscribe call
      this.isSubscribed = true;
    } catch (error) {
      console.error('Error initializing notification channel:', error);
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  static subscribeToNotifications(callback: (notification: Notification) => void) {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return () => {}; // Return dummy unsubscribe function
    }

    try {
      // Add callback to the set
      this.callbacks.add(callback);
      
      // Initialize channel if not already done
      this.initializeChannel();
      
      // Return unsubscribe function
      return () => {
        // Remove this specific callback
        this.callbacks.delete(callback);
        
        // If no more callbacks, unsubscribe from the channel
        if (this.callbacks.size === 0 && this.channel) {
          supabase.removeChannel(this.channel);
          this.channel = null;
          this.isSubscribed = false;
        }
      };
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      return () => {}; // Return dummy unsubscribe function
    }
  }
  
  /**
   * Create a test notification (for development purposes)
   */
  static async createTestNotification(type: string = 'system'): Promise<boolean> {
    try {
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return false;
      }

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