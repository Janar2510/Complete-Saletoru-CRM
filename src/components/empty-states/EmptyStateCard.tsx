import React from 'react';
import { Plus } from 'lucide-react';
import { Card } from '../common/Card';

interface EmptyStateCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  secondaryAction
}) => {
  return (
    <Card className="p-12 text-center">
      <div className="w-20 h-20 bg-dark-200/50 rounded-full flex items-center justify-center mx-auto mb-6">
        {icon}
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-dark-400 mb-6 max-w-md mx-auto">{description}</p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3">
        <button
          onClick={onAction}
          className="bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
        
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="text-accent hover:text-accent/80 transition-colors"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </Card>
  );
};