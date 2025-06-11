import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit, 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Calendar,
  MessageSquare,
  Paperclip,
  Activity,
  Plus,
  Linkedin,
  Twitter,
  Globe,
  MapPin,
  Tag,
  TrendingUp
} from 'lucide-react';
import { Contact, ContactActivity, ContactNote, ContactFile, LeadScoreLog } from '../../types/contacts';
import { ContactsAPI } from '../../lib/contacts-api';
import { Card } from '../common/Card';
import { formatDistanceToNow } from 'date-fns';
import { LeadScoreBadge } from './LeadScoreBadge';

interface ContactDetailModalProps {
  contact: Contact;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
}

export const ContactDetailModal: React.FC<ContactDetailModalProps> = ({ contact, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'files' | 'activity' | 'scoring'>('overview');
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [files, setFiles] = useState<ContactFile[]>([]);
  const [activities, setActivities] = useState<ContactActivity[]>([]);
  const [scoreLogs, setScoreLogs] = useState<LeadScoreLog[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [newLeadScore, setNewLeadScore] = useState(contact.lead_score || 0);
  const [scoreReason, setScoreReason] = useState('');

  useEffect(() => {
    loadContactData();
  }, [contact.id]);

  const loadContactData = async () => {
    try {
      setLoading(true);
      const [notesData, filesData, activitiesData, scoreLogsData] = await Promise.all([
        ContactsAPI.getContactNotes(contact.id),
        ContactsAPI.getContactFiles(contact.id),
        ContactsAPI.getContactActivities(contact.id),
        ContactsAPI.getLeadScoreLogs('contact', contact.id),
      ]);

      setNotes(notesData);
      setFiles(filesData);
      setActivities(activitiesData);
      setScoreLogs(scoreLogsData);
    } catch (error) {
      console.error('Error loading contact data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const note = await ContactsAPI.createContactNote(contact.id, newNote);
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
      const contactFile = await ContactsAPI.uploadContactFile(contact.id, file);
      setFiles(prev => [contactFile, ...prev]);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleUpdateLeadScore = async () => {
    try {
      await ContactsAPI.updateContactLeadScore(contact.id, newLeadScore, scoreReason);
      // Refresh data
      loadContactData();
      // Update contact in parent component
      onEdit({
        ...contact,
        lead_score: newLeadScore
      });
    } catch (error) {
      console.error('Error updating lead score:', error);
    }
  };

  const getStatusColor = (status: Contact['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-400';
      case 'prospect':
        return 'bg-blue-500/20 text-blue-400';
      case 'customer':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getActivityIcon = (type: ContactActivity['activity_type']) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4 text-blue-400" />;
      case 'call':
        return <Phone className="w-4 h-4 text-green-400" />;
      case 'meeting':
        return <Calendar className="w-4 h-4 text-purple-400" />;
      case 'note':
        return <MessageSquare className="w-4 h-4 text-yellow-400" />;
      case 'task':
        return <Activity className="w-4 h-4 text-orange-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
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
    { id: 'files', label: 'Files', icon: Paperclip, count: files.length },
    { id: 'activity', label: 'Activity', icon: Activity, count: activities.length },
    { id: 'scoring', label: 'Lead Score', icon: TrendingUp },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
              {contact.avatar_url ? (
                <img 
                  src={contact.avatar_url} 
                  alt={`${contact.first_name} ${contact.last_name}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold text-white">
                  {contact.first_name} {contact.last_name}
                </h2>
                <LeadScoreBadge score={contact.lead_score || 0} />
              </div>
              <p className="text-dark-400">{contact.title}</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(contact.status)}`}>
                {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(contact)}
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
        <div className="flex border-b border-dark-200">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
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
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Contact Information</h3>
                  
                  {contact.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-dark-400" />
                      <div>
                        <p className="text-white">{contact.email}</p>
                        <p className="text-sm text-dark-400">Email</p>
                      </div>
                    </div>
                  )}

                  {contact.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-dark-400" />
                      <div>
                        <p className="text-white">
                          {contact.country_code} {contact.phone}
                        </p>
                        <p className="text-sm text-dark-400">Phone</p>
                      </div>
                    </div>
                  )}

                  {contact.company && (
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-5 h-5 text-dark-400" />
                      <div>
                        <p className="text-white">{contact.company.name}</p>
                        <p className="text-sm text-dark-400">Company</p>
                      </div>
                    </div>
                  )}

                  {contact.owner && (
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-dark-400" />
                      <div>
                        <p className="text-white">
                          {contact.owner.raw_user_meta_data?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-dark-400">Owner</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Additional Details</h3>
                  
                  {contact.lead_source && (
                    <div>
                      <p className="text-sm text-dark-400">Lead Source</p>
                      <p className="text-white capitalize">
                        {contact.lead_source.replace('_', ' ')}
                      </p>
                    </div>
                  )}

                  {contact.last_contacted_at && (
                    <div>
                      <p className="text-sm text-dark-400">Last Contacted</p>
                      <p className="text-white">
                        {formatDistanceToNow(new Date(contact.last_contacted_at), { addSuffix: true })}
                      </p>
                    </div>
                  )}

                  {contact.last_interaction_at && (
                    <div>
                      <p className="text-sm text-dark-400">Last Interaction</p>
                      <p className="text-white">
                        {formatDistanceToNow(new Date(contact.last_interaction_at), { addSuffix: true })}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-dark-400">Created</p>
                    <p className="text-white">
                      {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Profiles */}
              {(contact.linkedin_url || contact.twitter_url) && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Social Profiles</h3>
                  <div className="flex space-x-4">
                    {contact.linkedin_url && (
                      <a
                        href={contact.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        <Linkedin className="w-4 h-4" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {contact.twitter_url && (
                      <a
                        href={contact.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 bg-blue-400/20 text-blue-300 px-3 py-2 rounded-lg hover:bg-blue-400/30 transition-colors"
                      >
                        <Twitter className="w-4 h-4" />
                        <span>Twitter</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {contact.tags && contact.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map(tag => (
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

              {/* Notes */}
              {contact.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
                  <div className="bg-dark-200/50 rounded-lg p-4">
                    <p className="text-dark-300">{contact.notes}</p>
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
                  placeholder="Add a note..."
                  rows={3}
                  className="w-full bg-transparent border-none text-white placeholder-dark-400 focus:outline-none resize-none"
                />
                <div className="flex justify-end mt-2">
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
                            {note.created_by_user?.raw_user_meta_data?.full_name || 'User'}
                          </span>
                          <span className="text-xs text-dark-400">
                            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-dark-300">{note.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                {files.map(file => (
                  <div key={file.id} className="bg-dark-200/50 rounded-lg p-4 flex items-center space-x-3">
                    <Paperclip className="w-5 h-5 text-dark-400" />
                    <div className="flex-1">
                      <p className="font-medium text-white">{file.file_name}</p>
                      <p className="text-sm text-dark-400">
                        {file.file_size && `${(file.file_size / 1024 / 1024).toFixed(2)} MB`} • 
                        {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              {activities.map(activity => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-white">{activity.title}</span>
                      <span className="text-xs text-dark-400">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-dark-400">{activity.description}</p>
                    )}
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
                  <h3 className="text-lg font-semibold text-white">Current Lead Score</h3>
                  <LeadScoreBadge score={contact.lead_score || 0} size="lg" />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-dark-400 mb-1">Engagement Metrics</p>
                    <div className="grid grid-cols-2 gap-4">
                      {contact.engagement_metrics && Object.entries(contact.engagement_metrics)
                        .filter(([key]) => key !== 'manual_adjustment')
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-white capitalize">{key.replace('_', ' ')}</span>
                            <span className="text-dark-400">{value}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-dark-400 mb-1">Last Interaction</p>
                    <p className="text-white">
                      {contact.last_interaction_at 
                        ? formatDistanceToNow(new Date(contact.last_interaction_at), { addSuffix: true })
                        : 'No recent interaction'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Update Score */}
              <div className="bg-dark-200/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Update Lead Score</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      New Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newLeadScore}
                      onChange={(e) => setNewLeadScore(parseInt(e.target.value) || 0)}
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
                      placeholder="e.g., Recent engagement, Qualification update"
                      className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  
                  <button
                    onClick={handleUpdateLeadScore}
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