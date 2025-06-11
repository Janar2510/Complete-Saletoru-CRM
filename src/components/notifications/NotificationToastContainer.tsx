import React, { useState, useEffect } from 'react';
import { NotificationToast } from './NotificationToast';
import { Notification } from '../../types/notifications';
import { NotificationService } from '../../lib/notification-service';

export const NotificationToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Notification[]>([]);
  
  // Subscribe to real-time notifications
  useEffect(() => {
    // Only subscribe if supabase is available
    if (!window.location.href.includes('login')) {
      try {
        const unsubscribe = NotificationService.subscribeToNotifications((notification) => {
          // Add new notification to toasts
          setToasts(prev => [notification, ...prev]);
          
          // Play sound if enabled
          playNotificationSound();
        });
        
        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Error subscribing to notifications:', error);
      }
    }
  }, []);
  
  // Play notification sound
  const playNotificationSound = async () => {
    try {
      // Check if sound is enabled in preferences
      const preferences = await NotificationService.getNotificationPreferences();
      
      if (preferences?.sound_enabled) {
        const audio = new Audio('/notification-sound.mp3');
        audio.play();
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };
  
  // Remove toast
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  // Limit to 3 toasts at a time
  const visibleToasts = toasts.slice(0, 3);
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {visibleToasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <NotificationToast
            notification={toast}
            onClose={() => removeToast(toast.id)}
            autoCloseDelay={5000}
          />
        </div>
      ))}
    </div>
  );
};