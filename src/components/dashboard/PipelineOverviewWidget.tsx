import React, { useState } from 'react';
import { TrendingUp, Users, DollarSign } from 'lucide-react';
import { Card } from '../common/Card';

interface PipelineStage {
  name: string;
  count: number;
  value: number;
  color: string;
}

interface PipelineOverviewWidgetProps {
  stages: PipelineStage[];
}

export const PipelineOverviewWidget: React.FC<PipelineOverviewWidgetProps> = ({ stages }) => {
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  
  const totalValue = stages.reduce((sum, stage) => sum + stage.value, 0);
  const totalDeals = stages.reduce((sum, stage) => sum + stage.count, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="p-6 h-full border border-dark-200/50 bg-gradient-to-br from-dark-100/50 to-dark-100/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Pipeline Overview</h3>
        <TrendingUp className="w-5 h-5 text-accent" />
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalDeals}</div>
            <div className="text-xs text-dark-400 flex items-center justify-center">
              <Users className="w-3 h-3 mr-1" />
              Total Deals
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</div>
            <div className="text-xs text-dark-400 flex items-center justify-center">
              <DollarSign className="w-3 h-3 mr-1" />
              Pipeline Value
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {stages.map((stage, index) => {
            const percentage = totalDeals > 0 ? (stage.count / totalDeals) * 100 : 0;
            return (
              <div
                key={stage.name}
                className="relative"
                onMouseEnter={() => setHoveredStage(index)}
                onMouseLeave={() => setHoveredStage(null)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-dark-400">{stage.name}</span>
                  <span className="text-sm font-medium text-white">{stage.count}</span>
                </div>
                <div className="w-full bg-dark-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300`}
                    style={{ 
                      width: `${percentage}%`,
                      background: `linear-gradient(90deg, ${stage.color}88, ${stage.color})`,
                      boxShadow: `0 0 8px ${stage.color}50`
                    }}
                  />
                </div>
                
                {hoveredStage === index && (
                  <div className="absolute top-full left-0 mt-2 bg-surface border border-dark-200 rounded-lg p-3 shadow-lg z-10 min-w-48 backdrop-blur-sm">
                    <div className="text-sm font-medium text-white mb-1">{stage.name}</div>
                    <div className="text-xs text-dark-400 space-y-1">
                      <div>Deals: {stage.count}</div>
                      <div>Value: {formatCurrency(stage.value)}</div>
                      <div>Percentage: {percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};