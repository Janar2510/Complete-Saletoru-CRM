import React from 'react';
import { TrendingUp, User, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { Card } from '../common/Card';
import { formatDistanceToNow } from 'date-fns';

interface DealUpdate {
  id: string;
  dealTitle: string;
  dealValue: number;
  action: 'created' | 'updated' | 'stage_changed' | 'won' | 'lost';
  fromStage?: string;
  toStage?: string;
  user: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
}

interface DealUpdatesPanelProps {
  updates: DealUpdate[];
  onViewDeal: (dealId: string) => void;
}

export const DealUpdatesPanel: React.FC<DealUpdatesPanelProps> = ({ updates, onViewDeal }) => {
  const getActionIcon = (action: DealUpdate['action']) => {
    switch (action) {
      case 'created':
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case 'stage_changed':
        return <ArrowRight className="w-4 h-4 text-purple-400" />;
      case 'won':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'lost':
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getActionText = (update: DealUpdate) => {
    switch (update.action) {
      case 'created':
        return 'Deal created';
      case 'stage_changed':
        return `Moved from ${update.fromStage} to ${update.toStage}`;
      case 'won':
        return 'Deal won';
      case 'lost':
        return 'Deal lost';
      default:
        return 'Deal updated';
    }
  };

  const getActionColor = (action: DealUpdate['action']) => {
    switch (action) {
      case 'won':
        return 'bg-green-500/20 border-green-500/30';
      case 'lost':
        return 'bg-red-500/20 border-red-500/30';
      case 'stage_changed':
        return 'bg-purple-500/20 border-purple-500/30';
      case 'created':
        return 'bg-blue-500/20 border-blue-500/30';
      default:
        return 'bg-yellow-500/20 border-yellow-500/30';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="p-6 border border-dark-200/50 bg-gradient-to-br from-dark-100/50 to-dark-100/30">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 mr-2" />
          <span>Deal Updates</span>
        </h2>
        <span className="text-sm text-dark-400">Last 24 hours</span>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {updates.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-dark-400 mx-auto mb-3" />
            <p className="text-dark-400">No recent deal updates</p>
          </div>
        ) : (
          updates.map(update => (
            <div
              key={update.id}
              className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${getActionColor(update.action)}`}
              onClick={() => onViewDeal(update.id)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getActionIcon(update.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-white truncate">{update.dealTitle}</h4>
                    <span className="text-sm font-medium text-white flex items-center">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {formatCurrency(update.dealValue)}
                    </span>
                  </div>
                  <p className="text-sm text-dark-400 mb-2">{getActionText(update)}</p>
                  <div className="flex items-center justify-between text-xs text-dark-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{update.user}</span>
                    </div>
                    <span>{formatDistanceToNow(update.timestamp, { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};