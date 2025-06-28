import React from 'react';
import { AlertTriangle, Bookmark, X } from 'lucide-react';
import { Card } from '@/components/common/Card';

interface AITip {
  id: string;
  title: string;
  description: string;
  category: 'pipeline' | 'task' | 'deal';
  priority: 'low' | 'medium' | 'high';
  actionable?: boolean;
}

interface Props {
  tip: AITip;
  onDismiss: (tipId: string) => void;
  onSave: (tipId: string) => void;
}

export const AITipWidget: React.FC<Props> = ({ tip, onDismiss, onSave }) => {
  if (!tip) return null;

  const priorityColor = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-green-500/20 text-green-400',
  }[tip.priority];

  return (
    <Card className="p-4 bg-gradient-to-br from-dark-200/50 to-dark-300/30 border border-dark-300/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className={`w-6 h-6 ${priorityColor}`} />
          <div>
            <h4 className="text-white font-semibold leading-snug mb-1">
              {tip.title}
            </h4>
            <p className="text-sm text-dark-400 leading-relaxed">
              {tip.description}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onDismiss(tip.id)}
            className="hover:text-red-400 text-dark-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSave(tip.id)}
            className="hover:text-purple-400 text-dark-400 transition-colors"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};
