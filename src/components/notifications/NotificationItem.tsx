import React from 'react';
import { Check, X, Bell, Calendar, Mail, Target, User, MessageSquare, Zap, Activity } from 'lucide-react';
import { Notification, NotificationType } from '../../types/notifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onDismiss: () => void;
  onClick: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDismiss,
  onClick
}) => {
  // Get icon based on notification type
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'deal_assignment':
      case 'deal_stage_change':
        return <Target className="w-5 h-5 text-blue-400" />;
      case 'task_reminder':
        return <Calendar className="w-5 h-5 text-yellow-400" />;
      case 'ai_suggestion':
        return <Zap className="w-5 h-5 text-purple-400" />;
      case 'email_tracking':
        return <Mail className="w-5 h-5 text-green-400" />;
      case 'calendar_reminder':
        return <Calendar className="w-5 h-5 text-orange-400" />;
      case 'workflow_update':
        return <Activity className="w-5 h-5 text-indigo-400" />;
      case 'mention':
        return <MessageSquare className="w-5 h-5 text-pink-400" />;
      case 'lead_engagement':
        return <User className="w-5 h-5 text-teal-400" />;
      default:
        return <Bell className="w-5 h-5 text-dark-400" />;
    }
  };
  
  // Get background color based on priority
  const getBackgroundColor = (priority: string, isRead: boolean) => {
    if (isRead) return 'bg-dark-200/30';
    
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 border-l-2 border-red-500';
      case 'high':
        return 'bg-orange-500/10 border-l-2 border-orange-500';
      case 'normal':
        return 'bg-dark-200/50';
      case 'low':
        return 'bg-dark-200/50';
      default:
        return 'bg-dark-200/50';
    }
  };
  
  return (
    <div 
      className={`p-4 ${getBackgroundColor(notification.priority, notification.is_read)} hover:bg-dark-200 transition-colors cursor-pointer relative group`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${notification.is_read ? 'text-dark-300' : 'text-white'} line-clamp-1`}>
            {notification.title}
          </p>
          <p className={`text-sm ${notification.is_read ? 'text-dark-400' : 'text-dark-300'} line-clamp-2 mt-1`}>
            {notification.content}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-dark-500">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
            {notification.action_text && (
              <span className="text-xs text-accent">
                {notification.action_text}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Action buttons (visible on hover) */}
      <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.is_read && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead();
            }}
            className="p-1 bg-dark-300/50 rounded-full hover:bg-dark-300 transition-colors"
            title="Mark as read"
          >
            <Check className="w-3 h-3 text-green-400" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="p-1 bg-dark-300/50 rounded-full hover:bg-dark-300 transition-colors"
          title="Dismiss"
        >
          <X className="w-3 h-3 text-dark-400" />
        </button>
      </div>
    </div>
  );
};