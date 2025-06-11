import React from 'react';
import { X, Lock, Star, ArrowRight } from 'lucide-react';
import { Card } from '../common/Card';
import { useNavigate } from 'react-router-dom';

interface FeatureLockModalProps {
  featureName: string;
  requiredPlan: 'pro' | 'team';
  onClose: () => void;
}

export const FeatureLockModal: React.FC<FeatureLockModalProps> = ({ 
  featureName, 
  requiredPlan, 
  onClose 
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/pricing');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-purple-500 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Feature Locked</h2>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Upgrade to {requiredPlan === 'pro' ? 'Pro' : 'Team'} to unlock {featureName}
            </h3>
            <p className="text-dark-400">
              This feature is available exclusively on our {requiredPlan === 'pro' ? 'Pro' : 'Team'} plan.
              Upgrade now to access {featureName} and many other premium features.
            </p>
          </div>
          
          <div className="bg-dark-200/50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Star className="w-5 h-5 text-yellow-400" />
              <h4 className="font-medium text-white">
                {requiredPlan === 'pro' ? 'Pro' : 'Team'} Plan Highlights
              </h4>
            </div>
            <ul className="space-y-2 text-left">
              {requiredPlan === 'pro' ? (
                <>
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-400 text-xs">✓</span>
                    </div>
                    <span className="ml-2 text-dark-400">Unlimited users</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-400 text-xs">✓</span>
                    </div>
                    <span className="ml-2 text-dark-400">Advanced analytics</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-400 text-xs">✓</span>
                    </div>
                    <span className="ml-2 text-dark-400">Email & calendar integration</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-400 text-xs">✓</span>
                    </div>
                    <span className="ml-2 text-dark-400">AI-powered assistant</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-400 text-xs">✓</span>
                    </div>
                    <span className="ml-2 text-dark-400">Advanced automation</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-400 text-xs">✓</span>
                    </div>
                    <span className="ml-2 text-dark-400">Priority support</span>
                  </li>
                </>
              )}
            </ul>
          </div>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleUpgrade}
              className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <span>View Pricing Plans</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={onClose}
              className="text-dark-400 hover:text-white transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};