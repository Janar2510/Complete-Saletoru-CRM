import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  Calendar,
  CheckSquare,
  Square,
  Download,
  UserPlus,
  Trash2,
  Edit,
  Eye,
  TrendingUp
} from 'lucide-react';
import { Contact, ContactFilters, BulkAction } from '../../types/contacts';
import { ContactsAPI } from '../../lib/contacts-api';
import { Card } from '../common/Card';
import { formatDistanceToNow } from 'date-fns';
import { LeadScoreBadge } from './LeadScoreBadge';

interface ContactsTableProps {
  onCreateContact: () => void;
  onEditContact: (contact: Contact) => void;
  onViewContact: (contact: Contact) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({
  onCreateContact,
  onEditContact,
  onViewContact,
  onSelectionChange
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ContactFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'created_at' | 'last_contacted' | 'lead_score'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadContacts();
  }, [filters, sortBy, sortOrder]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);
  
  useEffect(() => {
    // Notify parent component when selection changes
    if (onSelectionChange) {
      onSelectionChange(Array.from(selectedContacts));
    }
  }, [selectedContacts, onSelectionChange]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await ContactsAPI.getContacts(filters);
      
      // Sort contacts
      const sortedData = [...data].sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'name':
            aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
            bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
            break;
          case 'company':
            aValue = a.company?.name?.toLowerCase() || '';
            bValue = b.company?.name?.toLowerCase() || '';
            break;
          case 'last_contacted':
            aValue = a.last_contacted_at || '1970-01-01';
            bValue = b.last_contacted_at || '1970-01-01';
            break;
          case 'lead_score':
            aValue = a.lead_score || 0;
            bValue = b.lead_score || 0;
            break;
          default:
            aValue = a.created_at;
            bValue = b.created_at;
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      setContacts(sortedData);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
    }
  };

  const handleBulkAction = async (action: BulkAction['action'], data?: any) => {
    if (selectedContacts.size === 0) return;

    try {
      await ContactsAPI.performBulkAction({
        action,
        entity_ids: Array.from(selectedContacts),
        data,
      });
      
      setSelectedContacts(new Set());
      loadContacts();
    } catch (error) {
      console.error('Error performing bulk action:', error);
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

  const formatPhoneNumber = (phone?: string, countryCode?: string) => {
    if (!phone) return '';
    return `${countryCode || '+1'} ${phone}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent w-full"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters 
                ? 'bg-accent border-accent text-white' 
                : 'bg-dark-200 border-dark-300 hover:bg-dark-300 text-dark-400'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-dark-200/50 rounded-lg">
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as Contact['status'] || undefined }))}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
              <option value="customer">Customer</option>
            </select>

            <select
              value={filters.lead_source || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, lead_source: e.target.value || undefined }))}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Sources</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="social_media">Social Media</option>
              <option value="cold_outreach">Cold Outreach</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="created_at">Created Date</option>
              <option value="name">Name</option>
              <option value="company">Company</option>
              <option value="last_contacted">Last Contacted</option>
              <option value="lead_score">Lead Score</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        )}
      </Card>

      {/* Contacts Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-200/50">
              <tr>
                <th className="p-4 text-left">
                  <button onClick={handleSelectAll}>
                    {selectedContacts.size === contacts.length ? (
                      <CheckSquare className="w-4 h-4 text-accent" />
                    ) : (
                      <Square className="w-4 h-4 text-dark-400" />
                    )}
                  </button>
                </th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Contact</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Company</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Contact Info</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Owner</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Status</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Lead Score</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Last Contact</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-dark-200/30 transition-colors">
                  <td className="p-4">
                    <button onClick={() => handleSelectContact(contact.id)}>
                      {selectedContacts.has(contact.id) ? (
                        <CheckSquare className="w-4 h-4 text-accent" />
                      ) : (
                        <Square className="w-4 h-4 text-dark-400" />
                      )}
                    </button>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                        {contact.avatar_url ? (
                          <img 
                            src={contact.avatar_url} 
                            alt={`${contact.first_name} ${contact.last_name}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-sm text-dark-400">{contact.title}</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    {contact.company ? (
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-dark-400" />
                        <span className="text-white">{contact.company.name}</span>
                      </div>
                    ) : (
                      <span className="text-dark-400">No company</span>
                    )}
                  </td>
                  
                  <td className="p-4">
                    <div className="space-y-1">
                      {contact.email && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="w-3 h-3 text-dark-400" />
                          <span className="text-dark-300">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="w-3 h-3 text-dark-400" />
                          <span className="text-dark-300">
                            {formatPhoneNumber(contact.phone, contact.country_code)}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    {contact.owner_id ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            U
                          </span>
                        </div>
                        <span className="text-sm text-white">
                          Assigned
                        </span>
                      </div>
                    ) : (
                      <span className="text-dark-400">Unassigned</span>
                    )}
                  </td>
                  
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                      {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                    </span>
                  </td>
                  
                  <td className="p-4">
                    <LeadScoreBadge score={contact.lead_score || 0} />
                  </td>
                  
                  <td className="p-4">
                    {contact.last_contacted_at ? (
                      <div className="flex items-center space-x-2 text-sm text-dark-400">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDistanceToNow(new Date(contact.last_contacted_at), { addSuffix: true })}</span>
                      </div>
                    ) : (
                      <span className="text-dark-400">Never</span>
                    )}
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onViewContact(contact)}
                        className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onEditContact(contact)}
                        className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button className="p-1.5 bg-dark-200 text-dark-400 rounded hover:bg-dark-300 transition-colors">
                        <MoreHorizontal className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {contacts.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-dark-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No contacts found</h3>
            <p className="text-dark-400 mb-4">Get started by adding your first contact</p>
            <button
              onClick={onCreateContact}
              className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Add Contact
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};