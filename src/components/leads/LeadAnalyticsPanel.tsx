import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  User, 
  Calendar, 
  Tag, 
  Building2,
  Download,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Card } from '../common/Card';
import { Contact } from '../../types/contacts';
import { LeadScoreBadge } from '../contacts/LeadScoreBadge';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface LeadAnalyticsPanelProps {
  leads: Contact[];
  onClose: () => void;
}

export const LeadAnalyticsPanel: React.FC<LeadAnalyticsPanelProps> = ({ leads, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'distribution' | 'sources' | 'companies'>('overview');
  const [topLeads, setTopLeads] = useState<Contact[]>([]);
  const [staleLeads, setStaleLeads] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    analyzeLeads();
  }, [leads]);
  
  const analyzeLeads = () => {
    setLoading(true);
    
    // Get top leads (highest score)
    const sortedByScore = [...leads].sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0));
    setTopLeads(sortedByScore.slice(0, 5));
    
    // Get stale leads (no interaction in 30+ days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const stale = leads.filter(lead => {
      if (!lead.last_interaction_at) return true;
      return new Date(lead.last_interaction_at) < thirtyDaysAgo;
    }).sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0));
    
    setStaleLeads(stale.slice(0, 5));
    setLoading(false);
  };
  
  // Calculate score distribution
  const getScoreDistribution = () => {
    const hot = leads.filter(lead => (lead.lead_score || 0) >= 70).length;
    const warm = leads.filter(lead => (lead.lead_score || 0) >= 40 && (lead.lead_score || 0) < 70).length;
    const cold = leads.filter(lead => (lead.lead_score || 0) < 40).length;
    
    return [
      { name: 'Hot Leads', value: hot, color: '#10b981' },
      { name: 'Warm Leads', value: warm, color: '#f59e0b' },
      { name: 'Cold Leads', value: cold, color: '#ef4444' }
    ];
  };
  
  // Calculate lead sources distribution
  const getSourceDistribution = () => {
    const sourceCounts: Record<string, number> = {};
    
    leads.forEach(lead => {
      const source = lead.lead_source || 'Unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });
    
    return Object.entries(sourceCounts)
      .map(([name, value]) => ({ name: formatSourceName(name), value }))
      .sort((a, b) => b.value - a.value);
  };
  
  // Calculate company distribution
  const getCompanyDistribution = () => {
    const companyCounts: Record<string, number> = {};
    
    leads.forEach(lead => {
      const company = lead.company?.name || 'No Company';
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    });
    
    return Object.entries(companyCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 companies
  };
  
  // Format source name for display
  const formatSourceName = (source: string) => {
    return source
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Calculate score ranges for histogram
  const getScoreRanges = () => {
    const ranges = [
      { name: '0-9', value: 0 },
      { name: '10-19', value: 0 },
      { name: '20-29', value: 0 },
      { name: '30-39', value: 0 },
      { name: '40-49', value: 0 },
      { name: '50-59', value: 0 },
      { name: '60-69', value: 0 },
      { name: '70-79', value: 0 },
      { name: '80-89', value: 0 },
      { name: '90-100', value: 0 }
    ];
    
    leads.forEach(lead => {
      const score = lead.lead_score || 0;
      const rangeIndex = Math.min(Math.floor(score / 10), 9);
      ranges[rangeIndex].value++;
    });
    
    return ranges;
  };
  
  const scoreDistribution = getScoreDistribution();
  const sourceDistribution = getSourceDistribution();
  const companyDistribution = getCompanyDistribution();
  const scoreRanges = getScoreRanges();
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  const getScoreIcon = (score: number) => {
    if (score >= 70) return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (score >= 40) return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    return <XCircle className="w-4 h-4 text-red-400" />;
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Lead Analytics</h2>
            <p className="text-sm text-dark-400">Insights from {leads.length} leads</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => analyzeLeads()}
            className="p-2 rounded-lg hover:bg-dark-200 transition-colors text-dark-400 hover:text-white"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
      <div className="flex border-b border-dark-200 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-accent border-b-2 border-accent'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        
        <button
          onClick={() => setActiveTab('distribution')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'distribution'
              ? 'text-accent border-b-2 border-accent'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Score Distribution
        </button>
        
        <button
          onClick={() => setActiveTab('sources')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'sources'
              ? 'text-accent border-b-2 border-accent'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Lead Sources
        </button>
        
        <button
          onClick={() => setActiveTab('companies')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'companies'
              ? 'text-accent border-b-2 border-accent'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Companies
        </button>
      </div>
      
      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Leads */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Top Leads</h3>
              <LeadScoreBadge score={70} showLabel={false} />
            </div>
            
            <div className="space-y-3">
              {topLeads.length > 0 ? (
                topLeads.map(lead => (
                  <div key={lead.id} className="bg-dark-200/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-dark-400" />
                        <span className="font-medium text-white">
                          {lead.first_name} {lead.last_name}
                        </span>
                      </div>
                      <LeadScoreBadge score={lead.lead_score || 0} />
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-1 text-dark-400">
                        <Building2 className="w-3 h-3" />
                        <span>{lead.company?.name || 'No company'}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-dark-400">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(lead.last_interaction_at)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-dark-400">
                  No leads available
                </div>
              )}
            </div>
          </div>
          
          {/* Stale Leads */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Stale Leads</h3>
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                No activity 30+ days
              </span>
            </div>
            
            <div className="space-y-3">
              {staleLeads.length > 0 ? (
                staleLeads.map(lead => (
                  <div key={lead.id} className="bg-dark-200/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-dark-400" />
                        <span className="font-medium text-white">
                          {lead.first_name} {lead.last_name}
                        </span>
                      </div>
                      <LeadScoreBadge score={lead.lead_score || 0} />
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-1 text-dark-400">
                        <Building2 className="w-3 h-3" />
                        <span>{lead.company?.name || 'No company'}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-dark-400">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(lead.last_interaction_at)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-dark-400">
                  No stale leads found
                </div>
              )}
            </div>
          </div>
          
          {/* AI Guru Insights */}
          <div className="md:col-span-2">
            <div className="bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Guru Insights</h3>
                  <p className="text-sm text-dark-300">AI-powered lead analysis</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-dark-200/30 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Leads Closest to Converting</h4>
                  <ul className="space-y-2">
                    {topLeads.slice(0, 3).map(lead => (
                      <li key={lead.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getScoreIcon(lead.lead_score || 0)}
                          <span className="text-white">
                            {lead.first_name} {lead.last_name}
                          </span>
                          {lead.company && (
                            <span className="text-dark-400 text-sm">
                              ({lead.company.name})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm ${getScoreColor(lead.lead_score || 0)}`}>
                            {lead.lead_score || 0}/100
                          </span>
                          <button className="p-1 bg-dark-300/50 rounded hover:bg-dark-300 transition-colors">
                            <ArrowRight className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-dark-200/30 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Recommendations</h4>
                  <ul className="space-y-2 text-dark-300">
                    <li className="flex items-start space-x-2">
                      <ArrowRight className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span>Follow up with stale high-value leads to re-engage them</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <ArrowRight className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span>Consider running a targeted campaign for warm leads (40-70 score)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <ArrowRight className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span>Convert your top 3 leads to deals to capitalize on their high engagement</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'distribution' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Score Distribution Pie Chart */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 text-center">Lead Score Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} leads`, 'Count']}
                    contentStyle={{ backgroundColor: '#1e1a2e', borderColor: '#334155' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Score Histogram */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 text-center">Score Histogram</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreRanges}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b' }}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b' }}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} leads`, 'Count']}
                    contentStyle={{ backgroundColor: '#1e1a2e', borderColor: '#334155' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="md:col-span-2">
            <div className="bg-dark-200/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Distribution Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-dark-300/30 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <h4 className="font-medium text-white">Hot Leads (70+)</h4>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Count:</span>
                    <span className="text-white">{scoreDistribution[0].value}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Percentage:</span>
                    <span className="text-white">
                      {leads.length > 0 ? ((scoreDistribution[0].value / leads.length) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
                
                <div className="bg-dark-300/30 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <h4 className="font-medium text-white">Warm Leads (40-69)</h4>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Count:</span>
                    <span className="text-white">{scoreDistribution[1].value}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Percentage:</span>
                    <span className="text-white">
                      {leads.length > 0 ? ((scoreDistribution[1].value / leads.length) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
                
                <div className="bg-dark-300/30 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <h4 className="font-medium text-white">Cold Leads (0-39)</h4>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Count:</span>
                    <span className="text-white">{scoreDistribution[2].value}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Percentage:</span>
                    <span className="text-white">
                      {leads.length > 0 ? ((scoreDistribution[2].value / leads.length) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'sources' && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 text-center">Lead Sources</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sourceDistribution}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <XAxis 
                  type="number"
                  tick={{ fill: '#64748b' }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  tick={{ fill: '#64748b' }}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} leads`, 'Count']}
                  contentStyle={{ backgroundColor: '#1e1a2e', borderColor: '#334155' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#6366f1"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Source Insights</h3>
            <div className="bg-dark-200/50 rounded-lg p-4">
              <div className="space-y-3">
                <p className="text-dark-300">
                  {sourceDistribution.length > 0 ? (
                    <>
                      <span className="text-white font-medium">{sourceDistribution[0].name}</span> is your top lead source, 
                      accounting for {((sourceDistribution[0].value / leads.length) * 100).toFixed(1)}% of all leads.
                    </>
                  ) : (
                    'No lead source data available.'
                  )}
                </p>
                
                {sourceDistribution.length > 1 && (
                  <p className="text-dark-300">
                    Your second most common source is <span className="text-white font-medium">{sourceDistribution[1].name}</span> with 
                    {((sourceDistribution[1].value / leads.length) * 100).toFixed(1)}% of leads.
                  </p>
                )}
                
                <div className="pt-3 border-t border-dark-300">
                  <h4 className="font-medium text-white mb-2">Recommendations</h4>
                  <ul className="space-y-2 text-dark-300">
                    <li className="flex items-start space-x-2">
                      <ArrowRight className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span>Focus marketing efforts on your top-performing lead sources</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <ArrowRight className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span>Investigate why some sources have lower conversion rates</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'companies' && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 text-center">Top Companies</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={companyDistribution}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <XAxis 
                  type="number"
                  tick={{ fill: '#64748b' }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  tick={{ fill: '#64748b' }}
                  axisLine={{ stroke: '#334155' }}
                  width={100}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} leads`, 'Count']}
                  contentStyle={{ backgroundColor: '#1e1a2e', borderColor: '#334155' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#6366f1"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Company Insights</h3>
            <div className="bg-dark-200/50 rounded-lg p-4">
              <div className="space-y-3">
                <p className="text-dark-300">
                  {companyDistribution.length > 0 ? (
                    <>
                      <span className="text-white font-medium">{companyDistribution[0].name}</span> has the most leads in your database
                      with {companyDistribution[0].value} contacts.
                    </>
                  ) : (
                    'No company data available.'
                  )}
                </p>
                
                <p className="text-dark-300">
                  {leads.filter(lead => !lead.company).length} leads ({((leads.filter(lead => !lead.company).length / leads.length) * 100).toFixed(1)}%)
                  are not associated with any company.
                </p>
                
                <div className="pt-3 border-t border-dark-300">
                  <h4 className="font-medium text-white mb-2">Recommendations</h4>
                  <ul className="space-y-2 text-dark-300">
                    <li className="flex items-start space-x-2">
                      <ArrowRight className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span>Consider account-based marketing for companies with multiple leads</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <ArrowRight className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span>Enrich lead data to associate contacts with companies</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="flex justify-end mt-6 pt-4 border-t border-dark-200">
        <button
          onClick={() => {
            // Export analytics as CSV
            const csvData = [
              ['Lead Analytics Summary'],
              [`Generated on: ${new Date().toLocaleString()}`],
              [''],
              ['Score Distribution'],
              ['Category', 'Count', 'Percentage'],
              ...scoreDistribution.map(item => [
                item.name, 
                item.value, 
                `${((item.value / leads.length) * 100).toFixed(1)}%`
              ]),
              [''],
              ['Lead Sources'],
              ['Source', 'Count'],
              ...sourceDistribution.map(item => [item.name, item.value]),
              [''],
              ['Top Companies'],
              ['Company', 'Lead Count'],
              ...companyDistribution.map(item => [item.name, item.value])
            ];
            
            // Convert to CSV string
            const csvContent = csvData.map(row => row.join(',')).join('\n');
            
            // Create download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `lead_analytics_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-dark-200 hover:bg-dark-300 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Analytics</span>
        </button>
      </div>
    </Card>
  );
};