import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Send, 
  Download,
  MoreHorizontal,
  Calendar,
  User,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  FileText
} from 'lucide-react';
import { Offer, OfferFilters } from '../../types/offers';
import { OffersAPI } from '../../lib/offers-api';
import { Card } from '../common/Card';
import { formatDistanceToNow } from 'date-fns';

interface OffersTableProps {
  onCreateOffer: () => void;
  onEditOffer: (offer: Offer) => void;
  onViewOffer: (offer: Offer) => void;
}

export const OffersTable: React.FC<OffersTableProps> = ({
  onCreateOffer,
  onEditOffer,
  onViewOffer,
}) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OfferFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadOffers();
  }, [filters]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      
      // Simplified query to avoid RLS issues
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, company:companies(name)),
          deal:deals(id, title, value, stage:pipeline_stages(name))
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Apply filters manually
      let filteredData = data || [];
      
      if (filters.status) {
        filteredData = filteredData.filter(offer => offer.status === filters.status);
      }
      
      if (filters.contact_id) {
        filteredData = filteredData.filter(offer => offer.contact_id === filters.contact_id);
      }
      
      if (filters.deal_id) {
        filteredData = filteredData.filter(offer => offer.deal_id === filters.deal_id);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(offer => 
          offer.title.toLowerCase().includes(searchLower) ||
          offer.description?.toLowerCase().includes(searchLower) ||
          offer.contact?.first_name.toLowerCase().includes(searchLower) ||
          offer.contact?.last_name.toLowerCase().includes(searchLower) ||
          offer.deal?.title?.toLowerCase().includes(searchLower)
        );
      }
      
      setOffers(filteredData);
    } catch (error) {
      console.error('Error loading offers:', error);
      
      // Mock data for development
      setOffers([
        {
          id: '1',
          offer_id: 'OFFER-20250101-0001',
          title: 'Enterprise Software Package',
          description: 'Annual license for enterprise software',
          contact_id: '1',
          deal_id: '1',
          status: 'sent',
          sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          viewed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          tracking_id: 'track-123',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'user-1',
          contact: {
            id: '1',
            first_name: 'John',
            last_name: 'Smith',
            email: 'john@example.com',
            company: {
              name: 'Acme Corp'
            }
          },
          deal: {
            id: '1',
            title: 'Enterprise Software Package',
            value: 75000,
            stage: {
              name: 'Proposal'
            }
          }
        },
        {
          id: '2',
          offer_id: 'OFFER-20250102-0001',
          title: 'Cloud Infrastructure Proposal',
          description: 'Proposal for cloud migration services',
          contact_id: '2',
          deal_id: '2',
          status: 'draft',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'user-1',
          contact: {
            id: '2',
            first_name: 'Sarah',
            last_name: 'Johnson',
            email: 'sarah@example.com',
            company: {
              name: 'TechCorp'
            }
          },
          deal: {
            id: '2',
            title: 'Cloud Infrastructure',
            value: 45000,
            stage: {
              name: 'Qualified'
            }
          }
        },
        {
          id: '3',
          offer_id: 'OFFER-20250103-0001',
          title: 'Support Plan Renewal',
          description: 'Annual support plan renewal',
          contact_id: '3',
          status: 'accepted',
          sent_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          viewed_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          responded_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          tracking_id: 'track-456',
          created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'user-1',
          contact: {
            id: '3',
            first_name: 'Michael',
            last_name: 'Brown',
            email: 'michael@example.com',
            company: {
              name: 'Global Industries'
            }
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOffer = async (offer: Offer) => {
    if (offer.status !== 'draft') return;
    
    try {
      await OffersAPI.sendOffer(offer.id);
      loadOffers();
    } catch (error) {
      console.error('Error sending offer:', error);
    }
  };

  const getStatusColor = (status: Offer['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500/20 text-gray-400';
      case 'sent':
        return 'bg-blue-500/20 text-blue-400';
      case 'viewed':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'accepted':
        return 'bg-green-500/20 text-green-400';
      case 'declined':
        return 'bg-red-500/20 text-red-400';
      case 'expired':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: Offer['status']) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-3 h-3" />;
      case 'sent':
        return <Send className="w-3 h-3" />;
      case 'viewed':
        return <Eye className="w-3 h-3" />;
      case 'accepted':
        return <CheckCircle className="w-3 h-3" />;
      case 'declined':
        return <XCircle className="w-3 h-3" />;
      case 'expired':
        return <Clock className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Offers</h1>
          <p className="text-dark-400">{offers.length} offers found</p>
        </div>
        
        <button
          onClick={onCreateOffer}
          className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Offer</span>
        </button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search offers..."
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-dark-200/50 rounded-lg">
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as Offer['status'] || undefined }))}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="expired">Expired</option>
            </select>

            <input
              type="date"
              placeholder="From Date"
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                date_range: { 
                  start: e.target.value, 
                  end: prev.date_range?.end || '' 
                } 
              }))}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            />

            <input
              type="date"
              placeholder="To Date"
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                date_range: { 
                  start: prev.date_range?.start || '', 
                  end: e.target.value 
                } 
              }))}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        )}
      </Card>

      {/* Offers Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-200/50">
              <tr>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Offer ID</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Title</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Contact</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Send Date</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Status</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200">
              {offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-dark-200/30 transition-colors">
                  <td className="p-4">
                    <span className="font-mono text-sm text-accent">{offer.offer_id}</span>
                  </td>
                  
                  <td className="p-4">
                    <button
                      onClick={() => onViewOffer(offer)}
                      className="font-medium text-white hover:text-accent transition-colors text-left"
                    >
                      {offer.title}
                    </button>
                  </td>
                  
                  <td className="p-4">
                    {offer.contact ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {offer.contact.first_name} {offer.contact.last_name}
                          </p>
                          {offer.contact.company && (
                            <p className="text-sm text-dark-400 flex items-center">
                              <Building2 className="w-3 h-3 mr-1" />
                              {offer.contact.company.name}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-dark-400">No contact</span>
                    )}
                  </td>
                  
                  <td className="p-4">
                    {offer.sent_at ? (
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-dark-400" />
                        <span className="text-white">
                          {formatDistanceToNow(new Date(offer.sent_at), { addSuffix: true })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-dark-400">Not sent</span>
                    )}
                  </td>
                  
                  <td className="p-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                      {getStatusIcon(offer.status)}
                      <span>{offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}</span>
                    </span>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onViewOffer(offer)}
                        className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                        title="View Offer"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={() => onEditOffer(offer)}
                        className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
                        title="Edit Offer"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      
                      {offer.status === 'draft' && (
                        <button
                          onClick={() => handleSendOffer(offer)}
                          className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                          title="Send Offer"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      )}
                      
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
        
        {offers.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-dark-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No offers found</h3>
            <p className="text-dark-400 mb-4">Get started by creating your first offer</p>
            <button
              onClick={onCreateOffer}
              className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Offer
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};