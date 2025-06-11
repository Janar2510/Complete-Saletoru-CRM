import React, { useState } from 'react';
import { 
  UserPlus, 
  Tag, 
  Trash2, 
  GitBranch, 
  Download, 
  AlertTriangle, 
  Check,
  RefreshCw
} from 'lucide-react';
import { Card } from '../common/Card';
import { ImportExportAPI } from '../../lib/import-export-api';
import { BulkActionOptions } from '../../types/import-export';
import { useAuth } from '../../contexts/AuthContext';

interface BulkActionBarProps {
  entityType: 'contacts' | 'companies' | 'deals';
  selectedIds: string[];
  onClearSelection: () => void;
  onActionComplete: () => void;
  availableActions?: ('assign' | 'tag' | 'status' | 'delete' | 'stage' | 'export')[];
  users?: any[];
  tags?: string[];
  stages?: any[];
  statuses?: string[];
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  entityType,
  selectedIds,
  onClearSelection,
  onActionComplete,
  availableActions = ['assign', 'tag', 'status', 'delete', 'export'],
  users = [],
  tags = [],
  stages = [],
  statuses = []
}) => {
  const { user } = useAuth();
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<BulkActionOptions['action'] | null>(null);
  const [actionData, setActionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // UI state for action forms
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [newTag, setNewTag] = useState('');
  
  const handleAction = async (action: BulkActionOptions['action'], data?: any) => {
    // For delete action, show confirmation first
    if (action === 'delete') {
      setConfirmationAction('delete');
      setShowConfirmation(true);
      return;
    }
    
    // For export action, handle separately
    if (action === 'export') {
      handleExport();
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await ImportExportAPI.performBulkAction({
        entityType,
        entityIds: selectedIds,
        action,
        data
      });
      
      setSuccess(`Successfully performed ${action} action on ${selectedIds.length} ${entityType}`);
      onActionComplete();
      
      // Clear selection after successful action
      setTimeout(() => {
        onClearSelection();
        setSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Error performing bulk action:', err);
      setError(err instanceof Error ? err.message : 'Failed to perform action');
    } finally {
      setLoading(false);
    }
  };
  
  const handleConfirmAction = async () => {
    if (!confirmationAction) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await ImportExportAPI.performBulkAction({
        entityType,
        entityIds: selectedIds,
        action: confirmationAction,
        data: actionData
      });
      
      setShowConfirmation(false);
      setConfirmationAction(null);
      setActionData(null);
      
      setSuccess(`Successfully performed ${confirmationAction} action on ${selectedIds.length} ${entityType}`);
      onActionComplete();
      
      // Clear selection after successful action
      setTimeout(() => {
        onClearSelection();
        setSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Error performing bulk action:', err);
      setError(err instanceof Error ? err.message : 'Failed to perform action');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let csvContent: string;
      
      switch (entityType) {
        case 'contacts':
          csvContent = await ImportExportAPI.exportContacts({
            entityType,
            fields: [],
            filters: { ids: selectedIds }
          });
          break;
        case 'companies':
          csvContent = await ImportExportAPI.exportCompanies({
            entityType,
            fields: [],
            filters: { ids: selectedIds }
          });
          break;
        case 'deals':
          csvContent = await ImportExportAPI.exportDeals({
            entityType,
            fields: [],
            filters: { ids: selectedIds }
          });
          break;
      }
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${entityType}_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess(`Successfully exported ${selectedIds.length} ${entityType}`);
      
      // Don't clear selection after export
    } catch (err) {
      console.error('Error exporting data:', err);
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddTag = () => {
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags([...selectedTags, newTag]);
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };
  
  const getEntityTypeLabel = () => {
    switch (entityType) {
      case 'contacts': return 'contacts';
      case 'companies': return 'companies';
      case 'deals': return 'deals';
    }
  };
  
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-white">
          {selectedIds.length} {getEntityTypeLabel()} selected
        </span>
        
        <div className="flex items-center space-x-2">
          {/* Assign Owner */}
          {availableActions.includes('assign') && (
            <div className="relative group">
              <button
                className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1.5 rounded-lg text-sm flex items-center space-x-1 transition-colors"
              >
                <UserPlus className="w-3 h-3" />
                <span>Assign</span>
              </button>
              
              <div className="absolute right-0 top-full mt-1 bg-surface border border-dark-200 rounded-lg shadow-lg z-10 p-3 w-64 hidden group-hover:block">
                <p className="text-sm text-white mb-2">Assign to user:</p>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent mb-2"
                >
                  <option value="">Select user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={() => handleAction('assign', { owner_id: selectedUser })}
                  disabled={!selectedUser || loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                >
                  Assign
                </button>
              </div>
            </div>
          )}
          
          {/* Add Tags */}
          {availableActions.includes('tag') && (
            <div className="relative group">
              <button
                className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 px-3 py-1.5 rounded-lg text-sm flex items-center space-x-1 transition-colors"
              >
                <Tag className="w-3 h-3" />
                <span>Tag</span>
              </button>
              
              <div className="absolute right-0 top-full mt-1 bg-surface border border-dark-200 rounded-lg shadow-lg z-10 p-3 w-64 hidden group-hover:block">
                <p className="text-sm text-white mb-2">Add tags:</p>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs flex items-center"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-purple-400 hover:text-purple-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="New tag"
                    className="flex-1 bg-dark-200 border border-dark-300 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!newTag}
                    className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white px-2 py-1.5 rounded-lg text-sm transition-colors"
                  >
                    Add
                  </button>
                </div>
                
                <div className="mb-2">
                  <p className="text-xs text-dark-400 mb-1">Common tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {tags.slice(0, 5).map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (!selectedTags.includes(tag)) {
                            setSelectedTags([...selectedTags, tag]);
                          }
                        }}
                        className="bg-dark-300 text-dark-400 hover:bg-dark-400 hover:text-white px-2 py-0.5 rounded text-xs transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => handleAction('tag', { tags: selectedTags })}
                  disabled={selectedTags.length === 0 || loading}
                  className="w-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                >
                  Apply Tags
                </button>
              </div>
            </div>
          )}
          
          {/* Change Status */}
          {availableActions.includes('status') && (
            <div className="relative group">
              <button
                className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 px-3 py-1.5 rounded-lg text-sm flex items-center space-x-1 transition-colors"
              >
                <span>Status</span>
              </button>
              
              <div className="absolute right-0 top-full mt-1 bg-surface border border-dark-200 rounded-lg shadow-lg z-10 p-3 w-64 hidden group-hover:block">
                <p className="text-sm text-white mb-2">Change status to:</p>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent mb-2"
                >
                  <option value="">Select status</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={() => handleAction('status', { status: selectedStatus })}
                  disabled={!selectedStatus || loading}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                >
                  Update Status
                </button>
              </div>
            </div>
          )}
          
          {/* Change Stage (Deals only) */}
          {entityType === 'deals' && availableActions.includes('stage') && (
            <div className="relative group">
              <button
                className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1.5 rounded-lg text-sm flex items-center space-x-1 transition-colors"
              >
                <GitBranch className="w-3 h-3" />
                <span>Stage</span>
              </button>
              
              <div className="absolute right-0 top-full mt-1 bg-surface border border-dark-200 rounded-lg shadow-lg z-10 p-3 w-64 hidden group-hover:block">
                <p className="text-sm text-white mb-2">Move to stage:</p>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent mb-2"
                >
                  <option value="">Select stage</option>
                  {stages.map(stage => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={() => handleAction('stage', { stage_id: selectedStage })}
                  disabled={!selectedStage || loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                >
                  Move to Stage
                </button>
              </div>
            </div>
          )}
          
          {/* Export */}
          {availableActions.includes('export') && (
            <button
              onClick={() => handleAction('export')}
              disabled={loading}
              className="bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-1.5 rounded-lg text-sm flex items-center space-x-1 transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
          )}
          
          {/* Delete */}
          {availableActions.includes('delete') && (
            <button
              onClick={() => handleAction('delete')}
              disabled={loading}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded-lg text-sm flex items-center space-x-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          )}
          
          {/* Clear Selection */}
          <button
            onClick={onClearSelection}
            disabled={loading}
            className="px-3 py-1.5 text-dark-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="mt-3 bg-red-500/20 border border-red-500/30 text-red-400 p-2 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mt-3 bg-green-500/20 border border-green-500/30 text-green-400 p-2 rounded-lg flex items-center space-x-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}
      
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-start space-x-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Confirm Action</h3>
                <p className="text-dark-400">
                  {confirmationAction === 'delete' ? (
                    `Are you sure you want to delete ${selectedIds.length} ${getEntityTypeLabel()}? This action cannot be undone.`
                  ) : (
                    `Are you sure you want to perform this action on ${selectedIds.length} ${getEntityTypeLabel()}?`
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setConfirmationAction(null);
                }}
                className="px-4 py-2 text-dark-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleConfirmAction}
                disabled={loading}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  confirmationAction === 'delete'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-accent hover:bg-accent/80 text-white'
                }`}
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  confirmationAction === 'delete' ? 'Delete' : 'Confirm'
                )}
              </button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};