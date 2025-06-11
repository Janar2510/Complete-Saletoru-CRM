import React, { useState } from 'react';
import { Bot, Lightbulb, X } from 'lucide-react';

interface GuruSuggestionProps {
  title: string;
  description: string;
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  onClose: () => void;
}

export const GuruSuggestion: React.FC<GuruSuggestionProps> = ({
  title,
  description,
  suggestions,
  onSuggestionClick,
  onClose
}) => {
  return (
    <div className="bg-dark-200/80 backdrop-blur-sm border border-dark-300 rounded-lg p-4 shadow-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-purple-500 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-white">{title}</h3>
            <p className="text-xs text-dark-400">{description}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-dark-300 transition-colors"
        >
          <X className="w-4 h-4 text-dark-400" />
        </button>
      </div>
      
      <div className="space-y-2 mt-3">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="w-full text-left p-2 rounded-lg bg-dark-300/50 hover:bg-dark-300 text-white text-sm transition-colors flex items-center space-x-2"
          >
            <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span>{suggestion}</span>
          </button>
        ))}
      </div>
    </div>
  );
};