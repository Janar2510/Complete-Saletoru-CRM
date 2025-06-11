import React, { useState } from 'react';
import { Bot, X, Sparkles, Tag, Users, Target, ArrowRight } from 'lucide-react';
import { Card } from '../common/Card';

interface GuruImportSuggestionProps {
  entityType: 'contacts' | 'companies' | 'deals';
  importCount: number;
  onClose: () => void;
  onAnalyze: () => void;
}

export const GuruImportSuggestion: React.FC<GuruImportSuggestionProps> = ({
  entityType,
  importCount,
  onClose,
  onAnalyze
}) => {
  const getEntityTypeLabel = () => {
    switch (entityType) {
      case 'contacts': return 'contacts';
      case 'companies': return 'companies';
      case 'deals': return 'deals';
    }
  };
  
  const getIcon = () => {
    switch (entityType) {
      case 'contacts': return <Users className="w-5 h-5 text-white" />;
      case 'companies': return <Building className="w-5 h-5 text-white" />;
      case 'deals': return <Target className="w-5 h-5 text-white" />;
    }
  };
  
  return (
    <Card className="p-4 border-l-4 border-accent">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-purple-500 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-white">Guru Suggestion</h3>
            <p className="text-xs text-dark-400">
              AI-powered data analysis
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-dark-200 transition-colors"
        >
          <X className="w-4 h-4 text-dark-400" />
        </button>
      </div>
      
      <div className="mb-4">
        <p className="text-white">
          You've just imported <span className="font-medium">{importCount} {getEntityTypeLabel()}</span>. 
          Would you like Guru to analyze this data and suggest:
        </p>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 p-2 bg-dark-200/50 rounded-lg">
          <Tag className="w-4 h-4 text-purple-400" />
          <span className="text-white">Automatic tagging based on patterns</span>
        </div>
        
        <div className="flex items-center space-x-2 p-2 bg-dark-200/50 rounded-lg">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span className="text-white">Lead scoring recommendations</span>
        </div>
        
        <div className="flex items-center space-x-2 p-2 bg-dark-200/50 rounded-lg">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-white">Segmentation suggestions</span>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={onAnalyze}
          className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <span>Analyze with Guru</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
};

// Building icon component
const Building: React.FC<{ className?: string }> = ({ className }) => (
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
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
    <path d="M9 22v-4h6v4"></path>
    <path d="M8 6h.01"></path>
    <path d="M16 6h.01"></path>
    <path d="M12 6h.01"></path>
    <path d="M12 10h.01"></path>
    <path d="M12 14h.01"></path>
    <path d="M16 10h.01"></path>
    <path d="M16 14h.01"></path>
    <path d="M8 10h.01"></path>
    <path d="M8 14h.01"></path>
  </svg>
);