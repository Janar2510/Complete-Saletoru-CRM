import React, { useState } from 'react';
import { Download, X, Check, FileText, Filter } from 'lucide-react';
import { Card } from '../common/Card';
import { ImportExportAPI } from '../../lib/import-export-api';
import { ExportOptions } from '../../types/import-export';

interface CsvExportPanelProps {
  entityType: 'contacts' | 'companies' | 'deals';
  filters?: any;
  onClose: () => void;
}

export const CsvExportPanel: React.FC<CsvExportPanelProps> = ({
  entityType,
  filters,
  onClose
}) => {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [headerFormat, setHeaderFormat] = useState<'snake_case' | 'readable'>('readable');
  const [includeRelations, setIncludeRelations] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  const getAvailableFields = () => {
    switch (entityType) {
      case 'contacts':
        return [
          { value: 'id', label: 'ID' },
          { value: 'first_name', label: 'First Name' },
          { value: 'last_name', label: 'Last Name' },
          { value: 'email', label: 'Email' },
          { value: 'phone', label: 'Phone' },
          { value: 'title', label: 'Job Title' },
          { value: 'company.name', label: 'Company Name' },
          { value: 'lead_score', label: 'Lead Score' },
          { value: 'status', label: 'Status' },
          { value: 'lead_source', label: 'Lead Source' },
          { value: 'linkedin_url', label: 'LinkedIn URL' },
          { value: 'twitter_url', label: 'Twitter URL' },
          { value: 'notes', label: 'Notes' },
          { value: 'tags', label: 'Tags' },
          { value: 'created_at', label: 'Created Date' },
          { value: 'updated_at', label: 'Updated Date' },
          { value: 'last_contacted_at', label: 'Last Contacted Date' },
          { value: 'last_interaction_at', label: 'Last Interaction Date' },
        ];
      case 'companies':
        return [
          { value: 'id', label: 'ID' },
          { value: 'name', label: 'Company Name' },
          { value: 'domain', label: 'Domain' },
          { value: 'industry', label: 'Industry' },
          { value: 'size', label: 'Size' },
          { value: 'phone', label: 'Phone' },
          { value: 'email', label: 'Email' },
          { value: 'website', label: 'Website' },
          { value: 'annual_revenue', label: 'Annual Revenue' },
          { value: 'employee_count', label: 'Employee Count' },
          { value: 'status', label: 'Status' },
          { value: 'description', label: 'Description' },
          { value: 'created_at', label: 'Created Date' },
          { value: 'updated_at', label: 'Updated Date' },
        ];
      case 'deals':
        return [
          { value: 'id', label: 'ID' },
          { value: 'deal_id', label: 'Deal ID' },
          { value: 'title', label: 'Deal Title' },
          { value: 'description', label: 'Description' },
          { value: 'value', label: 'Value' },
          { value: 'currency', label: 'Currency' },
          { value: 'stage.name', label: 'Stage' },
          { value: 'probability', label: 'Probability' },
          { value: 'contact.name', label: 'Contact Name' },
          { value: 'company.name', label: 'Company Name' },
          { value: 'status', label: 'Status' },
          { value: 'expected_close_date', label: 'Expected Close Date' },
          { value: 'actual_close_date', label: 'Actual Close Date' },
          { value: 'tags', label: 'Tags' },
          { value: 'created_at', label: 'Created Date' },
          { value: 'updated_at', label: 'Updated Date' },
        ];
    }
  };
  
  const handleToggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };
  
  const handleSelectAll = () => {
    if (selectedFields.length === getAvailableFields()?.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(getAvailableFields()?.map(f => f.value) || []);
    }
  };
  
  const handleExport = async () => {
    try {
      setExporting(true);
      
      const options: ExportOptions = {
        entityType,
        fields: selectedFields.length > 0 ? selectedFields : getAvailableFields()?.map(f => f.value) || [],
        filters,
        includeRelations,
        headerFormat
      };
      
      let csvContent: string;
      
      switch (entityType) {
        case 'contacts':
          csvContent = await ImportExportAPI.exportContacts(options);
          break;
        case 'companies':
          csvContent = await ImportExportAPI.exportCompanies(options);
          break;
        case 'deals':
          csvContent = await ImportExportAPI.exportDeals(options);
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
      
      onClose();
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExporting(false);
    }
  };
  
  const getEntityTypeLabel = () => {
    switch (entityType) {
      case 'contacts': return 'Contacts';
      case 'companies': return 'Companies';
      case 'deals': return 'Deals';
    }
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Export {getEntityTypeLabel()}</h3>
            <p className="text-sm text-dark-400">Select fields to include in your export</p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
        >
          <X className="w-5 h-5 text-dark-400" />
        </button>
      </div>
      
      <div className="space-y-6">
        {/* Field Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-white">Fields to Export</h4>
            <button
              onClick={handleSelectAll}
              className="text-xs text-accent hover:text-accent/80 transition-colors"
            >
              {selectedFields.length === getAvailableFields()?.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {getAvailableFields()?.map(field => (
              <label key={field.value} className="flex items-center space-x-2 p-2 hover:bg-dark-200/50 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field.value)}
                  onChange={() => handleToggleField(field.value)}
                  className="rounded border-dark-300 text-accent focus:ring-accent"
                />
                <span className="text-white text-sm">{field.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Export Options */}
        <div className="bg-dark-200/50 p-4 rounded-lg">
          <h4 className="font-medium text-white mb-3">Export Options</h4>
          
          <div className="space-y-3">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeRelations}
                  onChange={(e) => setIncludeRelations(e.target.checked)}
                  className="rounded border-dark-300 text-accent focus:ring-accent"
                />
                <span className="text-white text-sm">Include related data (companies, contacts, etc.)</span>
              </label>
            </div>
            
            <div>
              <p className="text-sm text-white mb-2">Header Format</p>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="readable"
                    checked={headerFormat === 'readable'}
                    onChange={() => setHeaderFormat('readable')}
                    className="text-accent focus:ring-accent"
                  />
                  <span className="text-white text-sm">Readable (First Name)</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="snake_case"
                    checked={headerFormat === 'snake_case'}
                    onChange={() => setHeaderFormat('snake_case')}
                    className="text-accent focus:ring-accent"
                  />
                  <span className="text-white text-sm">Database (first_name)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Active Filters */}
        {filters && Object.keys(filters).length > 0 && (
          <div className="bg-dark-200/50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <Filter className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium">Active Filters</p>
                <p className="text-sm text-dark-400 mt-1">
                  Your export will include only the data that matches your current filters.
                </p>
                
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => (
                    <div key={key} className="bg-dark-300 text-dark-400 px-2 py-1 rounded-lg text-xs">
                      {key.replace('_', ' ')}: {value}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end mt-6 pt-4 border-t border-dark-200">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="bg-accent hover:bg-accent/80 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          {exporting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </>
          )}
        </button>
      </div>
    </Card>
  );
};