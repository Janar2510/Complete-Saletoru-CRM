import React, { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, Mail, Smartphone, Clock, Save, AlertCircle, Check } from 'lucide-react';
import { NotificationService } from '../../lib/notification-service';
import { NotificationPreferences, NotificationType } from '../../types/notifications';
import { Card } from '../common/Card';

interface NotificationPreferencesPanelProps {
  className?: string;
}

export const NotificationPreferencesPanel: React.FC<NotificationPreferencesPanelProps> = ({ className = '' }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Load preferences
  useEffect(() => {
    loadPreferences();
  }, []);
  
  // Load preferences
  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await NotificationService.getNotificationPreferences();
      
      // If no preferences found, use defaults
      if (!data) {
        setPreferences({
          email_notifications: true,
          push_notifications: true,
          sound_enabled: true,
          notification_types: {
            deal_assignment: true,
            task_reminder: true,
            ai_suggestion: true,
            email_tracking: true,
            calendar_reminder: true,
            workflow_update: true,
            mention: true,
            lead_engagement: true,
            deal_stage_change: true,
            system: true
          },
          quiet_hours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
            timezone: 'UTC'
          },
          frequency: 'realtime'
        });
      } else {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };
  
  // Save preferences
  const savePreferences = async () => {
    if (!preferences) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      const success = await NotificationService.updateNotificationPreferences(preferences);
      
      if (success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      setError('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };
  
  // Update a specific preference
  const updatePreference = (key: string, value: any) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [key]: value
    });
  };
  
  // Update a notification type preference
  const updateNotificationType = (type: NotificationType, enabled: boolean) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      notification_types: {
        ...preferences.notification_types,
        [type]: enabled
      }
    });
  };
  
  // Update quiet hours preference
  const updateQuietHours = (key: string, value: any) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      quiet_hours: {
        ...preferences.quiet_hours,
        [key]: value
      }
    });
  };
  
  // Get notification type label
  const getNotificationTypeLabel = (type: NotificationType): string => {
    switch (type) {
      case 'deal_assignment': return 'Deal Assignments';
      case 'task_reminder': return 'Task Reminders';
      case 'ai_suggestion': return 'AI Suggestions';
      case 'email_tracking': return 'Email Tracking';
      case 'calendar_reminder': return 'Calendar Reminders';
      case 'workflow_update': return 'Workflow Updates';
      case 'mention': return 'Mentions';
      case 'lead_engagement': return 'Lead Engagement';
      case 'deal_stage_change': return 'Deal Stage Changes';
      case 'system': return 'System Notifications';
    }
  };
  
  // If still loading, show loading spinner
  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Card>
    );
  }
  
  // If no preferences, show error
  if (!preferences) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">Error loading preferences</p>
          <p className="text-dark-400">{error || 'Failed to load notification preferences'}</p>
          <button
            onClick={loadPreferences}
            className="mt-4 bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Notification Preferences</h2>
            <p className="text-dark-400 text-sm">Customize how and when you receive notifications</p>
          </div>
        </div>
      </div>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 p-4 rounded-lg mb-6 flex items-start">
          <Check className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>Notification preferences saved successfully!</p>
        </div>
      )}
      
      <div className="space-y-8">
        {/* General Preferences */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">General Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-dark-400" />
                <div>
                  <p className="text-white">Email Notifications</p>
                  <p className="text-sm text-dark-400">Receive notifications via email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.email_notifications}
                  onChange={(e) => updatePreference('email_notifications', e.target.checked)}
                />
                <div className="w-11 h-6 bg-dark-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-dark-400" />
                <div>
                  <p className="text-white">Push Notifications</p>
                  <p className="text-sm text-dark-400">Receive push notifications on your devices</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.push_notifications}
                  onChange={(e) => updatePreference('push_notifications', e.target.checked)}
                />
                <div className="w-11 h-6 bg-dark-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {preferences.sound_enabled ? (
                  <Volume2 className="w-5 h-5 text-dark-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-dark-400" />
                )}
                <div>
                  <p className="text-white">Sound Alerts</p>
                  <p className="text-sm text-dark-400">Play sound when new notifications arrive</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.sound_enabled}
                  onChange={(e) => updatePreference('sound_enabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-dark-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Quiet Hours */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Quiet Hours</h3>
          <div className="bg-dark-200/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-dark-400" />
                <div>
                  <p className="text-white">Enable Quiet Hours</p>
                  <p className="text-sm text-dark-400">Pause notifications during specific hours</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.quiet_hours.enabled}
                  onChange={(e) => updateQuietHours('enabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-dark-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>
            
            {preferences.quiet_hours.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours.start}
                    onChange={(e) => updateQuietHours('start', e.target.value)}
                    className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours.end}
                    onChange={(e) => updateQuietHours('end', e.target.value)}
                    className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">
                    Timezone
                  </label>
                  <select
                    value={preferences.quiet_hours.timezone}
                    onChange={(e) => updateQuietHours('timezone', e.target.value)}
                    className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Australia/Sydney">Sydney (AEST)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Notification Types */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Notification Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(preferences.notification_types).map((type) => (
              <div key={type} className="flex items-center justify-between bg-dark-200/50 p-3 rounded-lg">
                <span className="text-white">{getNotificationTypeLabel(type as NotificationType)}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences.notification_types[type as NotificationType]}
                    onChange={(e) => updateNotificationType(type as NotificationType, e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-dark-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Delivery Frequency */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Delivery Frequency</h3>
          <div className="bg-dark-200/50 p-4 rounded-lg">
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="frequency"
                  value="realtime"
                  checked={preferences.frequency === 'realtime'}
                  onChange={() => updatePreference('frequency', 'realtime')}
                  className="text-accent focus:ring-accent"
                />
                <div>
                  <p className="text-white">Real-time</p>
                  <p className="text-sm text-dark-400">Receive notifications as they happen</p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="frequency"
                  value="hourly"
                  checked={preferences.frequency === 'hourly'}
                  onChange={() => updatePreference('frequency', 'hourly')}
                  className="text-accent focus:ring-accent"
                />
                <div>
                  <p className="text-white">Hourly Digest</p>
                  <p className="text-sm text-dark-400">Receive a summary every hour</p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="frequency"
                  value="daily"
                  checked={preferences.frequency === 'daily'}
                  onChange={() => updatePreference('frequency', 'daily')}
                  className="text-accent focus:ring-accent"
                />
                <div>
                  <p className="text-white">Daily Digest</p>
                  <p className="text-sm text-dark-400">Receive a summary once a day</p>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="bg-accent hover:bg-accent/80 disabled:opacity-70 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Card>
  );
};