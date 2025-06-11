import React from 'react';
import { Users, Upload, Database } from 'lucide-react';
import { EmptyStateCard } from './EmptyStateCard';
import { useFeatureLock } from '../../hooks/useFeatureLock';
import { usePlan } from '../../contexts/PlanContext';

interface ContactsEmptyStateProps {
  onCreateContact: () => void;
  onImportContacts?: () => void;
}

export const ContactsEmptyState: React.FC<ContactsEmptyStateProps> = ({
  onCreateContact,
  onImportContacts
}) => {
  const { currentPlan } = usePlan();
  const { withFeatureAccess } = useFeatureLock(currentPlan);
  
  const handleImport = () => {
    if (onImportContacts) {
      withFeatureAccess('basic_automation', onImportContacts);
    }
  };
  
  return (
    <EmptyStateCard
      title="No contacts yet"
      description="Add your first lead to get started tracking your relationships and communications."
      icon={<Users className="w-10 h-10 text-accent" />}
      actionLabel="Add Contact"
      onAction={onCreateContact}
      secondaryAction={
        onImportContacts ? {
          label: "Import from CSV",
          onClick: handleImport
        } : undefined
      }
    />
  );
};