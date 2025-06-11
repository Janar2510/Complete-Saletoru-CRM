import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, DollarSign, TrendingUp, MoreHorizontal } from 'lucide-react';
import { KanbanColumn, Deal } from '../../types/deals';
import { DealCard } from './DealCard';
import { Card } from '../common/Card';

interface StageColumnProps {
  column: KanbanColumn;
  onDealMove: (dealId: string, targetStageId: string) => void;
  onDealEdit: (deal: Deal) => void;
  onDealView: (deal: Deal) => void;
  onDealDelete: (dealId: string) => void;
  selectMode?: boolean;
  selectedDeals?: Set<string>;
  onDealSelect?: (dealId: string) => void;
}

export const StageColumn: React.FC<StageColumnProps> = ({
  column,
  onDealMove,
  onDealEdit,
  onDealView,
  onDealDelete,
  selectMode = false,
  selectedDeals = new Set(),
  onDealSelect
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'deal',
    drop: (item: { id: string; type: string }) => {
      if (item.type === 'deal') {
        onDealMove(item.id, column.stage.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getDropZoneStyle = () => {
    if (isOver && canDrop) {
      return 'bg-accent/10 border-accent/50';
    }
    if (canDrop) {
      return 'border-dark-300';
    }
    return 'border-dark-200';
  };

  return (
    <div className="flex-shrink-0 w-80">
      <Card className="p-4 h-full bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
        {/* Stage Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.stage.color }}
            />
            <h3 className="font-semibold text-white">{column.stage.name}</h3>
            <span className="bg-dark-200/70 text-dark-400 text-xs px-2 py-1 rounded-full">
              {column.count}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => {
                // Add deal to this stage
                onDealEdit({
                  id: '',
                  deal_id: '',
                  title: '',
                  value: 0,
                  currency: 'USD',
                  stage_id: column.stage.id,
                  pipeline_id: column.stage.pipeline_id,
                  owner_id: '',
                  probability: column.stage.probability,
                  status: 'open',
                  created_at: '',
                  updated_at: '',
                  created_by: ''
                });
              }}
              className="p-1 rounded hover:bg-dark-200 transition-colors"
              title="Add deal to this stage"
            >
              <Plus className="w-4 h-4 text-dark-400" />
            </button>
            
            <button className="p-1 rounded hover:bg-dark-200 transition-colors">
              <MoreHorizontal className="w-4 h-4 text-dark-400" />
            </button>
          </div>
        </div>

        {/* Stage Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-dark-200/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <DollarSign className="w-3 h-3 text-green-400" />
              <span className="text-xs text-dark-400">Value</span>
            </div>
            <p className="text-sm font-bold text-white">
              {formatCurrency(column.totalValue)}
            </p>
          </div>
          
          <div className="bg-dark-200/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-dark-400">Probability</span>
            </div>
            <p className="text-sm font-bold text-white">
              {column.stage.probability}%
            </p>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          ref={drop}
          className={`border-2 border-dashed rounded-lg transition-all duration-200 min-h-96 ${getDropZoneStyle()} relative`}
        >
          {/* Deals List */}
          <div className="space-y-3 p-2">
            {column.deals.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-dark-200/70 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-dark-400" />
                </div>
                <p className="text-dark-400 text-sm">No deals in this stage</p>
                <p className="text-dark-500 text-xs mt-1">Drag deals here or create new ones</p>
              </div>
            ) : (
              column.deals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onEdit={onDealEdit}
                  onView={onDealView}
                  onDelete={onDealDelete}
                  selectMode={selectMode}
                  isSelected={selectedDeals.has(deal.id)}
                  onSelect={onDealSelect}
                />
              ))
            )}
          </div>

          {/* Drop Indicator */}
          {isOver && canDrop && (
            <div className="absolute inset-0 bg-accent/20 border-2 border-accent border-dashed rounded-lg flex items-center justify-center">
              <div className="bg-accent text-white px-4 py-2 rounded-lg font-medium">
                Drop deal here
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};