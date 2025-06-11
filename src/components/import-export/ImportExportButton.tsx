import React, { useState } from 'react';
import { Upload, Download, Clock, Plus } from 'lucide-react';
import { CsvImporterModal } from './CsvImporterModal';
import { CsvExportPanel } from './CsvExportPanel';
import { ImportLogsPanel } from './ImportLogsPanel';

interface ImportExportButtonProps {
  entityType: 'contacts' | 'companies' | 'deals';
  filters?: any;
  onImportComplete?: () => void;
}

export const ImportExportButton: React.FC<ImportExportButtonProps> = ({
  entityType,
  filters,
  onImportComplete
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showExporter, setShowExporter] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  
  const handleImportComplete = () => {
    setShowImporter(false);
    if (onImportComplete) {
      onImportComplete();
    }
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-dark-200 hover:bg-dark-300 text-dark-400 hover:text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
      >
        <Upload className="w-4 h-4" />
        <span>Import / Export</span>
      </button>
      
      {showMenu && (
        <div className="absolute right-0 top-full mt-1 bg-surface border border-dark-200 rounded-lg shadow-lg z-10 w-48">
          <button
            onClick={() => {
              setShowMenu(false);
              setShowImporter(true);
            }}
            className="w-full text-left px-4 py-2 text-white hover:bg-dark-200 transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4 text-green-400" />
            <span>Import from CSV</span>
          </button>
          
          <button
            onClick={() => {
              setShowMenu(false);
              setShowExporter(true);
            }}
            className="w-full text-left px-4 py-2 text-white hover:bg-dark-200 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Export to CSV</span>
          </button>
          
          <button
            onClick={() => {
              setShowMenu(false);
              setShowLogs(true);
            }}
            className="w-full text-left px-4 py-2 text-white hover:bg-dark-200 transition-colors flex items-center space-x-2"
          >
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Import History</span>
          </button>
        </div>
      )}
      
      {/* Import Modal */}
      {showImporter && (
        <CsvImporterModal
          entityType={entityType}
          onClose={() => setShowImporter(false)}
          onImportComplete={handleImportComplete}
        />
      )}
      
      {/* Export Panel */}
      {showExporter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <CsvExportPanel
              entityType={entityType}
              filters={filters}
              onClose={() => setShowExporter(false)}
            />
          </div>
        </div>
      )}
      
      {/* Import Logs Panel */}
      {showLogs && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl">
            <ImportLogsPanel
              onClose={() => setShowLogs(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};