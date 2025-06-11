import React from 'react';
import { Target, ArrowRight, Zap } from 'lucide-react';
import { EmptyStateCard } from './EmptyStateCard';
import { useFeatureLock } from '../../hooks/useFeatureLock';
import { usePlan } from '../../contexts/PlanContext';

interface DealsEmptyStateProps {
  onCreateDeal: () => void;
  onSetupAutomation?: () => void;
}

export const DealsEmptyState: React.FC<DealsEmptyStateProps> = ({
  onCreateDeal,
  onSetupAutomation
}) => {
  const { currentPlan } = usePlan();
  const { withFeatureAccess } = useFeatureLock(currentPlan);
  
  const handleSetupAutomation = () => {
    if (onSetupAutomation) {
      withFeatureAccess('basic_automation', onSetupAutomation);
    }
  };
  
  return (
    <EmptyStateCard
      title="No deals yet"
      description="Start tracking your sales opportunities by creating your first deal."
      icon={<Target className="w-10 h-10 text-accent" />}
      actionLabel="Create Deal"
      onAction={onCreateDeal}
      secondaryAction={
        onSetupAutomation ? {
          label: "Set up deal automation",
          onClick: handleSetupAutomation
        } : undefined
      }
    />
  );
};