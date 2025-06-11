import React, { useState } from 'react';
import { EmailTemplatesTable } from '../components/templates/EmailTemplatesTable';
import { EmailTemplateModal } from '../components/templates/EmailTemplateModal';
import { EmailTemplate, CreateEmailTemplateData, UpdateEmailTemplateData } from '../types/offers';
import { OffersAPI } from '../lib/offers-api';

const EmailTemplates: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setShowCreateModal(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowCreateModal(true);
  };

  const handleViewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowDetailModal(true);
  };

  const handleSaveTemplate = async (templateData: CreateEmailTemplateData | UpdateEmailTemplateData) => {
    try {
      if ('id' in templateData) {
        await OffersAPI.updateEmailTemplate(templateData);
      } else {
        await OffersAPI.createEmailTemplate(templateData);
      }
      
      setShowCreateModal(false);
      setShowDetailModal(false);
      setSelectedTemplate(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowDetailModal(false);
    setSelectedTemplate(null);
  };

  return (
    <div className="space-y-6">
      <EmailTemplatesTable
        key={refreshTrigger}
        onCreateTemplate={handleCreateTemplate}
        onEditTemplate={handleEditTemplate}
        onViewTemplate={handleViewTemplate}
      />

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <EmailTemplateModal
          template={selectedTemplate}
          onSave={handleSaveTemplate}
          onClose={handleCloseModals}
        />
      )}

      {/* Detail Modal - You can create this component if needed */}
      {showDetailModal && selectedTemplate && (
        <EmailTemplateModal
          template={selectedTemplate}
          onSave={handleSaveTemplate}
          onClose={handleCloseModals}
        />
      )}
    </div>
  );
};

export default EmailTemplates;