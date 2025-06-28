import React from 'react';
import { Card } from '@/components/common/Card';
import { ArrowRight } from 'lucide-react';

interface Metric {
  label: string;
  value: number;
  previousValue: number;
  unit: string;
  icon: React.ElementType;
  color: string;
}

interface ProductivityWidgetProps {
  metrics: Metric[];
  onViewInsights: () => void;
}

export const ProductivityWidget: React.FC<ProductivityWidgetProps> = ({
  metrics,
  onViewInsights,
}) => {
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold text-white mb-4">Productivity</h2>
      <div className="space-y-4">
        {metrics.map((metric, index) => {
          const change = metric.value - metric.previousValue;
          const changeSymbol = change > 0 ? '+' : '';
          return (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-md backdrop-blur-md"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${metric.color}`}>
                  <metric.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-medium">{metric.label}</div>
                  <div className="text-xs text-dark-400">
                    {metric.value} {metric.unit} ({changeSymbol}
                    {change} {metric.unit} vs last)
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={onViewInsights}
        className="mt-4 flex items-center text-accent hover:underline text-sm"
      >
        View Insights <ArrowRight className="w-4 h-4 ml-1" />
      </button>
    </Card>
  );
};
