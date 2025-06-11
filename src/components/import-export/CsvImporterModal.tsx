import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Check, AlertTriangle, RefreshCw, FileText, Database, ArrowRight } from 'lucide-react';
import { Card } from '../common/Card';
import { ImportExportAPI } from '../../lib/import-export-api';
import { ImportPreview, ColumnMapping } from '../../types/import-export';
import { useAuth } from '../../contexts/AuthContext';

interface CsvImporterModalProps {
  entityType: 'contacts' | 'companies' | 'deals';
  onClose: () => void;
  onImportComplete: () => void;
}

export const CsvImporterModal: React.FC<CsvImporterModalProps> = ({
  entityType,
  onClose,
  onImportComplete
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload');
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update' | 'create_new'>('update');
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);
  
  const handleFileChange = async (selectedFile: File) => {
    try {
      setError(null);
      
      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        return;
      }
      
      setFile(selectedFile);
      
      // Parse CSV and generate preview
      const previewData = await ImportExportAPI.parseCSV(selectedFile);
      setPreview(previewData);
      setMapping(previewData.mapping);
      setStep('mapping');
    } catch (err) {
      console.error('Error parsing CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    }
  };
  
  const handleFieldMapping = (index: number, dbField: string) => {
    const newMapping = [...mapping];
    newMapping[index] = { ...newMapping[index], dbField };
    setMapping(newMapping);
  };
  
  const handleContinueToPreview = () => {
    // Validate required fields
    const requiredFields = ['first_name', 'last_name'];
    const missingRequired = requiredFields.filter(field => 
      !mapping.some(m => m.dbField === field)
    );
    
    if (missingRequired.length > 0) {
      setError(`Missing required fields: ${missingRequired.join(', ')}`);
      return;
    }
    
    setError(null);
    setStep('preview');
  };
  
  const handleStartImport = async () => {
    if (!file) return;
    
    try {
      setError(null);
      setStep('importing');
      
      let result;
      
      switch (entityType) {
        case 'contacts':
          result = await ImportExportAPI.importContacts(file, mapping, duplicateStrategy);
          break;
        case 'companies':
          result = await ImportExportAPI.importCompanies(file, mapping, duplicateStrategy);
          break;
        case 'deals':
          result = await ImportExportAPI.importDeals(file, mapping, duplicateStrategy);
          break;
      }
      
      setImportResult(result);
      setStep('complete');
    } catch (err) {
      console.error('Error importing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to import data');
      setStep('preview'); // Go back to preview step
    }
  };
  
  const getEntityTypeLabel = () => {
    switch (entityType) {
      case 'contacts': return 'Contacts';
      case 'companies': return 'Companies';
      case 'deals': return 'Deals';
    }
  };
  
  const getAvailableFields = () => {
    switch (entityType) {
      case 'contacts':
        return [
          { value: 'first_name', label: 'First Name', required: true },
          { value: 'last_name', label: 'Last Name', required: true },
          { value: 'email', label: 'Email' },
          { value: 'phone', label: 'Phone' },
          { value: 'title', label: 'Job Title' },
          { value: 'company_name', label: 'Company Name' },
          { value: 'lead_score', label: 'Lead Score' },
          { value: 'status', label: 'Status' },
          { value: 'lead_source', label: 'Lead Source' },
          { value: 'linkedin_url', label: 'LinkedIn URL' },
          { value: 'twitter_url', label: 'Twitter URL' },
          { value: 'notes', label: 'Notes' },
          { value: 'tags', label: 'Tags (semicolon separated)' },
        ];
      case 'companies':
        return [
          { value: 'name', label: 'Company Name', required: true },
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
        ];
      case 'deals':
        return [
          { value: 'title', label: 'Deal Title', required: true },
          { value: 'description', label: 'Description' },
          { value: 'value', label: 'Value' },
          { value: 'currency', label: 'Currency' },
          { value: 'stage_name', label: 'Stage Name' },
          { value: 'probability', label: 'Probability' },
          { value: 'expected_close_date', label: 'Expected Close Date' },
          { value: 'status', label: 'Status' },
          { value: 'contact_email', label: 'Contact Email' },
          { value: 'company_name', label: 'Company Name' },
          { value: 'tags', label: 'Tags (semicolon separated)' },
        ];
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Import {getEntityTypeLabel()}</h2>
              <p className="text-sm text-dark-400">
                {step === 'upload' && 'Upload a CSV file to import data'}
                {step === 'mapping' && 'Map CSV columns to database fields'}
                {step === 'preview' && 'Review data before importing'}
                {step === 'importing' && 'Importing data...'}
                {step === 'complete' && 'Import completed'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            {['upload', 'mapping', 'preview', 'importing', 'complete'].map((s, index) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === s 
                    ? 'bg-accent text-white' 
                    : step === 'complete' || 
                      (step === 'importing' && s !== 'complete') || 
                      (step === 'preview' && (s === 'upload' || s === 'mapping')) || 
                      (step === 'mapping' && s === 'upload')
                    ? 'bg-green-500 text-white'
                    : 'bg-dark-200 text-dark-400'
                }`}>
                  {step === 'complete' || 
                   (step === 'importing' && s !== 'complete' && s !== 'importing') || 
                   (step === 'preview' && (s === 'upload' || s === 'mapping')) || 
                   (step === 'mapping' && s === 'upload') ? (
                    <Check className="w-4 h-4" />
                  ) : step === 'importing' && s === 'importing' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    index + 1
                  )}
                </div>
                
                {index < 4 && (
                  <div className={`w-12 h-0.5 ${
                    (step === 'complete') || 
                    (step === 'importing' && index < 3) || 
                    (step === 'preview' && index < 2) || 
                    (step === 'mapping' && index < 1)
                      ? 'bg-green-500'
                      : 'bg-dark-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}
          
          {/* Step Content */}
          {step === 'upload' && (
            <div 
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive 
                  ? 'border-accent bg-accent/10' 
                  : 'border-dark-300 hover:border-dark-200'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                className="hidden"
                accept=".csv"
              />
              
              <Upload className="w-16 h-16 text-dark-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Upload CSV File</h3>
              <p className="text-dark-400 mb-6 max-w-md mx-auto">
                Drag and drop your CSV file here, or click the button below to select a file from your computer.
              </p>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Select CSV File
              </button>
              
              <div className="mt-8 text-sm text-dark-400">
                <p className="mb-2">Your CSV file should include the following columns:</p>
                <ul className="space-y-1">
                  {getAvailableFields()
                    .filter(field => field.required)
                    .map(field => (
                      <li key={field.value} className="flex items-center justify-center space-x-1">
                        <span className="text-red-400">*</span>
                        <span>{field.label} (required)</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}
          
          {step === 'mapping' && preview && (
            <div className="space-y-6">
              <div className="bg-dark-200/50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Database className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Map CSV Columns to Fields</p>
                    <p className="text-sm text-dark-400 mt-1">
                      We've automatically mapped some columns based on their names. Please review and adjust as needed.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-200/50">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-dark-400">CSV Column</th>
                      <th className="p-3 text-left text-sm font-medium text-dark-400">Sample Data</th>
                      <th className="p-3 text-left text-sm font-medium text-dark-400">Map to Field</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-200">
                    {mapping.map((map, index) => (
                      <tr key={index} className="hover:bg-dark-200/30 transition-colors">
                        <td className="p-3">
                          <span className="text-white">{map.csvHeader}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-dark-400">{map.sample || 'N/A'}</span>
                        </td>
                        <td className="p-3">
                          <select
                            value={map.dbField}
                            onChange={(e) => handleFieldMapping(index, e.target.value)}
                            className="w-full bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                          >
                            <option value="">-- Do not import --</option>
                            {getAvailableFields().map(field => (
                              <option 
                                key={field.value} 
                                value={field.value}
                                disabled={mapping.some((m, i) => i !== index && m.dbField === field.value)}
                              >
                                {field.label} {field.required ? '(required)' : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {step === 'preview' && preview && (
            <div className="space-y-6">
              <div className="bg-dark-200/50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Duplicate Handling</p>
                    <p className="text-sm text-dark-400 mt-1">
                      Choose how to handle duplicate records (matched by email for contacts, domain for companies, or title for deals).
                    </p>
                    
                    <div className="mt-3 space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          value="update"
                          checked={duplicateStrategy === 'update'}
                          onChange={() => setDuplicateStrategy('update')}
                          className="text-accent focus:ring-accent"
                        />
                        <span className="ml-2 text-white">Update existing records</span>
                      </label>
                      
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          value="skip"
                          checked={duplicateStrategy === 'skip'}
                          onChange={() => setDuplicateStrategy('skip')}
                          className="text-accent focus:ring-accent"
                        />
                        <span className="ml-2 text-white">Skip duplicates</span>
                      </label>
                      
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          value="create_new"
                          checked={duplicateStrategy === 'create_new'}
                          onChange={() => setDuplicateStrategy('create_new')}
                          className="text-accent focus:ring-accent"
                        />
                        <span className="ml-2 text-white">Create new records</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Data Preview</h3>
                <p className="text-dark-400 mb-4">
                  Showing {preview.rows.length} of {preview.totalRows} rows. Please review before importing.
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-200/50">
                      <tr>
                        {mapping.filter(m => m.dbField).map((map, index) => (
                          <th key={index} className="p-3 text-left text-sm font-medium text-dark-400">
                            {getAvailableFields().find(f => f.value === map.dbField)?.label || map.dbField}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-200">
                      {preview.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-dark-200/30 transition-colors">
                          {mapping.filter(m => m.dbField).map((map, colIndex) => {
                            const headerIndex = preview.headers.indexOf(map.csvHeader);
                            return (
                              <td key={colIndex} className="p-3">
                                <span className="text-white">{row[headerIndex] || 'N/A'}</span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="bg-dark-200/50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Ready to Import</p>
                    <p className="text-sm text-dark-400 mt-1">
                      You're about to import {preview.totalRows} records. This may take a few moments.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {step === 'importing' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold text-white mb-2">Importing Data</h3>
              <p className="text-dark-400 max-w-md mx-auto">
                Please wait while we import your data. This may take a few moments depending on the size of your file.
              </p>
            </div>
          )}
          
          {step === 'complete' && importResult && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-2">Import Complete</h3>
              <p className="text-dark-400 mb-6 max-w-md mx-auto">
                Successfully imported {importResult.success_count} out of {importResult.row_count} records.
                {importResult.error_count > 0 && ` ${importResult.error_count} records had errors.`}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="bg-dark-200/50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-white">{importResult.row_count}</p>
                  <p className="text-sm text-dark-400">Total Records</p>
                </div>
                
                <div className="bg-dark-200/50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-green-400">{importResult.success_count}</p>
                  <p className="text-sm text-dark-400">Successful</p>
                </div>
                
                <div className="bg-dark-200/50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-red-400">{importResult.error_count}</p>
                  <p className="text-sm text-dark-400">Errors</p>
                </div>
              </div>
              
              {importResult.error_count > 0 && (
                <div className="mt-6 text-left">
                  <h4 className="font-medium text-white mb-2">Error Details</h4>
                  <div className="bg-dark-200/50 p-4 rounded-lg max-h-40 overflow-y-auto">
                    <ul className="space-y-2">
                      {importResult.errors?.slice(0, 5).map((error: any, index: number) => (
                        <li key={index} className="text-sm">
                          <span className="text-red-400">Row {error.row}:</span> <span className="text-dark-400">{error.error}</span>
                        </li>
                      ))}
                      {(importResult.errors?.length || 0) > 5 && (
                        <li className="text-sm text-dark-400">
                          And {importResult.errors.length - 5} more errors...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <p className="text-dark-400 text-sm mb-2">
                  What would you like to do next?
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                      setMapping([]);
                      setStep('upload');
                    }}
                    className="text-accent hover:text-accent/80 transition-colors"
                  >
                    Import Another File
                  </button>
                  <button
                    onClick={onImportComplete}
                    className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <span>View {getEntityTypeLabel()}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'complete' && step !== 'importing' && (
          <div className="flex items-center justify-between p-6 border-t border-dark-200">
            <button
              onClick={step === 'upload' ? onClose : () => setStep(
                step === 'mapping' ? 'upload' : 'mapping'
              )}
              className="px-4 py-2 text-dark-400 hover:text-white transition-colors"
            >
              {step === 'upload' ? 'Cancel' : 'Back'}
            </button>
            
            <button
              onClick={
                step === 'mapping' 
                  ? handleContinueToPreview 
                  : step === 'preview' 
                  ? handleStartImport 
                  : () => {}
              }
              disabled={
                (step === 'upload' && !file) ||
                (step === 'mapping' && mapping.filter(m => m.dbField).length === 0)
              }
              className="bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
            >
              {step === 'mapping' ? 'Continue' : step === 'preview' ? 'Start Import' : 'Next'}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};