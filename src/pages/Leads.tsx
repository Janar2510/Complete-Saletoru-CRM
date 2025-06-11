import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  TrendingUp, 
  User, 
  Building2, 
  Mail, 
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  Download,
  RefreshCw,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { LeadScoreBadge } from '../components/contacts/LeadScoreBadge';
import { ContactsAPI } from '../lib/contacts-api';
import { Contact, ContactFilters } from '../types/contacts';
import { formatDistanceToNow } from 'date-fns';
import { LeadDetailModal } from '../components/leads/LeadDetailModal';
import { LeadAnalyticsPanel } from '../components/leads/LeadAnalyticsPanel';
import { LeadConversionModal } from '../components/leads/LeadConversionModal';
import { useFeatureLock } from '../hooks/useFeatureLock';
import { usePlan } from '../contexts/PlanContext';

const Leads: React.FC = () => {
  const navigate = useNavigate();
  const { currentPlan } = usePlan();
  const { withFeatureAccess, FeatureLockModal } = useFeatureLock(currentPlan);
  
  const [leads, setLeads] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ContactFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Contact | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Lead score range filter
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  
  useEffect(() => {
    loadLeads();
  }, [filters, sortOrder]);
  
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);
  
  const loadLeads = async () => {
    try {
      setLoading(true);
      
      // Create filters with lead score range
      const leadsFilters: ContactFilters = {
        ...filters,
        lead_score_min: scoreRange[0],
        lead_score_max: scoreRange[1]
      };
      
      const data = await ContactsAPI.getContacts(leadsFilters);
      
      // Sort by lead score
      const sortedData = [...data].sort((a, b) => {
        const scoreA = a.lead_score || 0;
        const scoreB = b.lead_score || 0;
        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      });
      
      setLeads(sortedData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewLead = (lead: Contact) => {
    setSelectedLead(lead);
    setShowDetailModal(true);
  };
  
  const handleConvertLead = (lead: Contact) => {
    setSelectedLead(lead);
    setShowConversionModal(true);
  };
  
  const handleCreateLead = () => {
    navigate('/contacts', { state: { createNew: true } });
  };
  
  const handleRefresh = () => {
    loadLeads();
  };
  
  const handleExport = () => {
    // Create CSV content
    let csvContent = 'ID,Name,Email,Company,Lead Score,Last Interaction,Status\n';
    csvContent += leads.map(lead => {
      return `"${lead.id}","${lead.first_name} ${lead.last_name}","${lead.email || ''}","${lead.company?.name || ''}",${lead.lead_score || 0},"${lead.last_interaction_at || ''}","${lead.status}"`;
    }).join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleToggleAnalytics = () => {
    withFeatureAccess('custom_analytics', () => {
      setShowAnalytics(!showAnalytics);
    });
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
  
  const getLeadSummary = () => {
    const total = leads.length;
    const hot = leads.filter(lead => (lead.lead_score || 0) >= 70).length;
    const warm = leads.filter(lead => (lead.lead_score || 0) >= 40 && (lead.lead_score || 0) < 70).length;
    const cold = leads.filter(lead => (lead.lead_score || 0) < 40).length;
    
    return { total, hot, warm, cold };
  };
  
  const summary = getLeadSummary();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Lead Management</h1>
          <p className="text-dark-400">Prioritize and manage your sales leads</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleAnalytics}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showAnalytics 
                ? 'bg-accent text-white' 
                : 'bg-dark-200 text-dark-400 hover:text-white hover:bg-dark-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="ml-2">Analytics</span>
          </button>
          
          <button
            onClick={handleCreateLead}
            className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Analytics Panel (conditionally shown) */}
      {showAnalytics && (
        <LeadAnalyticsPanel 
          leads={leads}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Lead Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Total Leads</p>
              <p className="text-2xl font-bold text-white">{summary.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Hot Leads (70+)</p>
              <p className="text-2xl font-bold text-white">{summary.hot}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Warm Leads (40-69)</p>
              <p className="text-2xl font-bold text-white">{summary.warm}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Cold Leads (0-39)</p>
              <p className="text-2xl font-bold text-white">{summary.cold}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search leads..."
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
          
          <div className="flex items-center space-x-2">
            <span className="text-dark-400 text-sm">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="desc">Highest Score First</option>
              <option value="asc">Lowest Score First</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-dark-200 transition-colors text-dark-400 hover:text-white"
              disabled={loading}
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={handleExport}
              className="p-2 rounded-lg hover:bg-dark-200 transition-colors text-dark-400 hover:text-white"
              title="Export to CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-dark-200/50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Lead Score Range
              </label>
              <div className="px-3">
                <div className="flex justify-between text-xs text-dark-400 mb-1">
                  <span>{scoreRange[0]}</span>
                  <span>{scoreRange[1]}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scoreRange[0]}
                  onChange={(e) => setScoreRange([parseInt(e.target.value), scoreRange[1]])}
                  className="w-full h-2 bg-dark-300 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scoreRange[1]}
                  onChange={(e) => setScoreRange([scoreRange[0], parseInt(e.target.value)])}
                  className="w-full h-2 bg-dark-300 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as Contact['status'] || undefined }))}
                className="w-full bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="prospect">Prospect</option>
                <option value="customer">Customer</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Last Interaction
              </label>
              <select
                value={filters.last_interaction_range ? 'custom' : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    const newFilters = { ...filters };
                    delete newFilters.last_interaction_range;
                    setFilters(newFilters);
                    return;
                  }
                  
                  const now = new Date();
                  let start = new Date();
                  
                  switch (value) {
                    case '7days':
                      start.setDate(now.getDate() - 7);
                      break;
                    case '30days':
                      start.setDate(now.getDate() - 30);
                      break;
                    case '90days':
                      start.setDate(now.getDate() - 90);
                      break;
                  }
                  
                  if (value !== 'custom') {
                    setFilters(prev => ({
                      ...prev,
                      last_interaction_range: {
                        start: start.toISOString(),
                        end: now.toISOString()
                      }
                    }));
                  }
                }}
                className="w-full bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Any Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>
        )}
        
        {lastUpdated && (
          <div className="text-xs text-dark-400 mt-2 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </Card>

      {/* Leads Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-200/50">
              <tr>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Lead</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Company</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Email</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Lead Score</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Last Interaction</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Status</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2 text-dark-400">Loading leads...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-dark-400">
                    No leads found matching your criteria
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-dark-200/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {lead.first_name.charAt(0)}{lead.last_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <button
                            onClick={() => handleViewLead(lead)}
                            className="font-medium text-white hover:text-accent transition-colors"
                          >
                            {lead.first_name} {lead.last_name}
                          </button>
                          {lead.title && (
                            <p className="text-sm text-dark-400">{lead.title}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <span className="text-white">
                        {lead.company?.name || 'No company'}
                      </span>
                    </td>
                    
                    <td className="p-4">
                      {lead.email ? (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-dark-400" />
                          <span className="text-white">{lead.email}</span>
                        </div>
                      ) : (
                        <span className="text-dark-400">No email</span>
                      )}
                    </td>
                    
                    <td className="p-4">
                      <LeadScoreBadge score={lead.lead_score || 0} />
                    </td>
                    
                    <td className="p-4">
                      {lead.last_interaction_at ? (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-dark-400" />
                          <span className="text-white">
                            {formatDistanceToNow(new Date(lead.last_interaction_at), { addSuffix: true })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-dark-400">Never</span>
                      )}
                    </td>
                    
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </span>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewLead(lead)}
                          className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 p-1.5 rounded transition-colors"
                          title="View Lead Details"
                        >
                          <User className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleConvertLead(lead)}
                          className="bg-green-500/20 text-green-400 hover:bg-green-500/30 p-1.5 rounded transition-colors"
                          title="Convert to Deal"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Lead Detail Modal */}
      {showDetailModal && selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLead(null);
          }}
          onConvert={() => {
            setShowDetailModal(false);
            handleConvertLead(selectedLead);
          }}
          onLeadUpdated={(updatedLead) => {
            // Update lead in the list
            setLeads(prev => prev.map(lead => 
              lead.id === updatedLead.id ? updatedLead : lead
            ));
          }}
        />
      )}

      {/* Lead Conversion Modal */}
      {showConversionModal && selectedLead && (
        <LeadConversionModal
          lead={selectedLead}
          onClose={() => {
            setShowConversionModal(false);
            setSelectedLead(null);
          }}
          onConversionComplete={() => {
            setShowConversionModal(false);
            setSelectedLead(null);
            // Optionally navigate to the deals page
            // navigate('/deals');
          }}
        />
      )}

      {/* Feature Lock Modal */}
      <FeatureLockModal />
    </div>
  );
};

export default Leads;