import React, { useState, useEffect } from 'react';
import { X, Bell, Target, Calendar, Mail, User, MessageSquare, Zap, Activity } from 'lucide-react';
import { Notification, NotificationType } from '../../types/notifications';
import { useNavigate } from 'react-router-dom';
import { NotificationService } from '../../lib/notification-service';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  autoCloseDelay?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  autoCloseDelay = 5000
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();
  
  // Auto close after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, autoCloseDelay);
    
    return () => clearTimeout(timer);
  }, [autoCloseDelay, onClose]);
  
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
  const getBackgroundColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 border-l-2 border-red-500';
      case 'high':
        return 'bg-orange-500/10 border-l-2 border-orange-500';
      case 'normal':
        return 'bg-surface';
      case 'low':
        return 'bg-surface';
      default:
        return 'bg-surface';
    }
  };
  
  // Handle click
  const handleClick = async () => {
    // Mark as read
    await NotificationService.markAsRead(notification.id);
    
    // Navigate if action URL is provided
    if (notification.action_url) {
      navigate(notification.action_url);
    }
    
    // Close toast
    onClose();
  };
  
  return (
    <div 
      className={`max-w-sm w-full ${getBackgroundColor(notification.priority)} border border-dark-200 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${
        isClosing ? 'opacity-0 translate-x-full' : 'opacity-100'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(notification.type)}
          </div>
          
          <div className="ml-3 flex-1">
            <p className="text-white font-medium">{notification.title}</p>
            <p className="text-sm text-dark-300 mt-1">{notification.content}</p>
            
            {notification.action_text && (
              <button
                onClick={handleClick}
                className="mt-3 text-sm text-accent hover:text-accent/80 transition-colors"
              >
                {notification.action_text}
              </button>
            )}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsClosing(true);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-dark-200 transition-colors"
          >
            <X className="w-4 h-4 text-dark-400" />
          </button>
        </div>
      </div>
    </div>
  );
};