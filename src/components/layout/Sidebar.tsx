import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Handshake,
  Users,
  Building2,
  Activity,
  Calendar,
  Mail,
  UserCheck,
  Package,
  BarChart3,
  Settings,
  ChevronLeft,
  FileText,
  Send,
  Store,
  TrendingUp,
  Shield,
  CheckSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const userName = user?.user_metadata?.full_name || 'User';
  const userRole = user?.user_metadata?.role || 'user';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
  const isAdmin = userRole === 'admin' || userRole === 'developer_admin';

  const navigation = [
    { name: t('common.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('common.deals'), href: '/deals', icon: Handshake, badge: 8 },
    { name: t('common.contacts'), href: '/contacts', icon: Users },
    { name: t('common.organizations'), href: '/organizations', icon: Building2 },
    { name: t('common.tasks'), href: '/tasks', icon: CheckSquare, badge: 'New' },
    { name: t('common.offers'), href: '/offers', icon: FileText },
    { name: t('common.emailTemplates'), href: '/email-templates', icon: Send },
    { name: t('common.leadScoring'), href: '/lead-scoring', icon: TrendingUp, badge: 'New' },
    { name: t('common.activities'), href: '/activities', icon: Activity, badge: 3 },
    { name: t('common.calendar'), href: '/calendar', icon: Calendar },
    { name: t('common.emails'), href: '/emails', icon: Mail },
    { name: t('common.leads'), href: '/leads', icon: UserCheck, badge: 'New' },
    { name: t('common.products'), href: '/products', icon: Package },
    { name: t('common.analytics'), href: '/analytics', icon: BarChart3 },
    { name: t('common.marketplace'), href: '/marketplace', icon: Store, badge: 'New' },
    { name: t('common.settings'), href: '/settings', icon: Settings },
  ];

  // Admin-only navigation items
  if (isAdmin) {
    navigation.push({ name: 'Admin', href: '/admin', icon: Shield });
  }

  return (
    <div className={`bg-surface border-r border-dark-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-dark-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="https://i.imgur.com/Zylpdjy.png" alt="SaleToru Logo" className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">SaleToru</h1>
                <p className="text-xs text-dark-400">CRM</p>
              </div>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-dark-200 transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 text-dark-400 transition-transform ${
              isCollapsed ? 'rotate-180' : ''
            }`} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500/20 to-accent/20 text-white border border-purple-500/30'
                      : 'text-dark-400 hover:text-white hover:bg-dark-200'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="ml-3">{item.name}</span>
                    {item.badge && (
                      <span className={`ml-auto ${typeof item.badge === 'string' ? 'bg-green-500' : 'bg-accent'} text-white text-xs px-2 py-0.5 rounded-full`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-dark-200">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-accent rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">{userInitials}</span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-dark-400 truncate capitalize">{userRole}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};