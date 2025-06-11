import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Settings, AlertCircle } from 'lucide-react';
import { NotificationService } from '../../lib/notification-service';
import { Notification } from '../../types/notifications';
import { NotificationItem } from './NotificationItem';
import { useNavigate } from 'react-router-dom';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load notifications and set up subscription
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    
    // Subscribe to real-time notifications
    const unsubscribe = NotificationService.subscribeToNotifications((notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Play sound if enabled
      playNotificationSound();
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await NotificationService.getNotifications({ is_dismissed: false }, 10);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };
  
  // Load unread count
  const loadUnreadCount = async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };
  
  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.play();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };
  
  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };
  
  // Dismiss all
  const handleDismissAll = async () => {
    try {
      await NotificationService.dismissAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
    }
  };
  
  // Mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Dismiss notification
  const handleDismiss = async (notificationId: string) => {
    try {
      await NotificationService.dismiss(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (!notifications.find(n => n.id === notificationId)?.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };
  
  // Navigate to notification settings
  const handleOpenSettings = () => {
    navigate('/settings?tab=notifications');
    setIsOpen(false);
  };
  
  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      loadNotifications();
      loadUnreadCount();
    }
  };
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={toggleDropdown}
        className="p-2 rounded-lg hover:bg-dark-200 transition-colors relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-dark-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-surface border border-dark-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-200">
            <h3 className="font-semibold text-white">Notifications</h3>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleMarkAllAsRead}
                className="p-1.5 rounded hover:bg-dark-200 transition-colors text-dark-400 hover:text-white"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
              <button
                onClick={handleDismissAll}
                className="p-1.5 rounded hover:bg-dark-200 transition-colors text-dark-400 hover:text-white"
                title="Clear all"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleOpenSettings}
                className="p-1.5 rounded hover:bg-dark-200 transition-colors text-dark-400 hover:text-white"
                title="Notification settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-dark-400">{error}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-dark-400 mx-auto mb-3" />
                <p className="text-white font-medium mb-1">No notifications</p>
                <p className="text-dark-400 text-sm">
                  You're all caught up! New notifications will appear here.
                </p>
              </div>
            ) : (
              notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                  onDismiss={() => handleDismiss(notification.id)}
                  onClick={() => {
                    if (!notification.is_read) {
                      handleMarkAsRead(notification.id);
                    }
                    if (notification.action_url) {
                      navigate(notification.action_url);
                      setIsOpen(false);
                    }
                  }}
                />
              ))
            )}
          </div>
          
          {/* Footer */}
          <div className="p-3 border-t border-dark-200 text-center">
            <button
              onClick={() => {
                navigate('/notifications');
                setIsOpen(false);
              }}
              className="text-accent hover:text-accent/80 text-sm"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};