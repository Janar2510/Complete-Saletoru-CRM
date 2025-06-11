import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '../common/Card';

interface PerformanceMetric {
  label: string;
  current: number;
  previous: number;
  format: 'currency' | 'number' | 'percentage';
}

interface PerformanceWidgetProps {
  metrics: PerformanceMetric[];
  period: string;
}

export const PerformanceWidget: React.FC<PerformanceWidgetProps> = ({ metrics, period }) => {
  const formatValue = (value: number, format: PerformanceMetric['format']) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 0, trend: 'neutral' as const };
    const percentage = ((current - previous) / previous) * 100;
    const trend = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
    return { percentage: Math.abs(percentage), trend };
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3" />;
      case 'down':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-dark-400';
    }
  };

  return (
    <Card className="p-6 h-full border border-dark-200/50 bg-gradient-to-br from-dark-100/50 to-dark-100/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Performance</h3>
        <span className="text-sm text-dark-400">{period}</span>
      </div>

      <div className="space-y-4">
        {metrics.map((metric, index) => {
          const change = calculateChange(metric.current, metric.previous);
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">{metric.label}</span>
                <div className={`flex items-center space-x-1 text-xs ${getTrendColor(change.trend)}`}>
                  {getTrendIcon(change.trend)}
                  <span>{change.percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold text-white">
                  {formatValue(metric.current, metric.format)}
                </span>
                <span className="text-sm text-dark-500">
                  vs {formatValue(metric.previous, metric.format)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-dark-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-400">Overall Trend</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-medium">Positive</span>
          </div>
        </div>
      </div>
    </Card>
  );
};