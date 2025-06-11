import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Users, 
  GitBranch, 
  Zap, 
  Shield, 
  CreditCard,
  Search,
  ChevronRight,
  User,
  Bell,
  Palette,
  Database,
  Lock,
  Globe,
  Moon,
  Sun,
  Languages,
  Clock,
  Mail,
  Smartphone,
  Volume2,
  VolumeX,
  Save,
  Check,
  AlertCircle
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { NotificationPreferencesPanel } from '../components/notifications/NotificationPreferencesPanel';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Check if tab is specified in URL
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'account';
  });
  
  // User settings state
  const [userSettings, setUserSettings] = useState({
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    notification_preferences: {
      email_notifications: true,
      push_notifications: true,
      sound_enabled: true
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Update URL when tab changes
    navigate(`/settings?tab=${activeTab}`, { replace: true });
    
    // Load settings for the active tab
    if (activeTab === 'account') {
      loadUserSettings();
    }
  }, [activeTab]);

  const loadUserSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setUserSettings(data);
      }
    } catch (err) {
      console.error('Error loading user settings:', err);
      setError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveUserSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...userSettings
        })
        .select();
      
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving user settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const settingsCategories = [
    {
      id: 'account',
      title: 'Account & Profile',
      description: 'Manage your personal account settings',
      icon: User,
      color: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-400',
      items: [
        { name: 'Profile Information', description: 'Update your name, email, and avatar' },
        { name: 'Password & Security', description: 'Change password and security settings' },
        { name: 'Preferences', description: 'Set your timezone, language, and display options' },
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage your notification preferences',
      icon: Bell,
      color: 'from-purple-500/20 to-purple-600/20',
      iconColor: 'text-purple-400',
      items: [
        { name: 'Notification Settings', description: 'Configure how and when you receive notifications' },
        { name: 'Email Notifications', description: 'Manage email notification preferences' },
        { name: 'Push Notifications', description: 'Configure mobile push notifications' },
        { name: 'Alert Sounds', description: 'Customize notification sounds' },
      ]
    },
    {
      id: 'pipelines',
      title: 'Pipeline Configuration',
      description: 'Customize your sales pipelines and stages',
      icon: GitBranch,
      color: 'from-green-500/20 to-green-600/20',
      iconColor: 'text-green-400',
      items: [
        { name: 'Pipeline Builder', description: 'Create and modify sales pipelines' },
        { name: 'Stage Management', description: 'Configure pipeline stages and probabilities' },
        { name: 'Templates', description: 'Use pre-built pipeline templates' },
        { name: 'Default Settings', description: 'Set default pipeline for new deals' },
      ]
    },
    {
      id: 'automations',
      title: 'Automation & Workflows',
      description: 'Set up automated processes and triggers',
      icon: Zap,
      color: 'from-orange-500/20 to-orange-600/20',
      iconColor: 'text-orange-400',
      items: [
        { name: 'Workflow Builder', description: 'Create automated workflows and triggers' },
        { name: 'Email Automation', description: 'Set up automated email sequences' },
        { name: 'Task Automation', description: 'Automate task creation and assignments' },
        { name: 'Execution History', description: 'View automation logs and performance' },
      ]
    },
    {
      id: 'permissions',
      title: 'Security & Permissions',
      description: 'Configure access control and security settings',
      icon: Shield,
      color: 'from-red-500/20 to-red-600/20',
      iconColor: 'text-red-400',
      adminOnly: true,
      items: [
        { name: 'Permission Matrix', description: 'Configure granular permissions' },
        { name: 'Role Management', description: 'Create and manage user roles' },
        { name: 'Security Policies', description: 'Set password and access policies' },
        { name: 'API Access', description: 'Manage API keys and integrations' },
      ]
    },
    {
      id: 'billing',
      title: 'Billing & Plans',
      description: 'Manage subscription and billing information',
      icon: CreditCard,
      color: 'from-indigo-500/20 to-indigo-600/20',
      iconColor: 'text-indigo-400',
      adminOnly: true,
      items: [
        { name: 'Current Plan', description: 'View your current subscription details' },
        { name: 'Usage Analytics', description: 'Monitor feature usage and limits' },
        { name: 'Billing History', description: 'View invoices and payment history' },
        { name: 'Plan Upgrade', description: 'Upgrade or change your subscription' },
      ]
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: 'Connect with external tools and services',
      icon: Globe,
      color: 'from-teal-500/20 to-teal-600/20',
      iconColor: 'text-teal-400',
      items: [
        { name: 'Email Providers', description: 'Connect Gmail, Outlook, and other email services' },
        { name: 'Calendar Sync', description: 'Sync with Google Calendar, Outlook Calendar' },
        { name: 'Third-party Apps', description: 'Connect with Slack, Zapier, and more' },
        { name: 'API Configuration', description: 'Manage API connections and webhooks' },
      ]
    },
    {
      id: 'system',
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      icon: Database,
      color: 'from-gray-500/20 to-gray-600/20',
      iconColor: 'text-gray-400',
      adminOnly: true,
      items: [
        { name: 'Data Management', description: 'Import, export, and backup data' },
        { name: 'Custom Fields', description: 'Create custom fields for deals and contacts' },
        { name: 'Email Templates', description: 'Manage system email templates' },
        { name: 'System Logs', description: 'View system activity and error logs' },
      ]
    }
  ];

  const isAdmin = user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'developer_admin';
  const filteredCategories = settingsCategories.filter(category => 
    !category.adminOnly || isAdmin
  );

  const searchResults = filteredCategories.filter(category =>
    category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.items.some(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-400" />
                Account Settings
              </h2>
              
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6 flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              
              {success && (
                <div className="bg-green-500/20 border border-green-500/30 text-green-400 p-4 rounded-lg mb-6 flex items-start">
                  <Check className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p>Settings saved successfully!</p>
                </div>
              )}
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={user?.user_metadata?.full_name || ''}
                      disabled
                      className="w-full px-3 py-2 bg-dark-200/50 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 bg-dark-200/50 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
                
                <div className="border-t border-dark-200 pt-6">
                  <h3 className="text-lg font-medium text-white mb-4">Preferences</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Theme
                      </label>
                      <div className="flex space-x-4">
                        <label className={`flex items-center justify-center p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                          userSettings.theme === 'dark' 
                            ? 'border-accent bg-accent/10' 
                            : 'border-dark-300 hover:border-dark-200'
                        }`}>
                          <input
                            type="radio"
                            name="theme"
                            value="dark"
                            checked={userSettings.theme === 'dark'}
                            onChange={() => setUserSettings({...userSettings, theme: 'dark'})}
                            className="sr-only"
                          />
                          <Moon className="w-5 h-5 text-white" />
                          <span className="ml-2 text-white">Dark</span>
                        </label>
                        
                        <label className={`flex items-center justify-center p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                          userSettings.theme === 'light' 
                            ? 'border-accent bg-accent/10' 
                            : 'border-dark-300 hover:border-dark-200'
                        }`}>
                          <input
                            type="radio"
                            name="theme"
                            value="light"
                            checked={userSettings.theme === 'light'}
                            onChange={() => setUserSettings({...userSettings, theme: 'light'})}
                            className="sr-only"
                          />
                          <Sun className="w-5 h-5 text-white" />
                          <span className="ml-2 text-white">Light</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Language
                      </label>
                      <select
                        value={userSettings.language}
                        onChange={(e) => setUserSettings({...userSettings, language: e.target.value})}
                        className="w-full px-3 py-2 bg-dark-200/50 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Timezone
                      </label>
                      <select
                        value={userSettings.timezone}
                        onChange={(e) => setUserSettings({...userSettings, timezone: e.target.value})}
                        className="w-full px-3 py-2 bg-dark-200/50 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Paris">Paris (CET)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-dark-200 pt-6">
                  <h3 className="text-lg font-medium text-white mb-4">Notification Preferences</h3>
                  
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
                          checked={userSettings.notification_preferences.email_notifications}
                          onChange={(e) => setUserSettings({
                            ...userSettings, 
                            notification_preferences: {
                              ...userSettings.notification_preferences,
                              email_notifications: e.target.checked
                            }
                          })}
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
                          checked={userSettings.notification_preferences.push_notifications}
                          onChange={(e) => setUserSettings({
                            ...userSettings, 
                            notification_preferences: {
                              ...userSettings.notification_preferences,
                              push_notifications: e.target.checked
                            }
                          })}
                        />
                        <div className="w-11 h-6 bg-dark-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {userSettings.notification_preferences.sound_enabled ? (
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
                          checked={userSettings.notification_preferences.sound_enabled}
                          onChange={(e) => setUserSettings({
                            ...userSettings, 
                            notification_preferences: {
                              ...userSettings.notification_preferences,
                              sound_enabled: e.target.checked
                            }
                          })}
                        />
                        <div className="w-11 h-6 bg-dark-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4 border-t border-dark-200">
                  <button
                    onClick={saveUserSettings}
                    disabled={loading}
                    className="bg-accent hover:bg-accent/80 disabled:opacity-70 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Save Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      case 'notifications':
        return <NotificationPreferencesPanel className="animate-fade-in" />;
      default:
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SettingsIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Select a setting to configure</h3>
                <p className="text-dark-400 max-w-md mx-auto">
                  Choose a setting category from the sidebar to configure your SaleToru CRM experience.
                </p>
              </div>
            </Card>
          </motion.div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-dark-400">Manage your SaleToru CRM configuration</p>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-dark-400">
          <SettingsIcon className="w-4 h-4" />
          <span>System Configuration</span>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="p-4 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-dark-200/70 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent w-full"
            />
          </div>
        </Card>
      </motion.div>

      {/* Settings Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="md:col-span-1"
        >
          <Card className="p-4 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
            <nav>
              <ul className="space-y-2">
                {filteredCategories.map((category, index) => {
                  const IconComponent = category.icon;
                  return (
                    <motion.li 
                      key={category.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                    >
                      <button
                        onClick={() => setActiveTab(category.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                          activeTab === category.id
                            ? 'bg-gradient-to-r from-accent/20 to-purple-500/20 text-white border border-accent/30'
                            : 'text-white hover:bg-dark-200/70'
                        }`}
                      >
                        <div className={`w-10 h-10 bg-gradient-to-br ${category.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className={`w-5 h-5 ${category.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{category.title}</p>
                          <p className="text-xs text-dark-400 truncate">{category.description}</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${activeTab === category.id ? 'rotate-90' : ''}`} />
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            </nav>
          </Card>
        </motion.div>
        
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="md:col-span-3"
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;