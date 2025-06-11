import React from 'react';
import { TrendingUp, ArrowUp, ArrowDown, Minus, Clock, CheckCircle, Target } from 'lucide-react';
import { Card } from '../common/Card';

interface ProductivityMetric {
  label: string;
  value: number;
  previousValue: number;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface ProductivityWidgetProps {
  metrics: ProductivityMetric[];
  onViewInsights: () => void;
}

export const ProductivityWidget: React.FC<ProductivityWidgetProps> = ({
  metrics,
  onViewInsights
}) => {
  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const getChangeIcon = (current: number, previous: number) => {
    const change = getChangePercentage(current, previous);
    
    if (change > 0) {
      return <ArrowUp className="w-3 h-3 text-green-400" />;
    } else if (change < 0) {
      return <ArrowDown className="w-3 h-3 text-red-400" />;
    } else {
      return <Minus className="w-3 h-3 text-dark-400" />;
    }
  };

  const getChangeColor = (current: number, previous: number) => {
    const change = getChangePercentage(current, previous);
    
    if (change > 0) {
      return 'text-green-400';
    } else if (change < 0) {
      return 'text-red-400';
    } else {
      return 'text-dark-400';
    }
  };

  return (
    <Card className="p-6 h-full border border-dark-200/50 bg-gradient-to-br from-dark-100/50 to-dark-100/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-white">Productivity</h3>
        </div>
        
        <button
          onClick={onViewInsights}
          className="text-xs text-accent hover:text-accent/80 transition-colors"
        >
          View Insights
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const change = getChangePercentage(metric.value, metric.previousValue);
          
          return (
            <div key={index} className="bg-dark-200/50 p-3 rounded-lg backdrop-blur-sm border border-dark-300/50">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-8 h-8 ${metric.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-dark-400 text-sm">{metric.label}</span>
              </div>
              
              <div className="flex items-baseline justify-between">
                <div className="text-xl font-bold text-white">
                  {metric.value}{metric.unit && <span className="text-sm ml-1">{metric.unit}</span>}
                </div>
                
                <div className={`flex items-center ${getChangeColor(metric.value, metric.previousValue)}`}>
                  {getChangeIcon(metric.value, metric.previousValue)}
                  <span className="text-xs ml-1">{Math.abs(change)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-dark-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-400">Weekly Progress</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400">On Track</span>
          </div>
        </div>
      </div>
    </Card>
  );
};