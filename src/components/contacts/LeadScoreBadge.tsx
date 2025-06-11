import React from 'react';

interface LeadScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const LeadScoreBadge: React.FC<LeadScoreBadgeProps> = ({
  score,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  // Get color based on score
  const getColor = () => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get label based on score
  const getLabel = () => {
    if (score >= 70) return 'Hot';
    if (score >= 40) return 'Warm';
    return 'Cold';
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-1.5 py-0.5';
      case 'lg':
        return 'text-sm px-3 py-1.5';
      default:
        return 'text-xs px-2 py-1';
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div 
        className={`rounded-full font-medium ${getSizeClasses()} flex items-center justify-center ${getColor()} text-white`}
      >
        {score}
      </div>
      {showLabel && (
        <span className={`text-${size === 'sm' ? 'xs' : 'sm'} text-dark-400`}>
          {getLabel()}
        </span>
      )}
    </div>
  );
};