import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit, 
  DollarSign, 
  Calendar, 
  User, 
  Building2, 
  Tag, 
  Percent,
  MessageSquare,
  Paperclip,
  Activity,
  Phone,
  Mail,
  Plus,
  TrendingUp,
  Mail as MailIcon,
  Cloud,
  Link
} from 'lucide-react';
import { Deal, DealNote, DealFile, DealActivity, EmailThread } from '../../types/deals';
import { DealsAPI } from '../../lib/deals-api';
import { Card } from '../common/Card';
import { formatDistanceToNow } from 'date-fns';
import { DealScoreBadge } from './DealScoreBadge';
import { EmailThreadList } from './EmailThreadList';
import { CloudStoragePanel } from './CloudStoragePanel';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

interface DealDetailModalProps {
  deal: Deal;
  onClose: () => void;
  onEdit: (deal: Deal) => void;
}

export const DealDetailModal: React.FC<DealDetailModalProps> = ({ deal, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'files' | 'activity' | 'scoring' | 'emails' | 'cloud'>('overview');
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [files, setFiles] = useState<DealFile[]>([]);
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [scoreLogs, setScoreLogs] = useState<any[]>([]);
  const [emailThreads, setEmailThreads] = useState<EmailThread[]>([]);
  const [cloudFolders, setCloudFolders] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [newEngagementScore, setNewEngagementScore] = useState(deal.engagement_score || 0);
  const [scoreReason, setScoreReason] = useState('');

  useEffect(() => {
    loadDealData();
  }, [deal.id]);

  const loadDealData = async () => {
    try {
      setLoading(true);
      const [notesData, filesData, activitiesData, scoreLogsData, emailThreadsData, cloudFoldersData] = await Promise.all([
        DealsAPI.getDealNotes(deal.id),
        DealsAPI.getDealFiles(deal.id),
        DealsAPI.getDealActivities(deal.id),
        DealsAPI.getLeadScoreLogs('deal', deal.id),
        DealsAPI.getEmailThreadsForDeal(deal.id),
        DealsAPI.getDealFolders(deal.id)
      ]);

      setNotes(notesData);
      setFiles(filesData);
      setActivities(activitiesData);
      setScoreLogs(scoreLogsData);
      setEmailThreads(emailThreadsData);
      setCloudFolders(cloudFoldersData);
    } catch (error) {
      console.error('Error loading deal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const note = await DealsAPI.createDealNote(deal.id, newNote);
      setNotes(prev => [note, ...prev]);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Determine file category based on file type
      let category: DealFile['category'] = 'other';
      const fileType = file.type.toLowerCase();
      
      if (fileType.includes('pdf')) {
        category = 'pdf';
      } else if (fileType.includes('image')) {
        category = 'image';
      } else if (fileType.includes('word') || fileType.includes('document')) {
        category = 'document';
      } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
        category = 'spreadsheet';
      } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
        category = 'presentation';
      }
      
      const dealFile = await DealsAPI.uploadDealFile(deal.id, file, category);
      setFiles(prev => [dealFile, ...prev]);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleUpdateEngagementScore = async () => {
    try {
      await DealsAPI.updateDealEngagementScore(deal.id, newEngagementScore, scoreReason);
      // Refresh data
      loadDealData();
      // Update deal in parent component
      onEdit({
        ...deal,
        engagement_score: newEngagementScore
      });
    } catch (error) {
      console.error('Error updating engagement score:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: deal.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: Deal['status']) => {
    switch (status) {
      case 'won':
        return 'bg-green-500/20 text-green-400';
      case 'lost':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  const getScoreChangeColor = (previous: number, current: number) => {
    if (current > previous) return 'text-green-400';
    if (current < previous) return 'text-red-400';
    return 'text-dark-400';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'notes', label: 'Notes', icon: MessageSquare, count: notes.length },
    { id: 'emails', label: 'Emails', icon: MailIcon, count: emailThreads.length },
    { id: 'files', label: 'Files', icon: Paperclip, count: files.length },
    { id: 'cloud', label: 'Cloud', icon: Cloud, count: cloudFolders.length },
    { id: 'activity', label: 'Activity', icon: Activity, count: activities.length },
    { id: 'scoring', label: 'Engagement', icon: TrendingUp },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-200">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-xl font-semibold text-white">{deal.title}</h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
                {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
              </span>
              <DealScoreBadge score={deal.engagement_score || 0} />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-dark-400 text-sm font-mono">{deal.deal_id}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(deal.deal_id)}
                className="text-dark-400 hover:text-white transition-colors"
                title="Copy Deal ID"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(deal)}
              className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
            >
              <X className="w-5 h-5 text-dark-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-200 overflow-x-auto">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="bg-dark-200 text-dark-400 text-xs px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-dark-200/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-dark-400">Value</span>
                  </div>
                  <p className="text-xl font-bold text-white">{formatCurrency(deal.value)}</p>
                </div>
                
                <div className="bg-dark-200/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Percent className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-dark-400">Probability</span>
                  </div>
                  <p className="text-xl font-bold text-white">{deal.probability}%</p>
                </div>
                
                <div className="bg-dark-200/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-dark-400">Expected Close</span>
                  </div>
                  <p className="text-sm font-medium text-white">
                    {deal.expected_close_date 
                      ? new Date(deal.expected_close_date).toLocaleDateString()
                      : 'Not set'
                    }
                  </p>
                </div>
                
                <div className="bg-dark-200/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-dark-400">Stage</span>
                  </div>
                  <p className="text-sm font-medium text-white">{deal.stage?.name}</p>
                </div>
              </div>

              {/* Description */}
              {deal.description && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                  <p className="text-dark-400">{deal.description}</p>
                </div>
              )}

              {/* Contact & Company Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {deal.contact && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Contact</h3>
                    <div className="bg-dark-200/50 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {deal.contact.first_name} {deal.contact.last_name}
                          </p>
                          <p className="text-sm text-dark-400">{deal.contact.title}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {deal.contact.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-dark-400" />
                            <span className="text-sm text-dark-400">{deal.contact.email}</span>
                          </div>
                        )}
                        {deal.contact.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-dark-400" />
                            <span className="text-sm text-dark-400">{deal.contact.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {deal.company && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Company</h3>
                    <div className="bg-dark-200/50 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{deal.company.name}</p>
                          <p className="text-sm text-dark-400">{deal.company.industry}</p>
                        </div>
                      </div>
                      {deal.company.website && (
                        <p className="text-sm text-accent">{deal.company.website}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {deal.tags && deal.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {deal.tags.map(tag => (
                      <span
                        key={tag}
                        className="bg-accent/20 text-accent px-3 py-1 rounded-lg text-sm flex items-center space-x-1"
                      >
                        <Tag className="w-3 h-3" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Add Note */}
              <div className="bg-dark-200/50 rounded-lg p-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note... Use @username to mention someone"
                  rows={3}
                  className="w-full bg-transparent border-none text-white placeholder-dark-400 focus:outline-none resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-dark-400">
                    Supports Markdown and @mentions
                  </div>
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Add Note
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-3">
                {notes.map(note => (
                  <div key={note.id} className="bg-dark-200/50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-white">
                            User
                          </span>
                          <span className="text-xs text-dark-400">
                            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {note.is_markdown ? (
                          <MarkdownRenderer content={note.content} />
                        ) : (
                          <p className="text-dark-300">{note.content}</p>
                        )}
                        
                        {/* Mentioned Users */}
                        {note.mentioned_users && note.mentioned_users.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {note.mentioned_users.map((userId: string) => (
                              <span key={userId} className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs">
                                @{userId}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {notes.length === 0 && (
                  <div className="text-center py-8 text-dark-400">
                    No notes yet. Add the first note!
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'emails' && (
            <EmailThreadList 
              threads={emailThreads}
              dealId={deal.id}
              contactId={deal.contact_id}
              onThreadCreated={() => loadDealData()}
            />
          )}

          {activeTab === 'files' && (
            <div className="space-y-4">
              {/* Upload File */}
              <div className="border-2 border-dashed border-dark-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Plus className="w-8 h-8 text-dark-400" />
                  <span className="text-dark-400">Click to upload files</span>
                </label>
              </div>

              {/* Files List */}
              <div className="space-y-3">
                {files.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {files.map(file => (
                      <div key={file.id} className="bg-dark-200/50 rounded-lg p-4 flex items-center space-x-3">
                        <div className="w-10 h-10 bg-dark-300 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getFileIcon(file.file_type || '', file.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{file.file_name}</p>
                          <div className="flex items-center text-xs text-dark-400 space-x-2">
                            <span>{file.file_size && `${(file.file_size / 1024 / 1024).toFixed(2)} MB`}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</span>
                            {file.cloud_sync_status && (
                              <>
                                <span>•</span>
                                <span className="flex items-center">
                                  {getCloudSyncIcon(file.cloud_sync_status)}
                                  <span className="ml-1 capitalize">{file.cloud_sync_status.replace('_', ' ')}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Paperclip className="w-12 h-12 text-dark-400 mx-auto mb-3" />
                    <p className="text-dark-400">No files attached to this deal</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cloud' && (
            <CloudStoragePanel 
              dealId={deal.id}
              onFolderCreated={() => loadDealData()}
            />
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              {activities.map(activity => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-white">{activity.description}</p>
                    <p className="text-sm text-dark-400">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className="space-y-6">
              {/* Current Score */}
              <div className="bg-dark-200/50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Current Engagement Score</h3>
                  <DealScoreBadge score={deal.engagement_score || 0} size="lg" />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-dark-400 mb-1">Score Factors</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between">
                        <span className="text-white">Stage Progress</span>
                        <span className="text-dark-400">{deal.stage?.position || 0} of {deal.pipeline?.stages?.length || 5}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white">Activities</span>
                        <span className="text-dark-400">{activities.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white">Notes</span>
                        <span className="text-dark-400">{notes.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white">Files</span>
                        <span className="text-dark-400">{files.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-dark-400 mb-1">Last Activity</p>
                    <p className="text-white">
                      {deal.last_activity_at 
                        ? formatDistanceToNow(new Date(deal.last_activity_at), { addSuffix: true })
                        : 'No recent activity'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Update Score */}
              <div className="bg-dark-200/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Update Engagement Score</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      New Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newEngagementScore}
                      onChange={(e) => setNewEngagementScore(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Reason for Change
                    </label>
                    <input
                      type="text"
                      value={scoreReason}
                      onChange={(e) => setScoreReason(e.target.value)}
                      placeholder="e.g., Recent activity, Stage progress"
                      className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  
                  <button
                    onClick={handleUpdateEngagementScore}
                    className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Update Score
                  </button>
                </div>
              </div>
              
              {/* Score History */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Score History</h3>
                
                <div className="space-y-3">
                  {scoreLogs.length > 0 ? (
                    scoreLogs.map(log => (
                      <div key={log.id} className="bg-dark-200/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-dark-400" />
                            <span className="text-white">
                              Score changed from {log.previous_score} to {log.new_score}
                            </span>
                          </div>
                          <span className={`text-sm font-medium ${getScoreChangeColor(log.previous_score, log.new_score)}`}>
                            {log.new_score > log.previous_score ? '+' : ''}{log.new_score - log.previous_score}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-dark-400">
                            {log.change_reason || 'No reason provided'}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-dark-400 capitalize">{log.change_source}</span>
                            <span className="text-dark-500">
                              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-dark-400">
                      No score history available
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// Helper function to get appropriate icon for file type
const getFileIcon = (fileType: string, category?: string) => {
  if (category === 'contract' || category === 'document' || fileType.includes('document') || fileType.includes('word')) {
    return <FileIcon className="w-5 h-5 text-blue-400" />;
  } else if (category === 'presentation' || fileType.includes('presentation') || fileType.includes('powerpoint')) {
    return <PresentationIcon className="w-5 h-5 text-orange-400" />;
  } else if (category === 'spreadsheet' || fileType.includes('sheet') || fileType.includes('excel')) {
    return <SpreadsheetIcon className="w-5 h-5 text-green-400" />;
  } else if (category === 'pdf' || fileType.includes('pdf')) {
    return <PDFIcon className="w-5 h-5 text-red-400" />;
  } else if (category === 'image' || fileType.includes('image')) {
    return <ImageIcon className="w-5 h-5 text-purple-400" />;
  } else {
    return <Paperclip className="w-5 h-5 text-dark-400" />;
  }
};

// Helper function to get cloud sync status icon
const getCloudSyncIcon = (status: string) => {
  switch (status) {
    case 'synced':
      return <Cloud className="w-3 h-3 text-green-400" />;
    case 'syncing':
      return <Cloud className="w-3 h-3 text-blue-400 animate-pulse" />;
    case 'failed':
      return <Cloud className="w-3 h-3 text-red-400" />;
    default:
      return <Cloud className="w-3 h-3 text-dark-400" />;
  }
};

// Simple file type icons
const FileIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const PresentationIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h20"></path>
    <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"></path>
    <path d="m7 21 5-5 5 5"></path>
  </svg>
);

const SpreadsheetIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="3" y1="15" x2="21" y2="15"></line>
    <line x1="9" y1="3" x2="9" y2="21"></line>
    <line x1="15" y1="3" x2="15" y2="21"></line>
  </svg>
);

const PDFIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <path d="M9 15v-2h6v2"></path>
    <path d="M9 18h6"></path>
    <path d="M9 12h1"></path>
  </svg>
);

const ImageIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);