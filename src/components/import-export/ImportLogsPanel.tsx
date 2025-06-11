import React, { useState, useEffect } from 'react';
import { Clock, FileText, Download, RefreshCw, Check, X, AlertTriangle } from 'lucide-react';
import { Card } from '../common/Card';
import { ImportExportAPI } from '../../lib/import-export-api';
import { ImportLog } from '../../types/import-export';
import { formatDistanceToNow } from 'date-fns';

interface ImportLogsPanelProps {
  onClose: () => void;
}

export const ImportLogsPanel: React.FC<ImportLogsPanelProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ImportLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    loadLogs();
  }, []);
  
  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await ImportExportAPI.getImportLogs();
      setLogs(data);
    } catch (error) {
      console.error('Error loading import logs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewDetails = (log: ImportLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };
  
  const getEntityTypeLabel = (type: ImportLog['type']) => {
    switch (type) {
      case 'contacts': return 'Contacts';
      case 'companies': return 'Companies';
      case 'deals': return 'Deals';
    }
  };
  
  const getStatusColor = (log: ImportLog) => {
    if (log.error_count === 0) return 'bg-green-500/20 text-green-400';
    if (log.error_count < log.row_count) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };
  
  const getStatusIcon = (log: ImportLog) => {
    if (log.error_count === 0) return <Check className="w-4 h-4" />;
    if (log.error_count < log.row_count) return <AlertTriangle className="w-4 h-4" />;
    return <X className="w-4 h-4" />;
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Import History</h3>
            <p className="text-sm text-dark-400">View your recent data imports</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={loadLogs}
            className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-dark-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>
      </div>
      
      {loading && logs.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-dark-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No import history</p>
          <p className="text-dark-400 text-sm">
            You haven't imported any data yet. Try importing some contacts, companies, or deals.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-200/50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-dark-400">Date</th>
                <th className="p-3 text-left text-sm font-medium text-dark-400">Type</th>
                <th className="p-3 text-left text-sm font-medium text-dark-400">File</th>
                <th className="p-3 text-left text-sm font-medium text-dark-400">Records</th>
                <th className="p-3 text-left text-sm font-medium text-dark-400">Status</th>
                <th className="p-3 text-left text-sm font-medium text-dark-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-dark-200/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-dark-400" />
                      <span className="text-white">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </td>
                  
                  <td className="p-3">
                    <span className="text-white">{getEntityTypeLabel(log.type)}</span>
                  </td>
                  
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-dark-400" />
                      <span className="text-white">{log.file_name}</span>
                    </div>
                  </td>
                  
                  <td className="p-3">
                    <span className="text-white">{log.success_count} / {log.row_count}</span>
                  </td>
                  
                  <td className="p-3">
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(log)}`}>
                      {getStatusIcon(log)}
                      <span>
                        {log.error_count === 0 
                          ? 'Success' 
                          : log.error_count === log.row_count 
                          ? 'Failed' 
                          : 'Partial'}
                      </span>
                    </div>
                  </td>
                  
                  <td className="p-3">
                    <button
                      onClick={() => handleViewDetails(log)}
                      className="text-accent hover:text-accent/80 text-sm transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Log Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Import Details</h3>
                  <p className="text-sm text-dark-400">
                    {selectedLog.file_name} • {formatDistanceToNow(new Date(selectedLog.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedLog(null);
                }}
                className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
              >
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-dark-200/50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-white">{selectedLog.row_count}</p>
                  <p className="text-sm text-dark-400">Total Records</p>
                </div>
                
                <div className="bg-dark-200/50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-green-400">{selectedLog.success_count}</p>
                  <p className="text-sm text-dark-400">Successful</p>
                </div>
                
                <div className="bg-dark-200/50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-red-400">{selectedLog.error_count}</p>
                  <p className="text-sm text-dark-400">Errors</p>
                </div>
              </div>
              
              {/* Field Mapping */}
              {selectedLog.mapping && (
                <div>
                  <h4 className="font-medium text-white mb-3">Field Mapping</h4>
                  <div className="bg-dark-200/50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedLog.mapping).map(([csvHeader, dbField]) => (
                        <div key={csvHeader} className="flex justify-between">
                          <span className="text-dark-400">{csvHeader}</span>
                          <span className="text-white">{dbField}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Errors */}
              {selectedLog.errors && selectedLog.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-3">Errors</h4>
                  <div className="bg-dark-200/50 p-4 rounded-lg max-h-60 overflow-y-auto">
                    <ul className="space-y-2">
                      {selectedLog.errors.map((error: any, index: number) => (
                        <li key={index} className="text-sm">
                          <span className="text-red-400">Row {error.row}:</span> <span className="text-dark-400">{error.error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6 pt-4 border-t border-dark-200">
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedLog(null);
                }}
                className="bg-dark-200 hover:bg-dark-300 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};