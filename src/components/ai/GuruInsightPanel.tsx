import React, { useState, useEffect } from 'react';
import { Bot, X, TrendingUp, User, Target, Calendar, ArrowRight, Cloud, FileText, Sparkles } from 'lucide-react';
import { Card } from '../common/Card';
import { useAIAssistant } from '../../hooks/useAIAssistant';
import { LeadScoreBadge } from '../contacts/LeadScoreBadge';
import { DealScoreBadge } from '../deals/DealScoreBadge';
import { useNavigate } from 'react-router-dom';
import { DealsAPI } from '../../lib/deals-api';

interface GuruInsightPanelProps {
  onClose: () => void;
  onAskGuru: (question: string) => void;
}

export const GuruInsightPanel: React.FC<GuruInsightPanelProps> = ({ onClose, onAskGuru }) => {
  const navigate = useNavigate();
  const { getPipelineAnalysis, getTopLeads } = useAIAssistant();
  
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [topLeads, setTopLeads] = useState<any[]>([]);
  const [cloudFolders, setCloudFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load data in parallel
      const [pipelineAnalysis, leadsData, foldersData] = await Promise.all([
        getPipelineAnalysis().catch(() => null),
        getTopLeads(3).catch(() => []),
        loadCloudFolders().catch(() => [])
      ]);
      
      setPipelineData(pipelineAnalysis);
      setTopLeads(leadsData || []);
      setCloudFolders(foldersData || []);
    } catch (error) {
      console.error('Error loading Guru insights:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadCloudFolders = async () => {
    try {
      // Get top deals
      const deals = await DealsAPI.getDeals({ 
        status: 'open',
        engagement_score_min: 70
      }, 3);
      
      // Get cloud folders for each deal
      const foldersPromises = deals.map(deal => DealsAPI.getDealFolders(deal.id));
      const foldersResults = await Promise.all(foldersPromises);
      
      // Combine results with deal info
      return deals.map((deal, index) => ({
        deal,
        folders: foldersResults[index] || []
      })).filter(item => item.folders.length > 0);
    } catch (error) {
      console.error('Error loading cloud folders:', error);
      return [];
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };
  
  return (
    <Card className="p-6 border-l-4 border-accent">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center">
              <span>Guru Insights</span>
            </h3>
            <p className="text-sm text-dark-400">AI-powered CRM intelligence</p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
        >
          <X className="w-5 h-5 text-dark-400" />
        </button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pipeline Insights */}
          <div className="bg-dark-200/30 rounded-lg p-4 backdrop-blur-sm border border-dark-300/50">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h4 className="font-medium text-white">Pipeline Health</h4>
            </div>
            
            {pipelineData ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-dark-400">Total Value</span>
                  <span className="text-white font-medium">{formatCurrency(pipelineData.totalValue || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-dark-400">Active Deals</span>
                  <span className="text-white font-medium">{pipelineData.totalDeals || 0}</span>
                </div>
                
                {pipelineData.bottlenecks && pipelineData.bottlenecks.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-dark-300">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white text-sm">Bottleneck Detected</p>
                        <p className="text-dark-400 text-xs mt-1">
                          {pipelineData.bottlenecks[0].stageName} stage has a {Math.round(pipelineData.bottlenecks[0].dropoffRate * 100)}% drop-off rate
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => onAskGuru("Where are we losing deals?")}
                  className="w-full mt-2 text-accent hover:text-accent/80 text-sm flex items-center justify-center space-x-1"
                >
                  <span>Analyze pipeline bottlenecks</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <p className="text-dark-400 text-center py-4">No pipeline data available</p>
            )}
          </div>
          
          {/* Top Leads */}
          <div className="bg-dark-200/30 rounded-lg p-4 backdrop-blur-sm border border-dark-300/50">
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-green-400" />
              <h4 className="font-medium text-white">Top Leads</h4>
            </div>
            
            {topLeads.length > 0 ? (
              <div className="space-y-3">
                {topLeads.slice(0, 3).map((lead, index) => (
                  <div key={lead.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm">{lead.first_name} {lead.last_name}</p>
                      <p className="text-dark-400 text-xs">{lead.company?.name || 'No company'}</p>
                    </div>
                    <LeadScoreBadge score={lead.lead_score || 0} size="sm" />
                  </div>
                ))}
                
                <button
                  onClick={() => navigate('/leads')}
                  className="w-full mt-2 text-accent hover:text-accent/80 text-sm flex items-center justify-center space-x-1"
                >
                  <span>View all leads</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <p className="text-dark-400 text-center py-4">No lead data available</p>
            )}
          </div>
          
          {/* Cloud Storage */}
          <div className="bg-dark-200/30 rounded-lg p-4 backdrop-blur-sm border border-dark-300/50">
            <div className="flex items-center space-x-2 mb-4">
              <Cloud className="w-5 h-5 text-blue-400" />
              <h4 className="font-medium text-white">Cloud Storage</h4>
            </div>
            
            {cloudFolders.length > 0 ? (
              <div className="space-y-3">
                {cloudFolders.slice(0, 3).map((item, index) => (
                  <div key={item.deal.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm">{item.deal.title}</p>
                      <p className="text-dark-400 text-xs">
                        {item.folders.length} folder{item.folders.length !== 1 ? 's' : ''} connected
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigate(`/deals`);
                        // In a real app, you would navigate to the specific deal
                        // navigate(`/deals/${item.deal.id}`);
                      }}
                      className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={() => onAskGuru("Show me my cloud storage folders")}
                  className="w-full mt-2 text-accent hover:text-accent/80 text-sm flex items-center justify-center space-x-1"
                >
                  <span>Manage cloud storage</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-dark-400 mb-2">No cloud folders connected</p>
                <button
                  onClick={() => navigate('/deals')}
                  className="text-accent hover:text-accent/80 text-sm"
                >
                  Connect cloud storage to a deal
                </button>
              </div>
            )}
          </div>
          
          {/* Upcoming Tasks */}
          <div className="bg-dark-200/30 rounded-lg p-4 backdrop-blur-sm border border-dark-300/50">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-yellow-400" />
              <h4 className="font-medium text-white">Upcoming Tasks</h4>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5"></div>
                <div>
                  <p className="text-white text-sm">Follow up with TechCorp</p>
                  <p className="text-dark-400 text-xs">Due today at 2:00 PM</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5"></div>
                <div>
                  <p className="text-white text-sm">Prepare demo for StartupXYZ</p>
                  <p className="text-dark-400 text-xs">Due tomorrow at 10:00 AM</p>
                </div>
              </div>
              
              <button
                onClick={() => onAskGuru("What tasks are due today?")}
                className="w-full mt-2 text-accent hover:text-accent/80 text-sm flex items-center justify-center space-x-1"
              >
                <span>Show all tasks</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Ask Guru Button */}
      <div className="mt-6 pt-4 border-t border-dark-200 flex justify-center">
        <button
          onClick={() => onAskGuru("")}
          className="bg-gradient-to-r from-accent to-purple-500 hover:opacity-90 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-md"
        >
          <Bot className="w-4 h-4" />
          <span>Ask Guru Anything</span>
        </button>
      </div>
    </Card>
  );
};

// Helper components
const AlertTriangle: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
    <path d="M12 9v4"></path>
    <path d="M12 17h.01"></path>
  </svg>
);