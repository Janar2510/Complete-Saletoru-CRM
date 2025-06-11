import React, { useState, useEffect } from 'react';
import { ContactsTable } from '../components/contacts/ContactsTable';
import { ContactModal } from '../components/contacts/ContactModal';
import { ContactDetailModal } from '../components/contacts/ContactDetailModal';
import { Contact, CreateContactData, UpdateContactData } from '../types/contacts';
import { ContactsAPI } from '../lib/contacts-api';
import { ContactsEmptyState } from '../components/empty-states/ContactsEmptyState';
import { GuruSuggestion } from '../components/empty-states/GuruSuggestion';
import { usePlan } from '../contexts/PlanContext';
import { ImportExportButton } from '../components/import-export/ImportExportButton';
import { BulkActionBar } from '../components/import-export/BulkActionBar';
import { GuruImportSuggestion } from '../components/import-export/GuruImportSuggestion';

const Contacts: React.FC = () => {
  const { currentPlan } = usePlan();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuruSuggestion, setShowGuruSuggestion] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [showImportSuggestion, setShowImportSuggestion] = useState(false);
  const [lastImportCount, setLastImportCount] = useState(0);

  useEffect(() => {
    loadContacts();
  }, [refreshTrigger]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await ContactsAPI.getContacts();
      setContacts(data);
      
      // Show Guru suggestion if this is the first contact
      if (data.length === 1) {
        setShowGuruSuggestion(true);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = () => {
    setSelectedContact(null);
    setShowCreateModal(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setShowCreateModal(true);
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setShowDetailModal(true);
  };

  const handleSaveContact = async (contactData: CreateContactData | UpdateContactData) => {
    try {
      if ('id' in contactData) {
        await ContactsAPI.updateContact(contactData.id, contactData);
      } else {
        await ContactsAPI.createContact(contactData);
      }
      
      setShowCreateModal(false);
      setShowDetailModal(false);
      setSelectedContact(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowDetailModal(false);
    setSelectedContact(null);
  };

  const handleImportContacts = () => {
    // This will be handled by the ImportExportButton component
  };

  const handleGuruSuggestion = (suggestion: string) => {
    // In a real app, this would trigger the Guru assistant
    alert(`Guru suggestion: ${suggestion}`);
    setShowGuruSuggestion(false);
  };
  
  const handleImportComplete = () => {
    // Refresh contacts after import
    setRefreshTrigger(prev => prev + 1);
    
    // Show Guru suggestion for analysis if on Team plan
    if (currentPlan === 'team') {
      setLastImportCount(20); // This would be the actual count from the import
      setShowImportSuggestion(true);
    }
  };
  
  const handleBulkActionComplete = () => {
    // Refresh contacts after bulk action
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleAnalyzeImport = () => {
    // In a real app, this would trigger Guru's analysis
    alert('Guru would analyze your imported data and suggest tags, scores, and segments');
    setShowImportSuggestion(false);
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!loading && contacts.length === 0) {
    return (
      <ContactsEmptyState 
        onCreateContact={handleCreateContact} 
        onImportContacts={handleImportContacts}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Guru suggestion for first contact */}
      {showGuruSuggestion && currentPlan === 'team' && (
        <div className="absolute bottom-24 right-24 z-10 max-w-sm">
          <GuruSuggestion
            title="Great start!"
            description="Here are some next steps to build your contact database:"
            suggestions={[
              "Import contacts from CSV",
              "Connect with LinkedIn to find more leads",
              "Set up lead scoring to prioritize contacts",
              "Create tags to organize your contacts"
            ]}
            onSuggestionClick={handleGuruSuggestion}
            onClose={() => setShowGuruSuggestion(false)}
          />
        </div>
      )}
      
      {/* Guru suggestion after import */}
      {showImportSuggestion && (
        <div className="mb-6">
          <GuruImportSuggestion
            entityType="contacts"
            importCount={lastImportCount}
            onClose={() => setShowImportSuggestion(false)}
            onAnalyze={handleAnalyzeImport}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Contacts</h1>
          <p className="text-dark-400">{contacts.length} contacts found</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <ImportExportButton 
            entityType="contacts"
            onImportComplete={handleImportComplete}
          />
          
          <button
            onClick={handleCreateContact}
            className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>
      
      {/* Bulk Action Bar (shown when items are selected) */}
      {selectedContactIds.length > 0 && (
        <BulkActionBar
          entityType="contacts"
          selectedIds={selectedContactIds}
          onClearSelection={() => setSelectedContactIds([])}
          onActionComplete={handleBulkActionComplete}
          availableActions={['assign', 'tag', 'status', 'delete', 'export']}
          statuses={['active', 'inactive', 'prospect', 'customer']}
          tags={['VIP', 'Lead', 'Customer', 'Cold', 'Hot']}
        />
      )}

      <ContactsTable
        key={refreshTrigger}
        onCreateContact={handleCreateContact}
        onEditContact={handleEditContact}
        onViewContact={handleViewContact}
        onSelectionChange={setSelectedContactIds}
      />

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <ContactModal
          contact={selectedContact}
          onSave={handleSaveContact}
          onClose={handleCloseModals}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedContact && (
        <ContactDetailModal
          contact={selectedContact}
          onClose={handleCloseModals}
          onEdit={handleEditContact}
        />
      )}
    </div>
  );
};

// Add Plus icon
const Plus = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default Contacts;