import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  User, 
  Target, 
  Filter, 
  Search, 
  RefreshCw, 
  Settings,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  Download
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { LeadScoreBadge } from '../components/contacts/LeadScoreBadge';
import { DealScoreBadge } from '../components/deals/DealScoreBadge';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

const LeadScoring: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'deals' | 'settings'>('contacts');
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  useEffect(() => {
    loadData();
  }, [activeTab, scoreFilter, sortOrder]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'contacts' || activeTab === 'settings') {
        await loadContacts();
      }
      
      if (activeTab === 'deals' || activeTab === 'settings') {
        await loadDeals();
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error(`Error loading ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadContacts = async () => {
    let query = supabase
      .from('contacts')
      .select('id, first_name, last_name, email, lead_score, last_interaction_at, company:companies(name)');
    
    // Apply score filter
    if (scoreFilter === 'high') {
      query = query.gte('lead_score', 70);
    } else if (scoreFilter === 'medium') {
      query = query.gte('lead_score', 40).lt('lead_score', 70);
    } else if (scoreFilter === 'low') {
      query = query.lt('lead_score', 40);
    }
    
    // Apply sort order
    query = query.order('lead_score', { ascending: sortOrder === 'asc' });
    
    const { data, error } = await query.limit(50);
    
    if (error) throw error;
    setContacts(data || []);
  };
  
  const loadDeals = async () => {
    let query = supabase
      .from('deals')
      .select('id, title, value, engagement_score, last_activity_at, stage:pipeline_stages(name)');
    
    // Apply score filter
    if (scoreFilter === 'high') {
      query = query.gte('engagement_score', 70);
    } else if (scoreFilter === 'medium') {
      query = query.gte('engagement_score', 40).lt('engagement_score', 70);
    } else if (scoreFilter === 'low') {
      query = query.lt('engagement_score', 40);
    }
    
    // Apply sort order
    query = query.order('engagement_score', { ascending: sortOrder === 'asc' });
    
    const { data, error } = await query.limit(50);
    
    if (error) throw error;
    setDeals(data || []);
  };
  
  const handleRefresh = () => {
    loadData();
  };
  
  const handleRunScoring = async () => {
    try {
      setLoading(true);
      
      // Call the database function to update all scores
      const { error } = await supabase.rpc('update_all_lead_scores');
      
      if (error) throw error;
      
      // Reload data after a short delay
      setTimeout(() => {
        loadData();
      }, 1000);
    } catch (error) {
      console.error('Error running scoring job:', error);
    }
  };
  
  const handleExport = () => {
    const data = activeTab === 'contacts' ? contacts : deals;
    const filename = `${activeTab}_scores_${new Date().toISOString().split('T')[0]}.csv`;
    
    // Create CSV content
    let csvContent = '';
    
    if (activeTab === 'contacts') {
      csvContent = 'ID,Name,Email,Company,Lead Score,Last Interaction\n';
      csvContent += data.map(contact => {
        return `"${contact.id}","${contact.first_name} ${contact.last_name}","${contact.email || ''}","${contact.company?.name || ''}",${contact.lead_score || 0},"${contact.last_interaction_at || ''}"`;
      }).join('\n');
    } else {
      csvContent = 'ID,Title,Value,Stage,Engagement Score,Last Activity\n';
      csvContent += data.map(deal => {
        return `"${deal.id}","${deal.title}","${deal.value}","${deal.stage?.name || ''}",${deal.engagement_score || 0},"${deal.last_activity_at || ''}"`;
      }).join('\n');
    }
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const filteredData = activeTab === 'contacts'
    ? contacts.filter(contact => 
        `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.company?.name && contact.company.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : deals.filter(deal => 
        deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (deal.stage?.name && deal.stage.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };
  
  const getScoreDistribution = (items: any[], scoreField: string) => {
    const high = items.filter(item => (item[scoreField] || 0) >= 70).length;
    const medium = items.filter(item => (item[scoreField] || 0) >= 40 && (item[scoreField] || 0) < 70).length;
    const low = items.filter(item => (item[scoreField] || 0) < 40).length;
    const total = items.length;
    
    return { high, medium, low, total };
  };
  
  const contactScores = getScoreDistribution(contacts, 'lead_score');
  const dealScores = getScoreDistribution(deals, 'engagement_score');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Lead Scoring</h1>
          <p className="text-dark-400">Track and manage engagement scores for contacts and deals</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunScoring}
            className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Run Scoring</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-dark-200">
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'contacts'
              ? 'text-accent border-b-2 border-accent'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Contact Scores</span>
        </button>
        
        <button
          onClick={() => setActiveTab('deals')}
          className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'deals'
              ? 'text-accent border-b-2 border-accent'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Deal Scores</span>
        </button>
        
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-accent border-b-2 border-accent'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* Stats Cards */}
      {activeTab !== 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-400 mb-1">
                  {activeTab === 'contacts' ? 'Total Contacts' : 'Total Deals'}
                </p>
                <p className="text-2xl font-bold text-white">
                  {activeTab === 'contacts' ? contactScores.total : dealScores.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                {activeTab === 'contacts' ? (
                  <User className="w-6 h-6 text-blue-400" />
                ) : (
                  <Target className="w-6 h-6 text-blue-400" />
                )}
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-400 mb-1">High Score (70+)</p>
                <p className="text-2xl font-bold text-white">
                  {activeTab === 'contacts' ? contactScores.high : dealScores.high}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-400 mb-1">Medium Score (40-69)</p>
                <p className="text-2xl font-bold text-white">
                  {activeTab === 'contacts' ? contactScores.medium : dealScores.medium}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-400 mb-1">Low Score (0-39)</p>
                <p className="text-2xl font-bold text-white">
                  {activeTab === 'contacts' ? contactScores.low : dealScores.low}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      {activeTab !== 'settings' && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent w-full"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-dark-400 text-sm">Score:</span>
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value as any)}
                className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Scores</option>
                <option value="high">High (70+)</option>
                <option value="medium">Medium (40-69)</option>
                <option value="low">Low (0-39)</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-dark-400 text-sm">Sort:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="desc">Highest First</option>
                <option value="asc">Lowest First</option>
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
          
          {lastUpdated && (
            <div className="text-xs text-dark-400 mt-2 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </Card>
      )}

      {/* Contact Scores */}
      {activeTab === 'contacts' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-200/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Contact</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Company</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Lead Score</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Last Interaction</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-dark-400">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-dark-400">
                      No contacts found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredData.map((contact) => (
                    <tr key={contact.id} className="hover:bg-dark-200/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {contact.first_name} {contact.last_name}
                            </p>
                            {contact.email && (
                              <p className="text-sm text-dark-400">{contact.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <span className="text-white">
                          {contact.company?.name || 'No company'}
                        </span>
                      </td>
                      
                      <td className="p-4">
                        <LeadScoreBadge score={contact.lead_score || 0} />
                      </td>
                      
                      <td className="p-4">
                        {contact.last_interaction_at ? (
                          <span className="text-white">
                            {formatDistanceToNow(new Date(contact.last_interaction_at), { addSuffix: true })}
                          </span>
                        ) : (
                          <span className="text-dark-400">Never</span>
                        )}
                      </td>
                      
                      <td className="p-4">
                        <TrendIcon type="up" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Deal Scores */}
      {activeTab === 'deals' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-200/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Deal</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Value</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Stage</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Engagement Score</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Last Activity</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-dark-400">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-dark-400">
                      No deals found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredData.map((deal) => (
                    <tr key={deal.id} className="hover:bg-dark-200/30 transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-white">{deal.title}</p>
                      </td>
                      
                      <td className="p-4">
                        <span className="text-white">{formatCurrency(deal.value)}</span>
                      </td>
                      
                      <td className="p-4">
                        <span className="text-white">{deal.stage?.name || 'No stage'}</span>
                      </td>
                      
                      <td className="p-4">
                        <DealScoreBadge score={deal.engagement_score || 0} />
                      </td>
                      
                      <td className="p-4">
                        {deal.last_activity_at ? (
                          <span className="text-white">
                            {formatDistanceToNow(new Date(deal.last_activity_at), { addSuffix: true })}
                          </span>
                        ) : (
                          <span className="text-dark-400">Never</span>
                        )}
                      </td>
                      
                      <td className="p-4">
                        <TrendIcon type="down" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Lead Scoring Configuration</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Contact Scoring Factors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-dark-200/50 p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Base Score: 50 points</h4>
                    <p className="text-sm text-dark-400">Every contact starts with a base score of 50 points</p>
                  </div>
                  
                  <div className="bg-dark-200/50 p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Email Engagement</h4>
                    <ul className="text-sm text-dark-400 space-y-1">
                      <li>+10 points if email opened in last 7 days</li>
                      <li>+10 points if email replied to in last 7 days</li>
                    </ul>
                  </div>
                  
                  <div className="bg-dark-200/50 p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Task Completion</h4>
                    <ul className="text-sm text-dark-400 space-y-1">
                      <li>+10 points if task completed in last 7 days</li>
                      <li>+5 points per additional completed task</li>
                    </ul>
                  </div>
                  
                  <div className="bg-dark-200/50 p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Mentions</h4>
                    <ul className="text-sm text-dark-400 space-y-1">
                      <li>+10 points if mentioned in notes in last 14 days</li>
                      <li>+5 points per additional mention</li>
                    </ul>
                  </div>
                  
                  <div className="bg-dark-200/50 p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Inactivity Penalty</h4>
                    <ul className="text-sm text-dark-400 space-y-1">
                      <li>-15 points if no interaction in 30+ days</li>
                      <li>-5 points if no interaction in 14-30 days</li>
                    </ul>
                  </div>
                  
                  <div className="bg-dark-200/50 p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Manual Adjustment</h4>
                    <p className="text-sm text-dark-400">Sales reps can manually adjust scores as needed</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Deal Scoring Factors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-dark-200/50 p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Base Score: 40 points</h4>
                    <p className="text-sm text-dark-400">Every deal starts with a base score of 40 points</p>
                  </div>
                  
                  <div className="bg-dark-200/50 p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Stage Progress</h4>
                    <p className="text-sm text-dark-400">Up to +15 points based on pipeline stage position</p>
                  </div>
                  
                  <div className="bg-dark-200/50 p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Activity Count</h4>
                    <p className="text-sm text-dark-400">Up to +15 points based on number of activities</p>
                  </div>
                  
                  <div className="bg-dark-200/50 p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Notes & Files</h4>
                    <p className="text-sm text-dark-400">Up to +20 points based on notes and files</p>
                  </div>
                  
                  <div className="bg-dark-200/50 p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Recency</h4>
                    <ul className="text-sm text-dark-400 space-y-1">
                      <li>-15 points if no activity in 14+ days</li>
                      <li>-5 points if no activity in 7-14 days</li>
                    </ul>
                  </div>
                  
                  <div className="bg-dark-200/50 p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Probability</h4>
                    <p className="text-sm text-dark-400">Up to +10 points based on stage probability</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Scoring Schedule</h3>
                <div className="bg-dark-200/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white mb-1">Automatic Daily Scoring</h4>
                      <p className="text-sm text-dark-400">Scores are automatically recalculated every 24 hours</p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-400 text-sm font-medium flex items-center">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleRunScoring}
                  className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Run Scoring Now</span>
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Trend icon component
const TrendIcon = ({ type }: { type: 'up' | 'down' | 'neutral' }) => {
  if (type === 'up') {
    return (
      <div className="flex items-center text-green-400">
        <ArrowUp className="w-4 h-4 mr-1" />
        <span className="text-sm">+12%</span>
      </div>
    );
  } else if (type === 'down') {
    return (
      <div className="flex items-center text-red-400">
        <ArrowDown className="w-4 h-4 mr-1" />
        <span className="text-sm">-8%</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center text-dark-400">
        <Minus className="w-4 h-4 mr-1" />
        <span className="text-sm">0%</span>
      </div>
    );
  }
};

export default LeadScoring;