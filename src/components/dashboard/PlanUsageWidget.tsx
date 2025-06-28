import React from 'react';
import { CheckCircle } from 'lucide-react';

interface UsageMetric {
  label: string;
  value: number;
  limit: number;
  unit: string;
}

const mockMetrics: UsageMetric[] = [
  { label: 'Active Users', value: 5, limit: 10, unit: 'users' },
  { label: 'Emails Sent', value: 450, limit: 1000, unit: 'emails' },
  { label: 'Storage Used', value: 2.5, limit: 5, unit: 'GB' },
];

export const PlanUsageWidget: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-dark-300 to-dark-100 p-4 rounded-xl shadow-md text-white">
      <h3 className="text-lg font-semibold mb-4">Your Plan Usage</h3>
      <div className="space-y-4">
        {mockMetrics.map((metric, index) => {
          const usagePercent = (metric.value / metric.limit) * 100;
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-300">{metric.label}</span>
                <span className="text-sm">{metric.value} / {metric.limit} {metric.unit}</span>
              </div>
              <div className="w-full bg-dark-400/30 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-400 transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-xs text-dark-300 flex items-center space-x-2">
        <CheckCircle className="w-4 h-4 text-green-400" />
        <span>Upgrade your plan to unlock more usage.</span>
      </div>
    </div>
  );
};