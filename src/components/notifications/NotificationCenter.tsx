import React, { useState, useEffect } from 'react';
import { Bell, Filter, Search, CheckCheck, X, ArrowLeft, Settings } from 'lucide-react';
import { NotificationService } from '../../lib/notification-service';
import { Notification, NotificationType, NotificationFilters } from '../../types/notifications';
import { NotificationItem } from './NotificationItem';
import { Card } from '../common/Card';
import { useNavigate } from 'react-router-dom';

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  // Load notifications
  useEffect(() => {
    loadNotifications();
    
    // Subscribe to real-time notifications
    const unsubscribe = NotificationService.subscribeToNotifications((notification) => {
      setNotifications(prev => [notification, ...prev]);
    });
    
    return () => {
      unsubscribe();
    };
  }, [filters]);
  
  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await NotificationService.getNotifications(filters, 50);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };
  
  // Mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Dismiss notification
  const handleDismiss = async (notificationId: string) => {
    try {
      await NotificationService.dismiss(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };
  
  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };
  
  // Dismiss all
  const handleDismissAll = async () => {
    try {
      await NotificationService.dismissAll();
      setNotifications([]);
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
    }
  };
  
  // Filter notifications by search term
  const filteredNotifications = notifications.filter(notification => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      notification.title.toLowerCase().includes(searchLower) ||
      notification.content.toLowerCase().includes(searchLower)
    );
  });
  
  // Get notification type options
  const notificationTypes: { value: NotificationType; label: string }[] = [
    { value: 'deal_assignment', label: 'Deal Assignments' },
    { value: 'task_reminder', label: 'Task Reminders' },
    { value: 'ai_suggestion', label: 'AI Suggestions' },
    { value: 'email_tracking', label: 'Email Tracking' },
    { value: 'calendar_reminder', label: 'Calendar Reminders' },
    { value: 'workflow_update', label: 'Workflow Updates' },
    { value: 'mention', label: 'Mentions' },
    { value: 'lead_engagement', label: 'Lead Engagement' },
    { value: 'deal_stage_change', label: 'Deal Stage Changes' },
    { value: 'system', label: 'System' },
  ];
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-dark-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Notifications</h1>
            <p className="text-dark-400">{notifications.length} notifications</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center space-x-2 px-3 py-2 bg-dark-200 hover:bg-dark-300 rounded-lg text-white transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span className="hidden md:inline">Mark All Read</span>
          </button>
          
          <button
            onClick={handleDismissAll}
            className="flex items-center space-x-2 px-3 py-2 bg-dark-200 hover:bg-dark-300 rounded-lg text-white transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="hidden md:inline">Clear All</span>
          </button>
          
          <button
            onClick={() => navigate('/settings?tab=notifications')}
            className="flex items-center space-x-2 px-3 py-2 bg-dark-200 hover:bg-dark-300 rounded-lg text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Settings</span>
          </button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent w-full"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters 
                ? 'bg-accent border-accent text-white' 
                : 'bg-dark-200 border-dark-300 hover:bg-dark-300 text-dark-400'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
        
        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-dark-200/50 rounded-lg">
            <select
              value={filters.type || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                type: e.target.value ? e.target.value as NotificationType : undefined 
              }))}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Types</option>
              {notificationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            
            <select
              value={filters.is_read !== undefined ? String(filters.is_read) : ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                is_read: e.target.value === '' ? undefined : e.target.value === 'true' 
              }))}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Status</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
            
            <select
              value={filters.priority || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                priority: e.target.value ? e.target.value as any : undefined 
              }))}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        )}
      </Card>
      
      {/* Notifications List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">Error loading notifications</p>
            <p className="text-dark-400">{error}</p>
            <button
              onClick={loadNotifications}
              className="mt-4 bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <p className="text-xl font-medium text-white mb-2">No notifications</p>
            <p className="text-dark-400 max-w-md mx-auto">
              You're all caught up! New notifications about your deals, tasks, and other activities will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-dark-200">
            {filteredNotifications.map(notification => (
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
                  }
                }}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};