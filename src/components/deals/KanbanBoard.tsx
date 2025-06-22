import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Filter, Search, MoreHorizontal, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { Deal, PipelineStage, KanbanColumn, DealFilters } from '../../types/deals';
import { DealsAPI } from '../../lib/deals-api';
import { StageColumn } from './StageColumn';
import { DealModal } from './DealModal';
import { DealDetailModal } from './DealDetailModal';
import { Card } from '../common/Card';

interface KanbanBoardProps {
  pipelineId: string;
  filters?: DealFilters;
  onDealUpdate?: (deal: Deal) => void;
  onSelectionChange?: (dealIds: string[]) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  pipelineId, 
  filters,
  onDealUpdate,
  onSelectionChange
}) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadKanbanData();
  }, [pipelineId, filters]);

  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = DealsAPI.subscribeToDealUpdates((payload) => {
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        loadKanbanData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    // Notify parent component when selection changes
    if (onSelectionChange) {
      onSelectionChange(Array.from(selectedDeals));
    }
  }, [selectedDeals, onSelectionChange]);

  const loadKanbanData = async () => {
    try {
      setLoading(true);
      
      // Load pipeline stages - use proper UUID format for mock data
      const stages = await DealsAPI.getPipelineStages(pipelineId);
      
      // Load deals for this pipeline
      const deals = await DealsAPI.getDeals({ 
        pipeline_id: pipelineId,
        search: searchTerm,
        ...filters 
      });

      // Group deals by stage
      const kanbanColumns: KanbanColumn[] = stages.map(stage => {
        const stageDeals = deals.filter(deal => deal.stage_id === stage.id);
        const totalValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
        
        return {
          stage,
          deals: stageDeals,
          totalValue,
          count: stageDeals.length,
        };
      });

      setColumns(kanbanColumns);
    } catch (error) {
      console.error('Error loading kanban data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDealMove = async (dealId: string, targetStageId: string) => {
    try {
      await DealsAPI.moveDealToStage(dealId, targetStageId);
      loadKanbanData(); // Refresh the board
      
      if (onDealUpdate) {
        const updatedDeal = await DealsAPI.getDealById(dealId);
        if (updatedDeal) onDealUpdate(updatedDeal);
      }
    } catch (error) {
      console.error('Error moving deal:', error);
    }
  };

  const handleDealCreate = async (dealData: any) => {
    try {
      const newDeal = await DealsAPI.createDeal({
        ...dealData,
        pipeline_id: pipelineId,
      });
      
      setShowCreateModal(false);
      loadKanbanData();
      
      if (onDealUpdate) onDealUpdate(newDeal);
    } catch (error) {
      console.error('Error creating deal:', error);
    }
  };

  const handleDealEdit = async (dealData: any) => {
    try {
      const updatedDeal = await DealsAPI.updateDeal(dealData.id, dealData);
      setSelectedDeal(null);
      setShowCreateModal(false);
      loadKanbanData();
      
      if (onDealUpdate) onDealUpdate(updatedDeal);
    } catch (error) {
      console.error('Error updating deal:', error);
    }
  };

  const handleDealDelete = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    
    try {
      await DealsAPI.deleteDeal(dealId);
      loadKanbanData();
    } catch (error) {
      console.error('Error deleting deal:', error);
    }
  };

  const handleDealView = (deal: Deal) => {
    setSelectedDeal(deal);
    setShowDetailModal(true);
  };
  
  const handleDealSelect = (dealId: string) => {
    if (!selectMode) return;
    
    const newSelected = new Set(selectedDeals);
    if (newSelected.has(dealId)) {
      newSelected.delete(dealId);
    } else {
      newSelected.add(dealId);
    }
    setSelectedDeals(newSelected);
  };
  
  const handleToggleSelectMode = () => {
    setSelectMode(!selectMode);
    if (selectMode) {
      // Clear selection when exiting select mode
      setSelectedDeals(new Set());
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadKanbanData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalPipelineValue = columns.reduce((sum, col) => sum + col.totalValue, 0);
  const totalDeals = columns.reduce((sum, col) => sum + col.count, 0);

  if (loading && columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Filters */}
        <Card className="p-4 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
          <div className="flex items-center space-x-4">
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
              onClick={handleToggleSelectMode}
              className={`p-2 border rounded-lg transition-colors ${
                selectMode 
                  ? 'bg-accent border-accent text-white' 
                  : 'bg-dark-200/70 border-dark-300 hover:bg-dark-300 text-dark-400'
              }`}
              title={selectMode ? 'Exit selection mode' : 'Enter selection mode'}
            >
              {selectMode ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
            
            <button
              onClick={handleRefresh}
              className={`p-2 bg-dark-200/70 border border-dark-300 rounded-lg hover:bg-dark-300 transition-colors ${
                refreshing ? 'text-accent' : 'text-dark-400 hover:text-white'
              }`}
              disabled={refreshing}
              title="Refresh board"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button className="p-2 bg-dark-200/70 border border-dark-300 rounded-lg hover:bg-dark-300 transition-colors text-dark-400 hover:text-white">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-4 text-sm">
            <div className="flex items-center space-x-4">
              <div className="text-dark-400">
                <span className="text-white font-medium">{totalDeals}</span> deals
              </div>
              <div className="text-dark-400">
                Pipeline value: <span className="text-white font-medium">{formatCurrency(totalPipelineValue)}</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-accent hover:text-accent/80 transition-colors flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Deal</span>
            </button>
          </div>
        </Card>

        {/* Kanban Board */}
        <div className="flex space-x-6 overflow-x-auto pb-6">
          {columns.map((column) => (
            <StageColumn
              key={column.stage.id}
              column={column}
              onDealMove={handleDealMove}
              onDealEdit={(deal) => {
                setSelectedDeal(deal);
                setShowCreateModal(true);
              }}
              onDealView={handleDealView}
              onDealDelete={handleDealDelete}
              selectMode={selectMode}
              selectedDeals={selectedDeals}
              onDealSelect={handleDealSelect}
            />
          ))}
        </div>

        {/* Modals */}
        {showCreateModal && (
          <DealModal
            deal={selectedDeal}
            pipelineId={pipelineId}
            onSave={selectedDeal ? handleDealEdit : handleDealCreate}
            onClose={() => {
              setShowCreateModal(false);
              setSelectedDeal(null);
            }}
          />
        )}

        {showDetailModal && selectedDeal && (
          <DealDetailModal
            deal={selectedDeal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedDeal(null);
            }}
            onEdit={(deal) => {
              setShowDetailModal(false);
              setSelectedDeal(deal);
              setShowCreateModal(true);
            }}
          />
        )}
      </div>
    </DndProvider>
  );
};