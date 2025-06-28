import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, User, DollarSign, Sparkles } from 'lucide-react';
import { Card } from '@/components/common/Card';

interface DealUpdate {
  id: string;
  dealTitle: string;
  dealValue: number;
  action: 'created' | 'won' | 'lost' | 'stage_changed';
  fromStage?: string;
  toStage?: string;
  user: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
}

interface DealUpdatesPanelProps {
  updates: DealUpdate[];
  onViewDeal: (id: string) => void;
}

export const DealUpdatesPanel: React.FC<DealUpdatesPanelProps> = ({ updates, onViewDeal }) => {
  const getIcon = (action: DealUpdate['action']) => {
    switch (action) {
      case 'created': return <Sparkles className="text-blue-400 w-4 h-4" />;
      case 'won': return <DollarSign className="text-green-400 w-4 h-4" />;
      case 'lost': return <DollarSign className="text-red-400 w-4 h-4" />;
      case 'stage_changed': return <ArrowRight className="text-yellow-400 w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold text-white mb-4">Recent Deal Updates</h2>
      <ul className="divide-y divide-dark-300">
        {updates.map((update) => (
          <li
            key={update.id}
            className="py-3 flex items-start justify-between hover:bg-dark-200/30 px-2 rounded-md transition"
          >
            <div className="flex items-start space-x-3">
              {getIcon(update.action)}
              <div className="text-white">
                <div className="font-medium">
                  {update.dealTitle} – €{update.dealValue.toLocaleString()}
                </div>
                <div className="text-sm text-dark-400">
                  {update.action === 'stage_changed' ? (
                    <>
                      Moved from <strong>{update.fromStage}</strong> to <strong>{update.toStage}</strong>
                    </>
                  ) : (
                    <>
                      {update.action.charAt(0).toUpperCase() + update.action.slice(1)} by {update.user}
                    </>
                  )}
                </div>
                <div className="text-xs text-dark-500 mt-1">
                  {formatDistanceToNow(update.timestamp)} ago
                </div>
              </div>
            </div>
            <button
              onClick={() => onViewDeal(update.id)}
              className="text-sm text-accent hover:underline"
            >
              View
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default DealUpdatesPanel;
