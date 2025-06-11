import React, { useState } from 'react';
import { Mail, Plus, Search, Filter, ExternalLink, Eye, Link, Clock } from 'lucide-react';
import { EmailThread } from '../../types/deals';
import { DealsAPI } from '../../lib/deals-api';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '../common/Card';

interface EmailThreadListProps {
  threads: EmailThread[];
  dealId: string;
  contactId?: string;
  onThreadCreated: () => void;
}

export const EmailThreadList: React.FC<EmailThreadListProps> = ({ 
  threads, 
  dealId, 
  contactId,
  onThreadCreated 
}) => {
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateThread = async () => {
    if (!subject.trim()) return;
    
    try {
      setLoading(true);
      await DealsAPI.createEmailThread(subject, dealId, contactId);
      setShowNewThreadModal(false);
      setSubject('');
      onThreadCreated();
    } catch (error) {
      console.error('Error creating thread:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredThreads = threads.filter(thread => 
    thread.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Email Conversations</h3>
        <button
          onClick={() => setShowNewThreadModal(true)}
          className="bg-accent hover:bg-accent/80 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Thread</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
        <input
          type="text"
          placeholder="Search email threads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Threads List */}
      <div className="space-y-3">
        {filteredThreads.length > 0 ? (
          filteredThreads.map(thread => (
            <Card key={thread.id} className="p-4 hover:shadow-md transition-all" hover>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{thread.subject}</h4>
                    <div className="flex items-center space-x-2 text-xs text-dark-400 mt-1">
                      <span>{thread.message_count} messages</span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {thread.last_message_at 
                          ? formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })
                          : 'No messages yet'
                        }
                      </span>
                    </div>
                    
                    {/* Participants */}
                    {thread.participants && thread.participants.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {thread.participants.map((participant, index) => (
                          <span key={index} className="bg-dark-300/50 text-dark-400 px-2 py-0.5 rounded text-xs">
                            {participant.name || participant.email}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors">
                    <Eye className="w-3 h-3" />
                  </button>
                  <button className="p-1.5 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors">
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              {/* Preview of latest message if available */}
              {thread.messages && thread.messages.length > 0 && (
                <div className="mt-3 pt-3 border-t border-dark-200">
                  <div className="text-xs text-dark-400 mb-1">
                    {thread.messages[0].from_name || thread.messages[0].from_email}:
                  </div>
                  <p className="text-sm text-dark-300 line-clamp-2">
                    {thread.messages[0].body_text || 'No text content available'}
                  </p>
                </div>
              )}
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 text-dark-400 mx-auto mb-3" />
            <p className="text-dark-400 mb-4">No email threads found</p>
            <button
              onClick={() => setShowNewThreadModal(true)}
              className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Email Thread
            </button>
          </div>
        )}
      </div>

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Email Thread</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Enter email subject"
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowNewThreadModal(false)}
                  className="px-4 py-2 text-dark-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateThread}
                  disabled={!subject.trim() || loading}
                  className="bg-accent hover:bg-accent/80 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Thread'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};