import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loadUserSettings, saveUserSettings } from '../lib/userSettings';
import { useDevMode } from '../contexts/DevModeContext';
import { User, Bell, Shield } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { isDevMode, fakeUser } = useDevMode();

  const [selectedTab, setSelectedTab] = useState('account');
  const [userSettings, setUserSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const userId = user?.id || (isDevMode ? fakeUser?.id : null);
      if (!userId) return;

      setLoading(true);
      const settings = await loadUserSettings(userId);
      if (settings) {
        setUserSettings(settings);
      } else {
        setError('Could not load settings.');
      }
      setLoading(false);
    };

    fetchSettings();
  }, [user, isDevMode, fakeUser]);

  const handleSave = async () => {
    const userId = user?.id || (isDevMode ? fakeUser?.id : null);
    if (!userId) return;

    try {
      setLoading(true);
      await saveUserSettings(userId, userSettings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Could not save settings.');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'account':
        return <div>Account Settings UI here</div>;
      case 'notifications':
        return <div>Notification Preferences UI here</div>;
      case 'security':
        return <div>Security & Permissions UI here</div>;
      default:
        return <div>Invalid tab</div>;
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="flex space-x-6">
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => setSelectedTab('account')}
            className={`px-4 py-2 rounded-lg text-left ${
              selectedTab === 'account' ? 'bg-blue-700' : 'bg-zinc-800'
            }`}
          >
            <User className="inline-block w-4 h-4 mr-2" />
            Account Settings
          </button>
          <button
            onClick={() => setSelectedTab('notifications')}
            className={`px-4 py-2 rounded-lg text-left ${
              selectedTab === 'notifications' ? 'bg-blue-700' : 'bg-zinc-800'
            }`}
          >
            <Bell className="inline-block w-4 h-4 mr-2" />
            Notifications
          </button>
          <button
            onClick={() => setSelectedTab('security')}
            className={`px-4 py-2 rounded-lg text-left ${
              selectedTab === 'security' ? 'bg-blue-700' : 'bg-zinc-800'
            }`}
          >
            <Shield className="inline-block w-4 h-4 mr-2" />
            Security & Permissions
          </button>
        </div>

        <div className="flex-1 p-4 bg-zinc-900 rounded-lg">
          {error && <p className="text-red-400 mb-2">{error}</p>}
          {success && <p className="text-green-400 mb-2">✅ Settings saved!</p>}
          {loading ? <p>Loading settings...</p> : renderTabContent()}
          {!loading && (
            <button
              onClick={handleSave}
              className="mt-4 px-4 py-2 rounded bg-green-600 hover:bg-green-700"
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
