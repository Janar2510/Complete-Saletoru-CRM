import React from 'react';
import { Card } from '@/components/common/Card';
import { BarChart2, TrendingUp } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  company: string;
  score: number;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  score: number;
}

interface LeadScoreWidgetProps {
  topLeads: Lead[];
  topDeals: Deal[];
  onViewAllLeads: () => void;
  onViewAllDeals: () => void;
}

export const LeadScoreWidget: React.FC<LeadScoreWidgetProps> = ({
  topLeads,
  topDeals,
  onViewAllLeads,
  onViewAllDeals,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Top Leads */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            <span>Top Leads</span>
          </h3>
          <button
            onClick={onViewAllLeads}
            className="text-sm text-blue-400 hover:underline"
          >
            View All
          </button>
        </div>
        <ul className="divide-y divide-dark-200/50">
          {topLeads.map((lead) => (
            <li key={lead.id} className="py-2 flex justify-between items-center">
              <div>
                <div className="text-white font-medium">{lead.name}</div>
                <div className="text-sm text-dark-300">{lead.company}</div>
              </div>
              <div className="text-sm font-semibold text-blue-300">{lead.score}</div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Top Deals */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span>Top Deals</span>
          </h3>
          <button
            onClick={onViewAllDeals}
            className="text-sm text-green-400 hover:underline"
          >
            View All
          </button>
        </div>
        <ul className="divide-y divide-dark-200/50">
          {topDeals.map((deal) => (
            <li key={deal.id} className="py-2 flex justify-between items-center">
              <div>
                <div className="text-white font-medium">{deal.title}</div>
                <div className="text-sm text-dark-300">${deal.value.toLocaleString()}</div>
              </div>
              <div className="text-sm font-semibold text-green-300">{deal.score}</div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};
