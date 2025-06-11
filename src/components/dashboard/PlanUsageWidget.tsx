import React from 'react';
import { CreditCard, Users, Mail, Database, ArrowRight } from 'lucide-react';
import { Card } from '../common/Card';
import { usePlan } from '../../contexts/PlanContext';
import { Link } from 'react-router-dom';

export const PlanUsageWidget: React.FC = () => {
  const { currentPlan, usageLimits } = usePlan();

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === Infinity) return Math.min((used / 10000) * 100, 100); // For display purposes
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    return 'bg-accent';
  };

  const formatLimit = (limit: number) => {
    if (limit === Infinity) return '∞';
    if (limit >= 1000) return `${limit / 1000}k`;
    return limit.toString();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-white">Plan Usage</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
          currentPlan === 'starter' ? 'bg-gray-500/20 text-gray-400' :
          currentPlan === 'pro' ? 'bg-blue-500/20 text-blue-400' :
          'bg-purple-500/20 text-purple-400'
        }`}>
          {currentPlan} Plan
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-dark-400" />
              <span className="text-sm text-dark-400">Contacts</span>
            </div>
            <span className="text-sm text-white">
              {usageLimits.contacts.used} / {formatLimit(usageLimits.contacts.limit)}
            </span>
          </div>
          <div className="w-full bg-dark-300 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                getUsageColor(getUsagePercentage(usageLimits.contacts.used, usageLimits.contacts.limit))
              }`}
              style={{ width: `${getUsagePercentage(usageLimits.contacts.used, usageLimits.contacts.limit)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-dark-400" />
              <span className="text-sm text-dark-400">Deals</span>
            </div>
            <span className="text-sm text-white">
              {usageLimits.deals.used} / {formatLimit(usageLimits.deals.limit)}
            </span>
          </div>
          <div className="w-full bg-dark-300 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                getUsageColor(getUsagePercentage(usageLimits.deals.used, usageLimits.deals.limit))
              }`}
              style={{ width: `${getUsagePercentage(usageLimits.deals.used, usageLimits.deals.limit)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-dark-400" />
              <span className="text-sm text-dark-400">Storage</span>
            </div>
            <span className="text-sm text-white">
              {usageLimits.storage.used} GB / {formatLimit(usageLimits.storage.limit)} GB
            </span>
          </div>
          <div className="w-full bg-dark-300 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                getUsageColor(getUsagePercentage(usageLimits.storage.used, usageLimits.storage.limit))
              }`}
              style={{ width: `${getUsagePercentage(usageLimits.storage.used, usageLimits.storage.limit)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-dark-200">
        {currentPlan !== 'team' && (
          <Link 
            to="/pricing" 
            className="text-accent hover:text-accent/80 text-sm flex items-center justify-end"
          >
            <span>Upgrade your plan</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        )}
      </div>
    </Card>
  );
};