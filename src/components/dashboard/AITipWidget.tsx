import React, { useState } from 'react';
import { Bot, X, Bookmark, Lightbulb, TrendingUp, Users, Target } from 'lucide-react';
import { Card } from '../common/Card';

interface AITip {
  id: string;
  title: string;
  description: string;
  category: 'performance' | 'pipeline' | 'contacts' | 'general';
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
}

interface AITipWidgetProps {
  tip: AITip;
  onDismiss: (tipId: string) => void;
  onSave: (tipId: string) => void;
}

const categoryIcons = {
  performance: TrendingUp,
  pipeline: Target,
  contacts: Users,
  general: Lightbulb,
};

const categoryColors = {
  performance: 'text-green-400',
  pipeline: 'text-blue-400',
  contacts: 'text-purple-400',
  general: 'text-yellow-400',
};

export const AITipWidget: React.FC<AITipWidgetProps> = ({ tip, onDismiss, onSave }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const CategoryIcon = categoryIcons[tip.category];

  const handleSave = () => {
    setIsSaved(true);
    onSave(tip.id);
  };

  const handleDismiss = () => {
    onDismiss(tip.id);
  };

  return (
    <Card className="p-6 h-full relative overflow-hidden border border-dark-200/50 bg-gradient-to-br from-dark-100/50 to-dark-100/30">
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent/20 to-purple-500/20 rounded-full -translate-y-10 translate-x-10" />
      
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Insight</h3>
            <div className="flex items-center space-x-1">
              <CategoryIcon className={`w-3 h-3 ${categoryColors[tip.category]}`} />
              <span className="text-xs text-dark-400 capitalize">{tip.category}</span>
              {tip.priority === 'high' && (
                <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                  High Priority
                </span>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="text-dark-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-white mb-2">{tip.title}</h4>
        <p className={`text-sm text-dark-400 ${isExpanded ? '' : 'line-clamp-3'}`}>
          {tip.description}
        </p>
        {tip.description.length > 100 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-accent hover:text-accent/80 mt-1"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {tip.actionable && (
          <button className="text-sm bg-gradient-to-r from-accent to-purple-500 hover:opacity-90 text-white px-3 py-1.5 rounded-lg shadow-md transition-colors">
            Take Action
          </button>
        )}
        <button
          onClick={handleSave}
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
            isSaved
              ? 'bg-green-500/20 text-green-400'
              : 'bg-dark-200 text-dark-400 hover:text-white hover:bg-dark-300'
          }`}
        >
          <Bookmark className="w-3 h-3" />
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </button>
      </div>
    </Card>
  );
};