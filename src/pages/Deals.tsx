import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Filter, 
  Search, 
  MoreHorizontal, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  Target,
  ChevronDown,
  ChevronUp,
  Download,
  BarChart2,
  Zap
} from 'lucide-react';
import { KanbanBoard } from '../components/deals/KanbanBoard';
import { DealsAPI } from '../lib/deals-api';
import { Pipeline, Deal, PipelineStage } from '../types/deals';
import { Card } from '../components/common/Card';
import { DealsEmptyState } from '../components/empty-states/DealsEmptyState';
import { GuruSuggestion } from '../components/empty-states/GuruSuggestion';
import { usePlan } from '../contexts/PlanContext';
import { ImportExportButton } from '../components/import-export/ImportExportButton';
import { BulkActionBar } from '../components/import-export/BulkActionBar';
import { GuruImportSuggestion } from '../components/import-export/GuruImportSuggestion';
import { DealModal } from '../components/deals/DealModal';
import { DealDetailModal } from '../components/deals/DealDetailModal';
import { LeadScoringPanel } from '../components/deals/LeadScoringPanel';
import { DealAnalyticsPanel } from '../components/deals/DealAnalyticsPanel';
import { format } from 'date-fns';

const Deals: React.FC = () => {
  const { currentPlan } = usePlan();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [stats, setStats] = useState({
    totalDeals: 0,
    totalValue: 0,
    avgDealSize: 0,
    conversionRate: 0,
    avgDealCycle: 0
  });
  const [showGuruSuggestion, setShowGuruSuggestion] = useState(false);
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);
  const [showImportSuggestion, setShowImportSuggestion] = useState(false);
  const [lastImportCount, setLastImportCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showScoringPanel, setShowScoringPanel] = useState(false);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{
    status?: string;
    owner_id?: string;
    min_value?: number;
    max_value?: number;
    min_probability?: number;
    max_probability?: number;
    date_range?: {
      start: string;
      end: string;
    };
  }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'value' | 'created_at' | 'probability'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadPipelines();
  }, []);

  useEffect(() => {
    if (selectedPipeline) {
      loadDeals();
      loadStages();
    }
  }, [selectedPipeline, filters, searchTerm, sortBy, sortOrder]);

  const loadPipelines = async () => {
    try {
      setLoading(true);
      const pipelinesData = await DealsAPI.getPipelines();
      setPipelines(pipelinesData);
      
      // Select default pipeline
      const defaultPipeline = pipelinesData.find(p => p.is_default) || pipelinesData[0];
      if (defaultPipeline) {
        setSelectedPipeline(defaultPipeline.id);
      }
    } catch (error) {
      console.error('Error loading pipelines:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeals = async () => {
    try {
      // Combine filters with search term
      const dealFilters = {
        ...filters,
        pipeline_id: selectedPipeline,
        search: searchTerm || undefined
      };
      
      const dealsData = await DealsAPI.getDeals(dealFilters);
      setDeals(dealsData);
      
      // Calculate stats
      const totalValue = dealsData.reduce((sum, deal) => sum + deal.value, 0);
      const avgDealSize = dealsData.length > 0 ? totalValue / dealsData.length : 0;
      const wonDeals = dealsData.filter(deal => deal.status === 'won').length;
      const conversionRate = dealsData.length > 0 ? (wonDeals / dealsData.length) * 100 : 0;
      
      // Calculate average deal cycle (days from creation to closing)
      const closedDeals = dealsData.filter(deal => deal.actual_close_date);
      let totalDays = 0;
      
      closedDeals.forEach(deal => {
        const createDate = new Date(deal.created_at);
        const closeDate = new Date(deal.actual_close_date!);
        const days = Math.round((closeDate.getTime() - createDate.getTime()) / (1000 * 60 * 60 * 24));
        totalDays += days;
      });
      
      const avgDealCycle = closedDeals.length > 0 ? totalDays / closedDeals.length : 0;

      setStats({
        totalDeals: dealsData.length,
        totalValue,
        avgDealSize,
        conversionRate,
        avgDealCycle
      });
      
      // Show Guru suggestion if this is the first deal
      if (dealsData.length === 1) {
        setShowGuruSuggestion(true);
      }
    } catch (error) {
      console.error('Error loading deals:', error);
    }
  };
  
  const loadStages = async () => {
    try {
      const stagesData = await DealsAPI.getPipelineStages(selectedPipeline);
      setStages(stagesData);
    } catch (error) {
      console.error('Error loading stages:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleDealUpdate = (deal: Deal) => {
    // Refresh deals when a deal is updated
    loadDeals();
  };

  const handleCreateDeal = () => {
    setSelectedDeal(null);
    setShowCreateModal(true);
  };

  const handleEditDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setShowCreateModal(true);
  };

  const handleViewDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setShowDetailModal(true);
  };

  const handleSaveDeal = async (dealData: any) => {
    try {
      if (dealData.id) {
        // Update existing deal
        await DealsAPI.updateDeal(dealData.id, dealData);
      } else {
        // Create new deal
        await DealsAPI.createDeal({
          ...dealData,
          pipeline_id: selectedPipeline
        });
      }
      
      setShowCreateModal(false);
      setShowDetailModal(false);
      loadDeals();
    } catch (error) {
      console.error('Error saving deal:', error);
    }
  };

  const handleSetupAutomation = () => {
    // In a real app, this would navigate to automation setup
    alert('Setup automation functionality would open here');
  };

  const handleGuruSuggestion = (suggestion: string) => {
    // In a real app, this would trigger the Guru assistant
    alert(`Guru suggestion: ${suggestion}`);
    setShowGuruSuggestion(false);
  };
  
  const handleImportComplete = () => {
    // Refresh deals after import
    loadDeals();
    
    // Show Guru suggestion for analysis if on Team plan
    if (currentPlan === 'team') {
      setLastImportCount(15); // This would be the actual count from the import
      setShowImportSuggestion(true);
    }
  };
  
  const handleBulkActionComplete = () => {
    // Refresh deals after bulk action
    loadDeals();
  };
  
  const handleAnalyzeImport = () => {
    // In a real app, this would trigger Guru's analysis
    alert('Guru would analyze your imported deals and suggest tags, stages, and probabilities');
    setShowImportSuggestion(false);
  };
  
  const handleSelectionChange = (dealIds: string[]) => {
    setSelectedDealIds(dealIds);
  };

  const handleToggleScoringPanel = () => {
    setShowScoringPanel(!showScoringPanel);
    if (showAnalyticsPanel) setShowAnalyticsPanel(false);
  };

  const handleToggleAnalyticsPanel = () => {
    setShowAnalyticsPanel(!showAnalyticsPanel);
    if (showScoringPanel) setShowScoringPanel(false);
  };

  const handleExportDeals = async () => {
    try {
      // In a real implementation, this would export deals to CSV
      const today = format(new Date(), 'yyyy-MM-dd');
      const filename = `deals_export_${today}.csv`;
      
      // Create CSV content
      let csvContent = 'ID,Title,Value,Stage,Probability,Status,Created Date\n';
      
      deals.forEach(deal => {
        csvContent += `"${deal.id}","${deal.title}","${deal.value}","${deal.stage?.name || ''}","${deal.probability}%","${deal.status}","${new Date(deal.created_at).toLocaleDateString()}"\n`;
      });
      
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
    } catch (error) {
      console.error('Error exporting deals:', error);
    }
  };

  if (loading && deals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!loading && deals.length === 0) {
    return (
      <DealsEmptyState 
        onCreateDeal={handleCreateDeal} 
        onSetupAutomation={handleSetupAutomation}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Guru suggestion for first deal */}
      {showGuruSuggestion && currentPlan === 'team' && (
        <div className="absolute bottom-24 right-24 z-10 max-w-sm">
          <GuruSuggestion
            title="First deal created!"
            description="Here are some tips to move your deal forward:"
            suggestions={[
              "Add tasks to track next steps",
              "Upload proposal documents",
              "Schedule a follow-up meeting",
              "Set up email tracking for this deal"
            ]}
            onSuggestionClick={handleGuruSuggestion}
            onClose={() => setShowGuruSuggestion(false)}
          />
        </div>
      )}
      
      {/* Guru suggestion after import */}
      {showImportSuggestion && (
        <div className="mb-6">
          <GuruImportSuggestion
            entityType="deals"
            importCount={lastImportCount}
            onClose={() => setShowImportSuggestion(false)}
            onAnalyze={handleAnalyzeImport}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Deals</h1>
          <p className="text-dark-400">Manage your sales pipeline</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Analytics & Scoring Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleToggleScoringPanel}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                showScoringPanel 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-dark-200/70 text-dark-400 hover:bg-dark-300 hover:text-white'
              }`}
              title="Lead Scoring"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden md:inline">Scoring</span>
            </button>
            
            <button
              onClick={handleToggleAnalyticsPanel}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                showAnalyticsPanel 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-dark-200/70 text-dark-400 hover:bg-dark-300 hover:text-white'
              }`}
              title="Deal Analytics"
            >
              <BarChart2 className="w-4 h-4" />
              <span className="hidden md:inline">Analytics</span>
            </button>
          </div>
          
          {/* Pipeline Selector */}
          <select
            value={selectedPipeline}
            onChange={(e) => setSelectedPipeline(e.target.value)}
            className="bg-dark-200/70 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            {pipelines.map(pipeline => (
              <option key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-dark-200/70 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-accent text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'list'
                  ? 'bg-accent text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              List
            </button>
          </div>
          
          <ImportExportButton 
            entityType="deals"
            onImportComplete={handleImportComplete}
          />

          <button 
            onClick={handleCreateDeal}
            className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Deal</span>
          </button>
        </div>
      </div>

      {/* Lead Scoring Panel (conditionally shown) */}
      {showScoringPanel && (
        <LeadScoringPanel 
          deals={deals}
          onClose={() => setShowScoringPanel(false)}
        />
      )}

      {/* Deal Analytics Panel (conditionally shown) */}
      {showAnalyticsPanel && (
        <DealAnalyticsPanel 
          deals={deals}
          stages={stages}
          onClose={() => setShowAnalyticsPanel(false)}
          onExport={handleExportDeals}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="p-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Total Deals</p>
              <p className="text-2xl font-bold text-white">{stats.totalDeals}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Total Value</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalValue)}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Avg Deal Size</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.avgDealSize)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-white">{stats.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Avg Deal Cycle</p>
              <p className="text-2xl font-bold text-white">{Math.round(stats.avgDealCycle)} days</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Search and Filters */}
      <Card className="p-4 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-dark-200/70 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent w-full"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters 
                ? 'bg-accent border-accent text-white' 
                : 'bg-dark-200/70 border-dark-300 hover:bg-dark-300 text-dark-400'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="text-dark-400 text-sm">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-dark-200/70 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="created_at">Created Date</option>
              <option value="value">Deal Value</option>
              <option value="probability">Probability</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-dark-200/70 border border-dark-300 rounded-lg text-dark-400 hover:text-white transition-colors"
            >
              {sortOrder === 'asc' ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
          
          <button
            onClick={handleExportDeals}
            className="bg-dark-200/70 hover:bg-dark-300 text-dark-400 hover:text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Export</span>
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-dark-200/50 rounded-lg">
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
              className="bg-dark-200/70 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Deal Value Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.min_value || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    min_value: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  className="w-1/2 px-3 py-2 bg-dark-200/70 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.max_value || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    max_value: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  className="w-1/2 px-3 py-2 bg-dark-200/70 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Probability Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min %"
                  min="0"
                  max="100"
                  value={filters.min_probability || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    min_probability: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  className="w-1/2 px-3 py-2 bg-dark-200/70 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="number"
                  placeholder="Max %"
                  min="0"
                  max="100"
                  value={filters.max_probability || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    max_probability: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  className="w-1/2 px-3 py-2 bg-dark-200/70 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <button
              onClick={() => setFilters({})}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </Card>
      
      {/* Bulk Action Bar (shown when items are selected) */}
      {selectedDealIds.length > 0 && (
        <BulkActionBar
          entityType="deals"
          selectedIds={selectedDealIds}
          onClearSelection={() => setSelectedDealIds([])}
          onActionComplete={handleBulkActionComplete}
          availableActions={['assign', 'tag', 'status', 'stage', 'delete', 'export']}
          statuses={['open', 'won', 'lost']}
          tags={['Hot', 'Priority', 'Stalled', 'Negotiation']}
          stages={stages}
        />
      )}

      {/* Main Content */}
      {selectedPipeline && (
        <>
          {viewMode === 'kanban' ? (
            <KanbanBoard
              pipelineId={selectedPipeline}
              filters={filters}
              onDealUpdate={handleDealUpdate}
              onSelectionChange={handleSelectionChange}
            />
          ) : (
            <Card className="p-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
              <div className="text-center py-12">
                <p className="text-dark-400">List view coming soon...</p>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Create/Edit Deal Modal */}
      {showCreateModal && (
        <DealModal
          deal={selectedDeal}
          pipelineId={selectedPipeline}
          onSave={handleSaveDeal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedDeal(null);
          }}
        />
      )}

      {/* Deal Detail Modal */}
      {showDetailModal && selectedDeal && (
        <DealDetailModal
          deal={selectedDeal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDeal(null);
          }}
          onEdit={(deal) => {
            setShowDetailModal(false);
            handleEditDeal(deal);
          }}
        />
      )}
    </div>
  );
};

export default Deals;