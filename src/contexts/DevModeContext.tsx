import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DevModeContextType {
  isDevMode: boolean;
  toggleDevMode: () => void;
  currentPlan: 'starter' | 'pro' | 'team';
  setCurrentPlan: (plan: 'starter' | 'pro' | 'team') => void;
  fakeUser: any;
  supabaseStatus: 'connected' | 'disconnected' | 'error';
  debugInfo: {
    currentRoute: string;
    lastApiCall: string | null;
    lastError: string | null;
  };
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

export const useDevMode = () => {
  const context = useContext(DevModeContext);
  if (context === undefined) {
    throw new Error('useDevMode must be used within a DevModeProvider');
  }
  return context;
};

export const DevModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDevMode, setIsDevMode] = useState<boolean>(
    localStorage.getItem('devMode') === 'true'
  );
  const [currentPlan, setCurrentPlan] = useState<'starter' | 'pro' | 'team'>(
    (localStorage.getItem('devModePlan') as any) || 'team'
  );
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'disconnected' | 'error'>(
    'disconnected'
  );
  const [debugInfo, setDebugInfo] = useState({
    currentRoute: window.location.pathname,
    lastApiCall: null as string | null,
    lastError: null as string | null,
  });

  // Fake user for development
  const fakeUser = {
    id: 'dev-mode-user',
    email: 'janar@example.com',
    user_metadata: {
      full_name: 'Janar Kuusk',
      role: 'user',
      is_developer_mode: true,
    },
  };

  // Check Supabase connection
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        // Use a simple auth check instead of querying a specific table
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Supabase connection error:', error);
          setSupabaseStatus('error');
        } else {
          setSupabaseStatus('connected');
        }
      } catch (error) {
        console.error('Supabase connection check failed:', error);
        setSupabaseStatus('error');
      }
    };

    checkSupabaseConnection();
  }, []);

  // Update route in debug info
  useEffect(() => {
    const updateRoute = () => {
      setDebugInfo(prev => ({
        ...prev,
        currentRoute: window.location.pathname,
      }));
    };

    window.addEventListener('popstate', updateRoute);
    return () => window.removeEventListener('popstate', updateRoute);
  }, []);

  // Intercept fetch/XHR for logging in dev mode
  useEffect(() => {
    if (isDevMode) {
      // Intercept fetch
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const url = args[0].toString();
        setDebugInfo(prev => ({
          ...prev,
          lastApiCall: `fetch: ${url}`,
        }));
        
        try {
          const response = await originalFetch(...args);
          if (!response.ok) {
            const error = await response.text();
            console.error(`Supabase error (${url}):`, error);
            setDebugInfo(prev => ({
              ...prev,
              lastError: `${url}: ${error}`,
            }));
          }
          return response;
        } catch (error) {
          console.error(`Fetch error (${url}):`, error);
          setDebugInfo(prev => ({
            ...prev,
            lastError: `${url}: ${error}`,
          }));
          throw error;
        }
      };

      // Intercept XHR
      const originalXHROpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(...args) {
        const url = args[1].toString();
        this.addEventListener('load', function() {
          if (this.status >= 400) {
            console.error(`XHR error (${url}):`, this.responseText);
            setDebugInfo(prev => ({
              ...prev,
              lastError: `${url}: ${this.responseText}`,
            }));
          }
        });
        setDebugInfo(prev => ({
          ...prev,
          lastApiCall: `xhr: ${url}`,
        }));
        return originalXHROpen.apply(this, args);
      };
    }
  }, [isDevMode]);

  const toggleDevMode = () => {
    const newMode = !isDevMode;
    setIsDevMode(newMode);
    localStorage.setItem('devMode', newMode.toString());
  };

  const handleSetCurrentPlan = (plan: 'starter' | 'pro' | 'team') => {
    setCurrentPlan(plan);
    localStorage.setItem('devModePlan', plan);
  };

  return (
    <DevModeContext.Provider
      value={{
        isDevMode,
        toggleDevMode,
        currentPlan,
        setCurrentPlan: handleSetCurrentPlan,
        fakeUser,
        supabaseStatus,
        debugInfo,
      }}
    >
      {children}
      {isDevMode && <DevModeBadge />}
    </DevModeContext.Provider>
  );
};

const DevModeBadge: React.FC = () => {
  const { currentPlan, supabaseStatus } = useDevMode();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div 
        className="fixed bottom-4 right-4 z-50 flex items-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        style={{
          boxShadow: '0 0 15px rgba(124, 58, 237, 0.5)',
          animation: 'pulse 2s infinite'
        }}
      >
        <span className="text-sm font-medium">🧪 Dev Mode: User Access</span>
        <div className={`w-2 h-2 rounded-full ${
          supabaseStatus === 'connected' ? 'bg-green-400' : 
          supabaseStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400'
        }`}></div>
      </div>

      {expanded && (
        <div className="fixed bottom-16 right-4 z-50 bg-dark-100 border border-purple-500 rounded-lg shadow-lg p-4 w-64">
          <h3 className="text-white font-medium mb-2">Developer Settings</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-400">Plan:</span>
              <span className="text-white capitalize">{currentPlan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Supabase:</span>
              <span className={`${
                supabaseStatus === 'connected' ? 'text-green-400' : 
                supabaseStatus === 'error' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {supabaseStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">User:</span>
              <span className="text-white">Janar Kuusk</span>
            </div>
            <div className="pt-2 mt-2 border-t border-dark-200">
              <a 
                href="/debug-tools" 
                className="text-accent hover:text-accent/80 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                Open Debug Tools
              </a>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(124, 58, 237, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(124, 58, 237, 0);
          }
        }
      `}</style>
    </>
  );
};