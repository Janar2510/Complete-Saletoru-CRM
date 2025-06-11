import { useState, useCallback } from 'react';
import { FeatureLockModal } from '../components/pricing/FeatureLockModal';
import { useDevMode } from '../contexts/DevModeContext';

// Define feature access by plan
const featureAccess = {
  // Basic features available to all plans
  basic_crm: ['starter', 'pro', 'team'],
  contact_management: ['starter', 'pro', 'team'],
  deal_tracking: ['starter', 'pro', 'team'],
  basic_analytics: ['starter', 'pro', 'team'],
  
  // Pro features
  email_integration: ['pro', 'team'],
  calendar_integration: ['pro', 'team'],
  offers_management: ['pro', 'team'],
  basic_automation: ['pro', 'team'],
  api_access: ['pro', 'team'],
  
  // Team features
  ai_assistant: ['team'],
  advanced_automation: ['team'],
  custom_analytics: ['team'],
  priority_support: ['team'],
};

// Map feature IDs to display names
const featureNames: Record<string, string> = {
  email_integration: 'Email Integration',
  calendar_integration: 'Calendar Integration',
  offers_management: 'Offers Management',
  basic_automation: 'Automation',
  api_access: 'API Access',
  ai_assistant: 'AI Assistant',
  advanced_automation: 'Advanced Automation',
  custom_analytics: 'Custom Analytics',
  priority_support: 'Priority Support',
};

export const useFeatureLock = (currentPlan: 'starter' | 'pro' | 'team' = 'starter') => {
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { isDevMode } = useDevMode();

  const checkAccess = useCallback((featureId: string): boolean => {
    // In dev mode, all features are accessible
    if (isDevMode) {
      return true;
    }
    
    const allowedPlans = featureAccess[featureId] || [];
    return allowedPlans.includes(currentPlan);
  }, [currentPlan, isDevMode]);

  const withFeatureAccess = useCallback((featureId: string, callback: () => void) => {
    if (checkAccess(featureId)) {
      callback();
      return true;
    } else {
      setLockedFeature(featureId);
      setShowModal(true);
      return false;
    }
  }, [checkAccess]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setLockedFeature(null);
  }, []);

  const FeatureLockModalComponent = useCallback(() => {
    if (!showModal || !lockedFeature) return null;
    
    const featureName = featureNames[lockedFeature] || lockedFeature;
    const requiredPlan = featureAccess[lockedFeature]?.[0] as 'pro' | 'team' || 'pro';
    
    return (
      <FeatureLockModal
        featureName={featureName}
        requiredPlan={requiredPlan}
        onClose={closeModal}
      />
    );
  }, [showModal, lockedFeature, closeModal]);

  return {
    checkAccess,
    withFeatureAccess,
    FeatureLockModal: FeatureLockModalComponent,
  };
};