import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Search, 
  Filter, 
  Plus, 
  Inbox, 
  Send as SendIcon, 
  Archive, 
  Trash2, 
  Star, 
  Clock, 
  User, 
  Paperclip, 
  X, 
  ChevronDown,
  Save
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface EmailMessage {
  id: string;
  thread_id: string;
  message_id: string;
  from_email: string;
  from_name?: string;
  to_emails: string[];
  cc_emails?: string[];
  bcc_emails?: string[];
  subject: string;
  body_text?: string;
  body_html?: string;
  sent_at: string;
  received_at?: string;
  is_outbound: boolean;
  has_attachments: boolean;
  attachment_count?: number;
  read_status: boolean;
  importance: 'low' | 'normal' | 'high';
}

interface EmailThread {
  id: string;
  subject: string;
  participants: any[];
  last_message_at?: string;
  message_count: number;
  status: 'active' | 'archived' | 'spam';
  labels?: string[];
  messages?: EmailMessage[];
  contact?: {
    first_name: string;
    last_name: string;
  };
  deal?: {
    title: string;
  };
}

interface ComposeEmailModalProps {
  onClose: () => void;
  onSend: (emailData: any) => void;
  replyToThread?: EmailThread;
}

const ComposeEmailModal: React.FC<ComposeEmailModalProps> = ({ onClose, onSend, replyToThread }) => {
  const [formData, setFormData] = useState({
    to: replyToThread ? replyToThread.participants.map(p => p.email).join(', ') : '',
    cc: '',
    bcc: '',
    subject: replyToThread ? `Re: ${replyToThread.subject}` : '',
    body: replyToThread ? '\n\n-------- Original Message --------\n' : '',
    attachments: [] as File[]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        attachments: [...formData.attachments, ...Array.from(e.target.files)]
      });
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = [...formData.attachments];
    newAttachments.splice(index, 1);
    setFormData({
      ...formData,
      attachments: newAttachments
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-dark-200">
          <h2 className="text-xl font-semibold text-white">
            {replyToThread ? 'Reply to Email' : 'Compose Email'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                To
              </label>
              <input
                type="text"
                name="to"
                value={formData.to}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="recipient@example.com"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  CC
                </label>
                <input
                  type="text"
                  name="cc"
                  value={formData.cc}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="cc@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  BCC
                </label>
                <input
                  type="text"
                  name="bcc"
                  value={formData.bcc}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="bcc@example.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Email subject"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Message
              </label>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleChange}
                rows={12}
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                placeholder="Write your message here..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Attachments
              </label>
              <div className="space-y-2">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-dark-200 rounded-lg">
                    <div className="flex items-center">
                      <Paperclip className="w-4 h-4 text-dark-400 mr-2" />
                      <span className="text-white">{file.name}</span>
                      <span className="text-dark-400 text-sm ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="text-dark-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <div className="flex items-center">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer bg-dark-200 hover:bg-dark-300 text-dark-400 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center"
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attach Files
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 p-6 border-t border-dark-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-accent hover:bg-accent/80 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <SendIcon className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const Emails: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'archived' | 'trash'>('inbox');
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showComposeModal, setShowComposeModal] = useState(false);

  useEffect(() => {
    loadEmails();
  }, [activeFolder]);

  const loadEmails = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('email_threads')
        .select(`
          *,
          contact:contacts(first_name, last_name),
          deal:deals(title)
        `);
      
      // Apply folder filter
      switch (activeFolder) {
        case 'inbox':
          query = query.eq('status', 'active');
          break;
        case 'archived':
          query = query.eq('status', 'archived');
          break;
        case 'trash':
          query = query.eq('status', 'spam');
          break;
      }
      
      const { data, error } = await query.order('last_message_at', { ascending: false });
      
      if (error) throw error;
      
      // For each thread, get the latest message
      const threadsWithMessages = await Promise.all((data || []).map(async (thread) => {
        const { data: messages, error: messagesError } = await supabase
          .from('email_messages')
          .select('*')
          .eq('thread_id', thread.id)
          .order('sent_at', { ascending: false })
          .limit(1);
        
        if (messagesError) throw messagesError;
        
        return {
          ...thread,
          messages: messages || []
        };
      }));
      
      setThreads(threadsWithMessages);
    } catch (error) {
      console.error('Error loading emails:', error);
      
      // Mock data for development
      setThreads([
        {
          id: '1',
          subject: 'Project Proposal',
          participants: [
            { name: 'John Smith', email: 'john@example.com' },
            { name: 'Your Name', email: 'you@example.com' }
          ],
          last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          message_count: 3,
          status: 'active',
          contact: {
            first_name: 'John',
            last_name: 'Smith'
          },
          messages: [
            {
              id: '101',
              thread_id: '1',
              message_id: 'msg-101',
              from_email: 'john@example.com',
              from_name: 'John Smith',
              to_emails: ['you@example.com'],
              subject: 'Project Proposal',
              body_text: 'Here is the project proposal we discussed. Let me know your thoughts.',
              sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              is_outbound: false,
              has_attachments: true,
              attachment_count: 1,
              read_status: true,
              importance: 'high'
            }
          ]
        },
        {
          id: '2',
          subject: 'Meeting Follow-up',
          participants: [
            { name: 'Sarah Johnson', email: 'sarah@example.com' },
            { name: 'Your Name', email: 'you@example.com' }
          ],
          last_message_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          message_count: 5,
          status: 'active',
          deal: {
            title: 'Enterprise Software Package'
          },
          messages: [
            {
              id: '201',
              thread_id: '2',
              message_id: 'msg-201',
              from_email: 'you@example.com',
              from_name: 'Your Name',
              to_emails: ['sarah@example.com'],
              subject: 'Meeting Follow-up',
              body_text: 'Thank you for the meeting today. I\'ve attached the notes and next steps.',
              sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              is_outbound: true,
              has_attachments: true,
              attachment_count: 1,
              read_status: true,
              importance: 'normal'
            }
          ]
        },
        {
          id: '3',
          subject: 'Product Demo Request',
          participants: [
            { name: 'Michael Brown', email: 'michael@example.com' },
            { name: 'Your Name', email: 'you@example.com' }
          ],
          last_message_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          message_count: 2,
          status: 'active',
          contact: {
            first_name: 'Michael',
            last_name: 'Brown'
          },
          messages: [
            {
              id: '301',
              thread_id: '3',
              message_id: 'msg-301',
              from_email: 'michael@example.com',
              from_name: 'Michael Brown',
              to_emails: ['you@example.com'],
              subject: 'Product Demo Request',
              body_text: 'I would like to schedule a demo of your product. What times are you available next week?',
              sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              is_outbound: false,
              has_attachments: false,
              attachment_count: 0,
              read_status: false,
              importance: 'normal'
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewThread = async (thread: EmailThread) => {
    try {
      // Get all messages in the thread
      const { data, error } = await supabase
        .from('email_messages')
        .select('*')
        .eq('thread_id', thread.id)
        .order('sent_at', { ascending: true });
      
      if (error) throw error;
      
      setSelectedThread({
        ...thread,
        messages: data || []
      });
      
      // Mark thread messages as read
      if (data && data.some(msg => !msg.read_status)) {
        await supabase
          .from('email_messages')
          .update({ read_status: true })
          .eq('thread_id', thread.id)
          .eq('read_status', false);
      }
    } catch (error) {
      console.error('Error loading thread messages:', error);
      
      // For development, just use the thread with mock messages
      setSelectedThread(thread);
    }
  };

  const handleComposeEmail = () => {
    setShowComposeModal(true);
  };

  const handleReplyToThread = () => {
    if (!selectedThread) return;
    setShowComposeModal(true);
  };

  const handleSendEmail = async (emailData: any) => {
    try {
      // For a real implementation, this would send the email via an API
      console.log('Sending email:', emailData);
      
      // Create a new thread or add to existing thread
      let threadId = selectedThread?.id;
      
      if (!threadId) {
        // Create new thread
        const { data: threadData, error: threadError } = await supabase
          .from('email_threads')
          .insert([{
            subject: emailData.subject,
            participants: [
              { name: 'Your Name', email: 'you@example.com' },
              ...emailData.to.split(',').map((email: string) => ({ email: email.trim() }))
            ],
            status: 'active',
            message_count: 1
          }])
          .select();
        
        if (threadError) throw threadError;
        
        threadId = threadData?.[0]?.id;
      } else {
        // Update existing thread
        await supabase
          .from('email_threads')
          .update({
            last_message_at: new Date().toISOString(),
            message_count: supabase.sql`message_count + 1`
          })
          .eq('id', threadId);
      }
      
      // Create message
      if (threadId) {
        const { error: messageError } = await supabase
          .from('email_messages')
          .insert([{
            thread_id: threadId,
            message_id: `msg-${Date.now()}`,
            from_email: 'you@example.com',
            from_name: 'Your Name',
            to_emails: emailData.to.split(',').map((email: string) => email.trim()),
            cc_emails: emailData.cc ? emailData.cc.split(',').map((email: string) => email.trim()) : [],
            bcc_emails: emailData.bcc ? emailData.bcc.split(',').map((email: string) => email.trim()) : [],
            subject: emailData.subject,
            body_text: emailData.body,
            sent_at: new Date().toISOString(),
            is_outbound: true,
            has_attachments: emailData.attachments.length > 0,
            attachment_count: emailData.attachments.length,
            read_status: true,
            importance: 'normal'
          }]);
        
        if (messageError) throw messageError;
      }
      
      // Refresh emails
      loadEmails();
      setShowComposeModal(false);
      setSelectedThread(null);
    } catch (error) {
      console.error('Error sending email:', error);
      
      // For development, just close the modal
      setShowComposeModal(false);
      
      // Refresh with mock data
      loadEmails();
    }
  };

  const filteredThreads = threads.filter(thread => 
    thread.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.participants.some(p => 
      (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Emails</h1>
          <p className="text-dark-400">Manage your email communications</p>
        </div>
        
        <button
          onClick={handleComposeEmail}
          className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Compose Email</span>
        </button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent w-full"
            />
          </div>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-dark-200 border border-dark-300 rounded-lg hover:bg-dark-300 transition-colors">
            <Filter className="w-4 h-4 text-dark-400" />
            <span className="text-dark-400">Filter</span>
          </button>
        </div>
      </Card>

      {/* Email Interface */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Folders and Email List */}
        <div className="md:col-span-1">
          <Card className="overflow-hidden">
            {/* Folders */}
            <div className="p-4 border-b border-dark-200">
              <h3 className="text-lg font-semibold text-white mb-4">Folders</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveFolder('inbox')}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                    activeFolder === 'inbox'
                      ? 'bg-accent text-white'
                      : 'text-dark-400 hover:bg-dark-200 hover:text-white'
                  }`}
                >
                  <div className="flex items-center">
                    <Inbox className="w-4 h-4 mr-3" />
                    <span>Inbox</span>
                  </div>
                  <span className="bg-dark-200 text-dark-400 px-2 py-0.5 rounded-full text-xs">
                    {threads.filter(t => t.status === 'active' && t.messages?.some(m => !m.is_outbound && !m.read_status)).length}
                  </span>
                </button>
                
                <button
                  onClick={() => setActiveFolder('sent')}
                  className={`w-full flex items-center p-2 rounded-lg transition-colors ${
                    activeFolder === 'sent'
                      ? 'bg-accent text-white'
                      : 'text-dark-400 hover:bg-dark-200 hover:text-white'
                  }`}
                >
                  <SendIcon className="w-4 h-4 mr-3" />
                  <span>Sent</span>
                </button>
                
                <button
                  onClick={() => setActiveFolder('archived')}
                  className={`w-full flex items-center p-2 rounded-lg transition-colors ${
                    activeFolder === 'archived'
                      ? 'bg-accent text-white'
                      : 'text-dark-400 hover:bg-dark-200 hover:text-white'
                  }`}
                >
                  <Archive className="w-4 h-4 mr-3" />
                  <span>Archived</span>
                </button>
                
                <button
                  onClick={() => setActiveFolder('trash')}
                  className={`w-full flex items-center p-2 rounded-lg transition-colors ${
                    activeFolder === 'trash'
                      ? 'bg-accent text-white'
                      : 'text-dark-400 hover:bg-dark-200 hover:text-white'
                  }`}
                >
                  <Trash2 className="w-4 h-4 mr-3" />
                  <span>Trash</span>
                </button>
              </div>
            </div>
            
            {/* Email List */}
            <div className="overflow-y-auto max-h-[calc(100vh-400px)]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-dark-400 mx-auto mb-3" />
                  <p className="text-dark-400">No emails found</p>
                </div>
              ) : (
                <div className="divide-y divide-dark-200">
                  {filteredThreads.map(thread => {
                    const latestMessage = thread.messages?.[0];
                    const isUnread = latestMessage && !latestMessage.is_outbound && !latestMessage.read_status;
                    
                    return (
                      <div
                        key={thread.id}
                        onClick={() => handleViewThread(thread)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedThread?.id === thread.id
                            ? 'bg-accent/10'
                            : isUnread
                            ? 'bg-dark-200/70 hover:bg-dark-200'
                            : 'hover:bg-dark-200/50'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${isUnread ? 'bg-accent' : 'bg-transparent'}`} />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`font-medium truncate ${isUnread ? 'text-white' : 'text-dark-300'}`}>
                                {thread.contact 
                                  ? `${thread.contact.first_name} ${thread.contact.last_name}`
                                  : thread.participants.find(p => p.email !== 'you@example.com')?.name || 
                                    thread.participants.find(p => p.email !== 'you@example.com')?.email || 
                                    'No recipient'
                                }
                              </h4>
                              <span className="text-xs text-dark-500 whitespace-nowrap">
                                {thread.last_message_at && formatDistanceToNow(parseISO(thread.last_message_at), { addSuffix: true })}
                              </span>
                            </div>
                            
                            <p className={`text-sm truncate ${isUnread ? 'text-white' : 'text-dark-400'}`}>
                              {thread.subject}
                            </p>
                            
                            <p className="text-xs text-dark-500 truncate mt-1">
                              {latestMessage?.body_text?.substring(0, 100)}
                            </p>
                            
                            <div className="flex items-center mt-2 space-x-2">
                              {latestMessage?.has_attachments && (
                                <Paperclip className="w-3 h-3 text-dark-400" />
                              )}
                              
                              {latestMessage?.importance === 'high' && (
                                <Star className="w-3 h-3 text-yellow-400" />
                              )}
                              
                              {thread.deal && (
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                  {thread.deal.title}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {/* Email Content */}
        <div className="md:col-span-2">
          {selectedThread ? (
            <Card className="overflow-hidden flex flex-col h-full">
              {/* Email Header */}
              <div className="p-6 border-b border-dark-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">{selectedThread.subject}</h3>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleReplyToThread}
                      className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <SendIcon className="w-4 h-4" />
                      <span>Reply</span>
                    </button>
                    
                    <button className="p-2 rounded-lg hover:bg-dark-200 transition-colors">
                      <Archive className="w-4 h-4 text-dark-400" />
                    </button>
                    
                    <button className="p-2 rounded-lg hover:bg-dark-200 transition-colors">
                      <Trash2 className="w-4 h-4 text-dark-400" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center text-dark-400">
                    <User className="w-4 h-4 mr-1" />
                    <span>
                      {selectedThread.participants.map(p => p.name || p.email).join(', ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-dark-400">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>
                      {selectedThread.message_count} messages
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Email Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedThread.messages && selectedThread.messages.length > 0 ? (
                  selectedThread.messages.map(message => (
                    <div 
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.is_outbound
                          ? 'bg-accent/10 ml-8'
                          : 'bg-dark-200/50 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">
                            {message.is_outbound ? 'You' : message.from_name || message.from_email}
                          </span>
                          <span className="text-xs text-dark-500">
                            {formatDistanceToNow(parseISO(message.sent_at), { addSuffix: true })}
                          </span>
                        </div>
                        
                        {message.importance === 'high' && (
                          <Star className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      
                      <div className="text-dark-300 whitespace-pre-wrap">
                        {message.body_text}
                      </div>
                      
                      {message.has_attachments && (
                        <div className="mt-4 pt-4 border-t border-dark-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Paperclip className="w-4 h-4 text-dark-400" />
                            <span className="text-dark-400">Attachments ({message.attachment_count})</span>
                          </div>
                          
                          <div className="bg-dark-200 p-2 rounded-lg inline-block">
                            <span className="text-sm text-dark-400">document.pdf</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Mail className="w-12 h-12 text-dark-400 mx-auto mb-3" />
                    <p className="text-dark-400">No messages in this thread</p>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-full p-12">
              <div className="text-center">
                <Mail className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Email Selected</h3>
                <p className="text-dark-400 mb-6">Select an email from the list to view its contents</p>
                <button
                  onClick={handleComposeEmail}
                  className="bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Compose New Email</span>
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Compose Email Modal */}
      {showComposeModal && (
        <ComposeEmailModal
          onClose={() => setShowComposeModal(false)}
          onSend={handleSendEmail}
          replyToThread={selectedThread}
        />
      )}
    </div>
  );
};

export default Emails;