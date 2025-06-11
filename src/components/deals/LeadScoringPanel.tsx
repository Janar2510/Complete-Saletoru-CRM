import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  Target, 
  Calendar, 
  Tag, 
  Building2,
  Download,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  MessageSquare,
  Mail,
  Phone,
  FileText
} from 'lucide-react';
import { Card } from '../common/Card';
import { Deal } from '../../types/deals';
import { DealScoreBadge } from './DealScoreBadge';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

interface LeadScoringPanelProps {
  deals: Deal[];
  onClose: () => void;
}

export const LeadScoringPanel: React.FC<LeadScoringPanelProps> = ({ deals, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'scoring' | 'insights'>('overview');
  const [topDeals, setTopDeals] = useState<Deal[]>([]);
  const [staleDeals, setStaleDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    analyzeDeals();
  }, [deals]);
  
  const analyzeDeals = () => {
    setLoading(true);
    
    // Get top deals (highest score)
    const sortedByScore = [...deals].sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0));
    setTopDeals(sortedByScore.slice(0, 5));
    
    // Get stale deals (no activity in 30+ days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const stale = deals.filter(deal => {
      if (!deal.last_activity_at) return true;
      return new Date(deal.last_activity_at) < thirtyDaysAgo;
    }).sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0));
    
    setStaleDeals(stale.slice(0, 5));
    setLoading(false);
  };
  
  // Calculate score distribution
  const getScoreDistribution = () => {
    const hot = deals.filter(deal => (deal.engagement_score || 0) >= 80).length;
    const warm = deals.filter(deal => (deal.engagement_score || 0) >= 60 && (deal.engagement_score || 0) < 80).length;
    const cool = deals.filter(deal => (deal.engagement_score || 0) >= 40 && (deal.engagement_score || 0) < 60).length;
    const cold = deals.filter(deal => (deal.engagement_score || 0) < 40).length;
    
    return [
      { name: 'Hot (80-100)', value: hot, color: '#10b981' },
      { name: 'Warm (60-79)', value: warm, color: '#f59e0b' },
      { name: 'Cool (40-59)', value: cool, color: '#3b82f6' },
      { name: 'Cold (0-39)', value: cold, color: '#ef4444' }
    ];
  };
  
  // Calculate stage distribution
  const getStageDistribution = () => {
    const stageMap = new Map<string, { count: number, value: number }>();
    
    deals.forEach(deal => {
      const stageName = deal.stage?.name || 'Unknown';
      if (!stageMap.has(stageName)) {
        stageMap.set(stageName, { count: 0, value: 0 });
      }
      
      const stageData = stageMap.get(stageName)!;
      stageData.count += 1;
      stageData.value += deal.value;
    });
    
    return Array.from(stageMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      value: data.value
    }));
  };
  
  // Calculate activity distribution
  const getActivityDistribution = () => {
    // In a real implementation, this would analyze actual activity data
    return [
      { name: 'Notes', count: 45 },
      { name: 'Emails', count: 32 },
      { name: 'Calls', count: 18 },
      { name: 'Meetings', count: 12 },
      { name: 'Files', count: 8 }
    ];
  };
  
  const scoreDistribution = getScoreDistribution();
  const stageDistribution = getStageDistribution();
  const activityDistribution = getActivityDistribution();
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-blue-400';
    return 'text-red-400';
  };
  
  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (score >= 60) return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    if (score >= 40) return <Target className="w-4 h-4 text-blue-400" />;
    return <XCircle className="w-4 h-4 text-red-400" />;
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Notes':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case 'Emails':
        return <Mail className="w-4 h-4 text-blue-400" />;
      case 'Calls':
        return <Phone className="w-4 h-4 text-green-400" />;
      case 'Meetings':
        return <Calendar className="w-4 h-4 text-yellow-400" />;
      case 'Files':
        return <FileText className="w-4 h-4 text-orange-400" />;
      default:
        return <Target className="w-4 h-4 text-dark-400" />;
    }
  };
  
  return (
    <Card className="p-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Deal Scoring</h2>
            <p className="text-sm text-dark-400">Engagement analysis for {deals.length} deals</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => analyzeDeals()}
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
          onClick={() => setActiveTab('scoring')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'scoring'
              ? 'text-accent border-b-2 border-accent'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Scoring Factors
        </button>
        
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'insights'
              ? 'text-accent border-b-2 border-accent'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          AI Insights
        </button>
      </div>
      
      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Score Distribution */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Score Distribution</h3>
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
                    formatter={(value: number) => [`${value} deals`, '']}
                    contentStyle={{ backgroundColor: '#1e1a2e', borderColor: '#334155' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Top Deals */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Top Deals by Score</h3>
              <DealScoreBadge score={80} showLabel={false} />
            </div>
            
            <div className="space-y-3">
              {topDeals.length > 0 ? (
                topDeals.map(deal => (
                  <div key={deal.id} className="bg-dark-200/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-dark-400" />
                        <span className="font-medium text-white">
                          {deal.title}
                        </span>
                      </div>
                      <DealScoreBadge score={deal.engagement_score || 0} />
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-1 text-dark-400">
                        <DollarSign className="w-3 h-3" />
                        <span>{formatCurrency(deal.value)}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-dark-400">
                        <Calendar className="w-3 h-3" />
                        <span>{deal.last_activity_at ? formatDistanceToNow(new Date(deal.last_activity_at), { addSuffix: true }) : 'No activity'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-dark-400">
                  No deals available
                </div>
              )}
            </div>
          </div>
          
          {/* Stale Deals */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Stale Deals</h3>
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                No activity 30+ days
              </span>
            </div>
            
            <div className="space-y-3">
              {staleDeals.length > 0 ? (
                staleDeals.map(deal => (
                  <div key={deal.id} className="bg-dark-200/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-dark-400" />
                        <span className="font-medium text-white">
                          {deal.title}
                        </span>
                      </div>
                      <DealScoreBadge score={deal.engagement_score || 0} />
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-1 text-dark-400">
                        <Building2 className="w-3 h-3" />
                        <span>{deal.company?.name || 'No company'}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-dark-400">
                        <Calendar className="w-3 h-3" />
                        <span>{deal.last_activity_at ? formatDistanceToNow(new Date(deal.last_activity_at), { addSuffix: true }) : 'No activity'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-dark-400">
                  No stale deals found
                </div>
              )}
            </div>
          </div>
          
          {/* Activity Distribution */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Activity Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityDistribution}>
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
                    formatter={(value: number) => [`${value} activities`, '']}
                    contentStyle={{ backgroundColor: '#1e1a2e', borderColor: '#334155' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'scoring' && (
        <div className="space-y-6">
          <div className="bg-dark-200/50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">How Deal Scoring Works</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-dark-300/50 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Base Score: 40 points</h4>
                  <p className="text-sm text-dark-400">Every deal starts with a base score of 40 points</p>
                </div>
                
                <div className="bg-dark-300/50 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Stage Progress</h4>
                  <p className="text-sm text-dark-400">Up to +15 points based on pipeline stage position</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-dark-400">Early stages</span>
                      <span className="text-white">+5 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Middle stages</span>
                      <span className="text-white">+10 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Late stages</span>
                      <span className="text-white">+15 points</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-dark-300/50 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Activity Count</h4>
                  <p className="text-sm text-dark-400">Up to +15 points based on number of activities</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-dark-400">1-3 activities</span>
                      <span className="text-white">+5 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">4-10 activities</span>
                      <span className="text-white">+10 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">10+ activities</span>
                      <span className="text-white">+15 points</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-dark-300/50 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Notes & Files</h4>
                  <p className="text-sm text-dark-400">Up to +20 points based on notes and files</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-dark-400">Each note</span>
                      <span className="text-white">+3 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Each file</span>
                      <span className="text-white">+5 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Maximum</span>
                      <span className="text-white">20 points</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-dark-300/50 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Recency</h4>
                  <p className="text-sm text-dark-400">Penalties for inactivity</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-dark-400">No activity in 7-14 days</span>
                      <span className="text-red-400">-5 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">No activity in 14+ days</span>
                      <span className="text-red-400">-15 points</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-dark-300/50 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Probability</h4>
                  <p className="text-sm text-dark-400">Up to +10 points based on stage probability</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-dark-400">0-25% probability</span>
                      <span className="text-white">+2 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">26-50% probability</span>
                      <span className="text-white">+5 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">51-75% probability</span>
                      <span className="text-white">+7 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">76-100% probability</span>
                      <span className="text-white">+10 points</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-dark-200/50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Score Categories</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h4 className="font-medium text-white">Hot (80-100)</h4>
                </div>
                <p className="text-sm text-dark-400">
                  Deals with high engagement and activity. These deals are progressing well and have a high chance of closing.
                </p>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <h4 className="font-medium text-white">Warm (60-79)</h4>
                </div>
                <p className="text-sm text-dark-400">
                  Deals with good engagement but may need additional attention to maintain momentum.
                </p>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  <h4 className="font-medium text-white">Cool (40-59)</h4>
                </div>
                <p className="text-sm text-dark-400">
                  Deals with moderate engagement that need more attention and nurturing to progress.
                </p>
              </div>
              
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <h4 className="font-medium text-white">Cold (0-39)</h4>
                </div>
                <p className="text-sm text-dark-400">
                  Deals with low engagement that are at risk of stalling or being lost. Immediate attention required.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">AI-Powered Insights</h3>
                <p className="text-sm text-dark-300">Automatically generated from your deal data</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-dark-200/30 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">Deals at Risk</h4>
                <ul className="space-y-2">
                  {staleDeals.slice(0, 3).map(deal => (
                    <li key={deal.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getScoreIcon(deal.engagement_score || 0)}
                        <span className="text-white">
                          {deal.title}
                        </span>
                        {deal.company && (
                          <span className="text-dark-400 text-sm">
                            ({deal.company.name})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${getScoreColor(deal.engagement_score || 0)}`}>
                          {deal.engagement_score || 0}/100
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
                    <span>Follow up with stale high-value deals to re-engage them</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <ArrowRight className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <span>Schedule check-in calls for deals with scores below 40</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <ArrowRight className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <span>Add detailed notes to deals with low activity to improve their scores</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <ArrowRight className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <span>Focus on moving high-scoring deals to the next stage</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-dark-200/30 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">Activity Insights</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                      <span className="text-white">Notes</span>
                    </div>
                    <span className="text-dark-400">Most effective for engagement</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-blue-400" />
                      <span className="text-white">Emails</span>
                    </div>
                    <span className="text-dark-400">Most frequent activity</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-green-400" />
                      <span className="text-white">Calls</span>
                    </div>
                    <span className="text-dark-400">Highest conversion rate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-dark-200/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">Score Improvement Tips</h3>
              <ul className="space-y-2">
                <li className="flex items-start space-x-3 p-2 hover:bg-dark-200 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Add detailed notes</p>
                    <p className="text-sm text-dark-400">Each note adds 3 points to the deal score</p>
                  </div>
                </li>
                
                <li className="flex items-start space-x-3 p-2 hover:bg-dark-200 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Upload relevant files</p>
                    <p className="text-sm text-dark-400">Each file adds 5 points to the deal score</p>
                  </div>
                </li>
                
                <li className="flex items-start space-x-3 p-2 hover:bg-dark-200 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Schedule follow-up meetings</p>
                    <p className="text-sm text-dark-400">Regular interactions prevent score decay</p>
                  </div>
                </li>
                
                <li className="flex items-start space-x-3 p-2 hover:bg-dark-200 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Progress through pipeline stages</p>
                    <p className="text-sm text-dark-400">Later stages add more points to the score</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-dark-200/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">Score Decay Factors</h3>
              <ul className="space-y-2">
                <li className="flex items-start space-x-3 p-2 hover:bg-dark-200 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Inactivity penalty</p>
                    <p className="text-sm text-dark-400">-5 points if no activity in 7-14 days</p>
                    <p className="text-sm text-dark-400">-15 points if no activity in 14+ days</p>
                  </div>
                </li>
                
                <li className="flex items-start space-x-3 p-2 hover:bg-dark-200 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Missed expected close date</p>
                    <p className="text-sm text-dark-400">-10 points if past expected close date</p>
                  </div>
                </li>
                
                <li className="flex items-start space-x-3 p-2 hover:bg-dark-200 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Stage regression</p>
                    <p className="text-sm text-dark-400">-5 points if deal moves backward in pipeline</p>
                  </div>
                </li>
              </ul>
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
              ['Deal Scoring Summary'],
              [`Generated on: ${new Date().toLocaleString()}`],
              [''],
              ['Score Distribution'],
              ['Category', 'Count', 'Percentage'],
              ...scoreDistribution.map(item => [
                item.name, 
                item.value, 
                `${((item.value / deals.length) * 100).toFixed(1)}%`
              ]),
              [''],
              ['Stage Distribution'],
              ['Stage', 'Count', 'Value'],
              ...stageDistribution.map(item => [item.name, item.count, item.value]),
              [''],
              ['Activity Distribution'],
              ['Activity Type', 'Count'],
              ...activityDistribution.map(item => [item.name, item.count])
            ];
            
            // Convert to CSV string
            const csvContent = csvData.map(row => row.join(',')).join('\n');
            
            // Create download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `deal_scoring_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-dark-200 hover:bg-dark-300 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Scoring Data</span>
        </button>
      </div>
    </Card>
  );
};