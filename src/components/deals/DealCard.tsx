import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { 
  DollarSign, 
  User, 
  Calendar, 
  Building2, 
  MoreHorizontal,
  Phone,
  Mail,
  Clock,
  TrendingUp,
  CheckSquare,
  Square,
  Tag,
  AlertCircle
} from 'lucide-react';
import { Deal } from '../../types/deals';
import { Card } from '../common/Card';
import { formatDistanceToNow } from 'date-fns';
import { DealScoreBadge } from './DealScoreBadge';

interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onView: (deal: Deal) => void;
  onDelete: (dealId: string) => void;
  selectMode?: boolean;
  isSelected?: boolean;
  onSelect?: (dealId: string) => void;
}

export const DealCard: React.FC<DealCardProps> = ({ 
  deal, 
  onEdit, 
  onView, 
  onDelete,
  selectMode = false,
  isSelected = false,
  onSelect
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showTags, setShowTags] = useState(false);

  const [{ isDragging }, drag] = useDrag({
    type: 'deal',
    item: { id: deal.id, type: 'deal' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !selectMode, // Disable dragging in select mode
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: deal.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getPriorityColor = (probability: number) => {
    if (probability >= 75) return 'border-l-green-500';
    if (probability >= 50) return 'border-l-yellow-500';
    if (probability >= 25) return 'border-l-orange-500';
    return 'border-l-red-500';
  };

  const getStatusColor = (status: Deal['status']) => {
    switch (status) {
      case 'won':
        return 'bg-green-500/20 text-green-400';
      case 'lost':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };
  
  const handleCardClick = () => {
    if (selectMode && onSelect) {
      onSelect(deal.id);
    } else {
      onView(deal);
    }
  };
  
  const isOverdue = () => {
    if (!deal.expected_close_date) return false;
    if (deal.status === 'won' || deal.status === 'lost') return false;
    
    const today = new Date();
    const closeDate = new Date(deal.expected_close_date);
    return closeDate < today;
  };
  
  const getScoreCategory = (score: number) => {
    if (score >= 80) return 'hot';
    if (score >= 60) return 'warm';
    if (score >= 40) return 'cool';
    return 'cold';
  };

  return (
    <div
      ref={drag}
      className={`transition-all duration-200 ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}`}
    >
      <Card 
        className={`p-4 border-l-4 ${getPriorityColor(deal.probability)} hover:shadow-lg cursor-pointer relative group ${
          isSelected ? 'ring-2 ring-accent' : ''
        }`}
        hover
      >
        {/* Selection Checkbox (shown in select mode) */}
        {selectMode && (
          <div className="absolute top-2 right-2 z-10">
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-accent" />
            ) : (
              <Square className="w-4 h-4 text-dark-400" />
            )}
          </div>
        )}
        
        {/* Deal ID Badge */}
        <div className="absolute top-2 left-2 bg-dark-200/70 px-1.5 py-0.5 rounded text-xs font-mono text-dark-400">
          {deal.deal_id}
        </div>
        
        {/* Header */}
        <div className="flex items-start justify-between mb-3 mt-6">
          <div className="flex-1 min-w-0">
            <h3 
              className="font-semibold text-white text-sm truncate cursor-pointer hover:text-accent transition-colors"
              onClick={handleCardClick}
            >
              {deal.title}
            </h3>
          </div>
          
          {!selectMode && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="p-1 rounded hover:bg-dark-200 transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="w-4 h-4 text-dark-400" />
              </button>
              
              {showActions && (
                <div className="absolute right-0 top-8 bg-surface border border-dark-200 rounded-lg shadow-lg z-10 py-1 min-w-32">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(deal);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-dark-200 transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(deal);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-dark-200 transition-colors"
                  >
                    Edit Deal
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(deal.id);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-dark-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Value and Engagement Score */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1 text-white">
            <DollarSign className="w-4 h-4" />
            <span className="font-bold">{formatCurrency(deal.value)}</span>
          </div>
          <DealScoreBadge score={deal.engagement_score || 0} size="sm" />
        </div>

        {/* Company and Contact */}
        {(deal.company || deal.contact) && (
          <div className="space-y-2 mb-3">
            {deal.company && (
              <div className="flex items-center space-x-2 text-dark-400">
                <Building2 className="w-3 h-3" />
                <span className="text-xs truncate">{deal.company.name}</span>
              </div>
            )}
            {deal.contact && (
              <div className="flex items-center space-x-2 text-dark-400">
                <User className="w-3 h-3" />
                <span className="text-xs truncate">
                  {deal.contact.first_name} {deal.contact.last_name}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Status Badge and Expected Close Date */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
            {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
          </span>
          
          {deal.expected_close_date && (
            <div className={`flex items-center space-x-1 text-xs ${isOverdue() ? 'text-red-400' : 'text-dark-400'}`}>
              <Calendar className="w-3 h-3" />
              <span>
                {isOverdue() ? 'Overdue: ' : ''}
                {new Date(deal.expected_close_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Tags (toggleable) */}
        {deal.tags && deal.tags.length > 0 && (
          <div className="mb-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowTags(!showTags);
              }}
              className="flex items-center space-x-1 text-xs text-dark-400 hover:text-white transition-colors"
            >
              <Tag className="w-3 h-3" />
              <span>{showTags ? 'Hide tags' : `${deal.tags.length} tags`}</span>
            </button>
            
            {showTags && (
              <div className="mt-2 flex flex-wrap gap-1">
                {deal.tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-accent/20 text-accent px-1.5 py-0.5 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-dark-500">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(deal.updated_at), { addSuffix: true })}</span>
          </div>
          
          {deal.owner_id && (
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-medium">
                  U
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {!selectMode && (
          <div className="flex items-center space-x-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {deal.contact?.phone && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle phone call
                }}
                className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
              >
                <Phone className="w-3 h-3" />
              </button>
            )}
            {deal.contact?.email && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle email
                }}
                className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
              >
                <Mail className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
        
        {/* Overdue Indicator */}
        {isOverdue() && (
          <div className="absolute top-2 right-2 text-red-400" title="Deal is past expected close date">
            <AlertCircle className="w-4 h-4" />
          </div>
        )}
      </Card>
    </div>
  );
};