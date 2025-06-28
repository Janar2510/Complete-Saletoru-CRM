import React from 'react';
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
  return (
    <Card className="p-4 border border-dark-200/50">
      <h3 className="text-lg font-semibold text-white mb-4">Pipeline Overview</h3>
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={index} className="flex justify-between items-center px-3 py-2 rounded-lg bg-gradient-to-r from-dark-300 to-dark-100 hover:from-dark-200 transition-all duration-200">
            <div className="flex items-center space-x-3">
              <span className={\`w-3 h-3 rounded-full \${stage.color}\`}></span>
              <span className="text-white font-medium">{stage.name}</span>
            </div>
            <div className="text-sm text-dark-300">
              <span>{stage.count} deals</span> · <span>${stage.value.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};