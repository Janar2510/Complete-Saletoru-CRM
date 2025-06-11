import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Building2, GitBranch, Users, Mail, Calendar, ArrowRight, Check } from 'lucide-react';
import { Card } from '../common/Card';
import { CompanySetupStep } from './steps/CompanySetupStep';
import { PipelineSetupStep } from './steps/PipelineSetupStep';
import { TeamSetupStep } from './steps/TeamSetupStep';
import { IntegrationsStep } from './steps/IntegrationsStep';
import { GuruIntroStep } from './steps/GuruIntroStep';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [companyData, setCompanyData] = useState({
    name: '',
    logo: '',
    industry: '',
    size: '',
  });
  const [pipelineData, setPipelineData] = useState({
    name: 'Default Sales Pipeline',
    stages: [
      { name: 'Lead', probability: 10, color: '#6B7280', position: 1 },
      { name: 'Qualified', probability: 25, color: '#3B82F6', position: 2 },
      { name: 'Proposal', probability: 50, color: '#F59E0B', position: 3 },
      { name: 'Negotiation', probability: 75, color: '#F97316', position: 4 },
      { name: 'Closed Won', probability: 100, color: '#10B981', position: 5 },
      { name: 'Closed Lost', probability: 0, color: '#EF4444', position: 6 },
    ],
  });
  const [teamData, setTeamData] = useState({
    invites: [] as { email: string; role: string }[],
  });
  const [integrationsData, setIntegrationsData] = useState({
    connectEmail: false,
    connectCalendar: false,
  });
  
  const steps = [
    {
      title: 'Company Setup',
      description: 'Add your company details',
      icon: Building2,
      component: CompanySetupStep,
      data: companyData,
      setData: setCompanyData,
    },
    {
      title: 'Pipeline Setup',
      description: 'Configure your sales pipeline',
      icon: GitBranch,
      component: PipelineSetupStep,
      data: pipelineData,
      setData: setPipelineData,
    },
    {
      title: 'Team Setup',
      description: 'Invite your team members',
      icon: Users,
      component: TeamSetupStep,
      data: teamData,
      setData: setTeamData,
    },
    {
      title: 'Integrations',
      description: 'Connect your tools',
      icon: Mail,
      component: IntegrationsStep,
      data: integrationsData,
      setData: setIntegrationsData,
    },
    {
      title: 'Meet Guru',
      description: 'Your AI assistant',
      icon: Bot,
      component: GuruIntroStep,
      data: {},
      setData: () => {},
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Save onboarding data to Supabase
      if (user) {
        // Update user metadata
        await supabase.auth.updateUser({
          data: {
            onboarding_completed: true,
            company_name: companyData.name,
          },
        });

        // Save organization settings
        await supabase.from('org_settings').upsert({
          user_id: user.id,
          company_name: companyData.name,
          company_logo: companyData.logo,
          company_industry: companyData.industry,
          company_size: companyData.size,
          default_pipeline: pipelineData.name,
          pipeline_stages: pipelineData.stages,
          integrations: {
            email: integrationsData.connectEmail,
            calendar: integrationsData.connectCalendar,
          },
        });

        // Send team invites if any
        if (teamData.invites.length > 0) {
          // In a real app, this would send actual invites
          console.log('Sending invites to:', teamData.invites);
        }
      }

      // Complete onboarding
      onComplete();
      navigate('/');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl overflow-hidden">
        {/* Progress indicator */}
        <div className="bg-surface p-6 border-b border-dark-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">SaleToru CRM</h1>
                <p className="text-xs text-dark-400">Setup Wizard</p>
              </div>
            </div>
            <button 
              onClick={() => {
                if (confirm('Skip onboarding? You can always configure these settings later.')) {
                  onComplete();
                  navigate('/');
                }
              }}
              className="text-dark-400 hover:text-white text-sm transition-colors"
            >
              Skip
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      index < currentStep 
                        ? 'bg-accent text-white' 
                        : index === currentStep
                        ? 'bg-accent/20 text-accent border-2 border-accent'
                        : 'bg-dark-200 text-dark-400'
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs ${
                    index <= currentStep ? 'text-white' : 'text-dark-400'
                  }`}>
                    {step.title}
                  </span>
                  
                  {index < steps.length - 1 && (
                    <div className={`hidden md:block h-0.5 w-full absolute ${
                      index < currentStep ? 'bg-accent' : 'bg-dark-300'
                    }`} style={{
                      left: `${(index + 0.5) * 100 / steps.length}%`,
                      width: `${100 / steps.length}%`,
                      top: '2.5rem',
                    }}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Step content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-2">{steps[currentStep].title}</h2>
          <p className="text-dark-400 mb-6">{steps[currentStep].description}</p>
          
          <CurrentStepComponent 
            data={steps[currentStep].data} 
            setData={steps[currentStep].setData} 
          />
        </div>
        
        {/* Navigation */}
        <div className="p-6 border-t border-dark-200 flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-4 py-2 text-dark-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          
          <button
            onClick={handleNext}
            className="bg-accent hover:bg-accent/80 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <span>{currentStep === steps.length - 1 ? 'Complete' : 'Next'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  );
};