import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDevMode } from '../../contexts/DevModeContext';

interface OnboardingCheckProps {
  children: React.ReactNode;
}

export const OnboardingCheck: React.FC<OnboardingCheckProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const { isDevMode } = useDevMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkComplete, setCheckComplete] = useState(false);
  
  useEffect(() => {
    if (!loading) {
      // Skip auth check for auth-related routes
      const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
      const isAuthRoute = authRoutes.some(route => location.pathname.startsWith(route));
      
      // In dev mode, skip all checks
      if (isDevMode) {
        setCheckComplete(true);
        return;
      }
      
      if (!user && !isAuthRoute) {
        // Redirect to login if not authenticated and not on an auth route
        navigate('/login', { state: { from: location.pathname } });
      } else if (user) {
        const onboardingCompleted = user.user_metadata?.onboarding_completed || false;
        
        // Skip onboarding check for these paths
        const skipPaths = ['/onboarding'];
        const shouldSkip = skipPaths.some(path => location.pathname.startsWith(path));
        
        if (!onboardingCompleted && !shouldSkip && !isAuthRoute) {
          navigate('/onboarding');
        } else {
          setCheckComplete(true);
        }
      } else {
        setCheckComplete(true);
      }
    }
  }, [user, loading, location.pathname, navigate, isDevMode]);
  
  if (loading && !isDevMode) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // In dev mode, always render children
  if (isDevMode) {
    return <>{children}</>;
  }
  
  if (!checkComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return <>{children}</>;
};