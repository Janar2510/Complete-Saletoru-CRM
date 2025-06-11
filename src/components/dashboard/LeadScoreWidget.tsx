import React from 'react';
import { TrendingUp, User, Target, ArrowRight } from 'lucide-react';
import { Card } from '../common/Card';
import { LeadScoreBadge } from '../contacts/LeadScoreBadge';
import { DealScoreBadge } from '../deals/DealScoreBadge';

interface LeadScoreWidgetProps {
  topLeads: {
    id: string;
    name: string;
    company?: string;
    score: number;
  }[];
  topDeals: {
    id: string;
    title: string;
    value: number;
    score: number;
  }[];
  onViewAllLeads: () => void;
  onViewAllDeals: () => void;
}

export const LeadScoreWidget: React.FC<LeadScoreWidgetProps> = ({
  topLeads,
  topDeals,
  onViewAllLeads,
  onViewAllDeals
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="p-6 h-full border border-dark-200/50 bg-gradient-to-br from-dark-100/50 to-dark-100/30">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-white">Lead Scoring</h3>
        </div>
      </div>

      <div className="space-y-6">
        {/* Top Leads */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-white flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-400 mr-2" />
              <span>Top Leads</span>
            </h4>
            <button 
              onClick={onViewAllLeads}
              className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center"
            >
              View All
              <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>

          <div className="space-y-2">
            {topLeads.map(lead => (
              <div 
                key={lead.id}
                className="flex items-center justify-between p-2 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors backdrop-blur-sm border border-dark-300/30"
              >
                <div>
                  <p className="text-sm font-medium text-white">{lead.name}</p>
                  {lead.company && (
                    <p className="text-xs text-dark-400">{lead.company}</p>
                  )}
                </div>
                <LeadScoreBadge score={lead.score} />
              </div>
            ))}
          </div>
        </div>

        {/* Top Deals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-white flex items-center space-x-2">
              <Target className="w-4 h-4 text-green-400 mr-2" />
              <span>Top Deals</span>
            </h4>
            <button 
              onClick={onViewAllDeals}
              className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center"
            >
              View All
              <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>

          <div className="space-y-2">
            {topDeals.map(deal => (
              <div 
                key={deal.id}
                className="flex items-center justify-between p-2 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors backdrop-blur-sm border border-dark-300/30"
              >
                <div>
                  <p className="text-sm font-medium text-white">{deal.title}</p>
                  <p className="text-xs text-dark-400">{formatCurrency(deal.value)}</p>
                </div>
                <DealScoreBadge score={deal.score} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};