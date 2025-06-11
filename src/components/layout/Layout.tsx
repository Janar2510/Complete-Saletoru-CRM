import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SaleToruGuru } from '../ai/SaleToruGuru';
import { useLocation, Navigate } from 'react-router-dom';
import { OnboardingCheck } from './OnboardingCheck';
import { useAuth } from '../../contexts/AuthContext';
import { useDevMode } from '../../contexts/DevModeContext';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { user, loading } = useAuth();
  const { isDevMode, fakeUser } = useDevMode();
  
  // Don't show the sidebar and header on the pricing page or onboarding
  const isPublicPage = location.pathname === '/pricing';
  const isOnboardingPage = location.pathname === '/onboarding';

  // If still loading auth state, show loading spinner
  if (loading && !isDevMode) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not authenticated and not in dev mode, redirect to login
  if (!user && !isDevMode && !isPublicPage) {
    return <Navigate to="/login" />;
  }

  // If in dev mode, use fake user
  const effectiveUser = isDevMode ? fakeUser : user;

  if (isPublicPage || isOnboardingPage) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <OnboardingCheck>
      <div className="h-screen flex bg-background overflow-hidden">
        <Sidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
          
          <main className="flex-1 overflow-auto">
            <motion.div 
              className="p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>
        </div>

        {/* AI Assistant */}
        <SaleToruGuru />
      </div>
    </OnboardingCheck>
  );
};