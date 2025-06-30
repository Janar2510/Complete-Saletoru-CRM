
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Bell, Shield } from 'lucide-react';
import { loadUserSettings, saveUserSettings } from '../lib/userSettings';
import { useDevMode } from '../contexts/DevModeContext';

export default function Settings() {
  const { isDevMode } = useDevMode();
  const [selectedTab, setSelectedTab] = useState('account');
  const [userSettings, setUserSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

 useEffect(() => {
  const initAuth = async () => {
    if (isDevMode) {
      setUser(fakeUser as User);
      setSession({ user: fakeUser } as Session);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Failed to get session:', error);
    }

    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user);
    } else {
      setSession(null);
      setUser(null);
    }

    setLoading(false);
  };

  initAuth();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    }
  );

  return () => subscription.unsubscribe();
}, [isDevMode, fakeUser]);


  const renderTabContent = () => {
    switch (selectedTab) {
      case 'account':
        return <div>Account Settings UI here</div>;
      case 'notifications':
        return <div>Notification Preferences UI here</div>;
      case 'security':
        return <div>Security & Permissions UI here</div>;
      default:
        return <div>Please select a tab</div>;
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>

      <div className="flex space-x-6">
        {/* Sidebar Tabs */}
        <div className="flex flex-col w-64 bg-[#1e1f30] rounded-2xl shadow-lg p-4 space-y-4">
          <button
            onClick={() => setSelectedTab('account')}
            className={`p-3 text-left rounded-xl border ${
              selectedTab === 'account'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                : 'bg-[#2a2b3d] text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <User size={18} />
              <div>
                <div className="font-semibold">Account Settings</div>
                <div className="text-sm text-gray-400">Profile Information</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedTab('notifications')}
            className={`p-3 text-left rounded-xl border ${
              selectedTab === 'notifications'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                : 'bg-[#2a2b3d] text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Bell size={18} />
              <div>
                <div className="font-semibold">Notifications</div>
                <div className="text-sm text-gray-400">Manage your notification preferences</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedTab('security')}
            className={`p-3 text-left rounded-xl border ${
              selectedTab === 'security'
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                : 'bg-[#2a2b3d] text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Shield size={18} />
              <div>
                <div className="font-semibold">Security & Permissions</div>
                <div className="text-sm text-gray-400">Access control & password settings</div>
              </div>
            </div>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 rounded-xl bg-[#1a1b2e] shadow-lg">
          {loading && <div className="text-gray-400">Loading...</div>}
          {error && <div className="text-red-500">{error}</div>}
          {success && <div className="text-green-500">Settings saved!</div>}
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
