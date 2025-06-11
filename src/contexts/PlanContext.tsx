import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useDevMode } from './DevModeContext';

type PlanType = 'starter' | 'pro' | 'team';

interface PlanContextType {
  currentPlan: PlanType;
  isLoading: boolean;
  userCount: number;
  usageLimits: {
    contacts: { used: number, limit: number };
    deals: { used: number, limit: number };
    storage: { used: number, limit: number };
  };
  updatePlan: (plan: PlanType) => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isDevMode, currentPlan: devModePlan } = useDevMode();
  const [currentPlan, setCurrentPlan] = useState<PlanType>('starter');
  const [isLoading, setIsLoading] = useState(true);
  const [userCount, setUserCount] = useState(1);
  const [usageLimits, setUsageLimits] = useState({
    contacts: { used: 0, limit: 500 },
    deals: { used: 0, limit: 100 },
    storage: { used: 0, limit: 1 }, // GB
  });

  useEffect(() => {
    // Load plan data
    const loadPlanData = async () => {
      try {
        setIsLoading(true);
        
        if (isDevMode) {
          // In dev mode, use the plan from DevModeContext
          const mockUsageLimits = {
            starter: {
              contacts: { used: 123, limit: 500 },
              deals: { used: 45, limit: 100 },
              storage: { used: 0.3, limit: 1 },
            },
            pro: {
              contacts: { used: 2345, limit: 10000 },
              deals: { used: 789, limit: 5000 },
              storage: { used: 3.7, limit: 10 },
            },
            team: {
              contacts: { used: 8765, limit: Infinity },
              deals: { used: 1234, limit: Infinity },
              storage: { used: 25.4, limit: 100 },
            },
          };
          
          setCurrentPlan(devModePlan);
          setUserCount(devModePlan === 'starter' ? 1 : devModePlan === 'pro' ? 8 : 25);
          setUsageLimits(mockUsageLimits[devModePlan]);
        } else {
          // In a real app, this would be an API call to get the user's plan
          // For demo purposes, we'll use a mock plan
          const mockPlan: PlanType = 'starter';
          const mockUserCount = 1;
          const mockUsageLimits = {
            contacts: { used: 123, limit: 500 },
            deals: { used: 45, limit: 100 },
            storage: { used: 0.3, limit: 1 }, // GB
          };
          
          setCurrentPlan(mockPlan);
          setUserCount(mockUserCount);
          setUsageLimits(mockUsageLimits);
        }
      } catch (error) {
        console.error('Error loading plan data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user || isDevMode) {
      loadPlanData();
    } else {
      setIsLoading(false);
    }
  }, [user, isDevMode, devModePlan]);

  const updatePlan = async (plan: PlanType) => {
    try {
      if (isDevMode) {
        // In dev mode, just update the state
        setCurrentPlan(plan);
        
        // Update limits based on new plan
        const newLimits = {
          starter: {
            contacts: { used: usageLimits.contacts.used, limit: 500 },
            deals: { used: usageLimits.deals.used, limit: 100 },
            storage: { used: usageLimits.storage.used, limit: 1 },
          },
          pro: {
            contacts: { used: usageLimits.contacts.used, limit: 10000 },
            deals: { used: usageLimits.deals.used, limit: 5000 },
            storage: { used: usageLimits.storage.used, limit: 10 },
          },
          team: {
            contacts: { used: usageLimits.contacts.used, limit: Infinity },
            deals: { used: usageLimits.deals.used, limit: Infinity },
            storage: { used: usageLimits.storage.used, limit: 100 },
          },
        };
        
        setUsageLimits(newLimits[plan]);
      } else {
        // In a real app, this would be an API call to update the user's plan
        setCurrentPlan(plan);
        
        // Update limits based on new plan
        const newLimits = {
          starter: {
            contacts: { used: usageLimits.contacts.used, limit: 500 },
            deals: { used: usageLimits.deals.used, limit: 100 },
            storage: { used: usageLimits.storage.used, limit: 1 },
          },
          pro: {
            contacts: { used: usageLimits.contacts.used, limit: 10000 },
            deals: { used: usageLimits.deals.used, limit: 5000 },
            storage: { used: usageLimits.storage.used, limit: 10 },
          },
          team: {
            contacts: { used: usageLimits.contacts.used, limit: Infinity },
            deals: { used: usageLimits.deals.used, limit: Infinity },
            storage: { used: usageLimits.storage.used, limit: 100 },
          },
        };
        
        setUsageLimits(newLimits[plan]);
      }
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  const value = {
    currentPlan,
    isLoading,
    userCount,
    usageLimits,
    updatePlan,
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
};