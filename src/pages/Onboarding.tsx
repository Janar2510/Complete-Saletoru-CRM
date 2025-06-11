import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Onboarding: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  
  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);
  
  const checkOnboardingStatus = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    
    try {
      // Check if user has completed onboarding
      const isCompleted = user.user_metadata?.onboarding_completed || false;
      
      if (isCompleted) {
        navigate('/');
      } else {
        setOnboardingCompleted(false);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleOnboardingComplete = async () => {
    try {
      // Update user metadata
      await supabase.auth.updateUser({
        data: {
          onboarding_completed: true,
        },
      });
      
      setOnboardingCompleted(true);
      navigate('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return <OnboardingWizard onComplete={handleOnboardingComplete} />;
};

export default Onboarding;