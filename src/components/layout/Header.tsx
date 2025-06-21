import React, { useState } from 'react';
import { Search, Calendar, HelpCircle, Globe, Menu, LogOut, CreditCard, Settings, Code } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { usePlan } from '../../contexts/PlanContext';
import { NotificationBell } from '../notifications/NotificationBell';
import { useDevMode } from '../../contexts/DevModeContext';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, signOut } = useAuth();
  const { currentPlan } = usePlan();
  const { isDevMode, toggleDevMode } = useDevMode();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { t, i18n } = useTranslation();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const userName = user?.user_metadata?.full_name || 'User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
  const userRole = user?.user_metadata?.role || 'user';

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'starter':
        return 'bg-gray-500/20 text-gray-400';
      case 'pro':
        return 'bg-blue-500/20 text-blue-400';
      case 'team':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'et' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };

  return (
    <header className="bg-surface/80 backdrop-blur-sm border-b border-dark-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-dark-200 transition-colors"
          >
            <Menu className="w-5 h-5 text-dark-400" />
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder={`${t('common.search')}...`}
              className="pl-10 pr-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent w-80"
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-dark-400 bg-dark-300 px-1.5 py-0.5 rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          <Link 
            to="/pricing" 
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${getPlanBadgeColor(currentPlan)}`}
          >
            <CreditCard className="w-4 h-4" />
            <span className="text-sm font-medium capitalize">{currentPlan} Plan</span>
          </Link>
          
          {isDevMode && (
            <button
              onClick={() => navigate('/debug-tools')}
              className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
              title="Debug Tools"
            >
              <Code className="w-5 h-5" />
            </button>
          )}
          
          <button 
            onClick={toggleLanguage}
            className="flex items-center space-x-2 text-sm text-dark-400 p-2 rounded-lg hover:bg-dark-200 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span className="bg-accent text-white px-2 py-1 rounded text-xs font-medium">
              {i18n.language.toUpperCase()}
            </span>
          </button>
          
          <button className="p-2 rounded-lg hover:bg-dark-200 transition-colors">
            <Calendar className="w-5 h-5 text-dark-400" />
          </button>
          
          <button className="p-2 rounded-lg hover:bg-dark-200 transition-colors">
            <HelpCircle className="w-5 h-5 text-dark-400" />
          </button>
          
          {/* Notification Bell */}
          <NotificationBell />
          
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 ml-4 cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-accent rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">{userInitials}</span>
              </div>
              <div className="hidden md:block">
                <span className="text-sm font-medium text-white">{userName}</span>
                <span className="text-xs text-dark-400 block capitalize">{userRole}</span>
              </div>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-surface border border-dark-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-dark-200">
                  <p className="font-medium text-white">{userName}</p>
                  <p className="text-xs text-dark-400">{user?.email}</p>
                  <p className="text-xs text-accent mt-1 capitalize">{userRole}</p>
                </div>
                <div className="py-1">
                  <Link 
                    to="/settings" 
                    className="block px-4 py-2 text-white hover:bg-dark-200 transition-colors flex items-center"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4 mr-2 text-dark-400" />
                    {t('common.settings')}
                  </Link>
                  <button
                    onClick={() => {
                      toggleDevMode();
                      setShowUserMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-white hover:bg-dark-200 transition-colors flex items-center"
                  >
                    <Code className="w-4 h-4 mr-2 text-purple-400" />
                    {isDevMode ? 'Disable' : 'Enable'} {t('common.devMode')}
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-white hover:bg-dark-200 transition-colors flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2 text-red-400" />
                    {t('common.signOut')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};