import React from 'react';
import { 
  AlertCircle, 
  X, 
  Target, 
  CheckCircle, 
  User, 
  ArrowRight,
  Clock
} from 'lucide-react';
import { Card } from '../common/Card';
import { Bottleneck } from '../../types/ai';
import { formatDistanceToNow } from 'date-fns';

interface BottleneckPanelProps {
  bottlenecks: Bottleneck[];
  onClose: () => void;
  onViewEntity: (type: string, id: string) => void;
  onCreateTask: (bottleneck: Bottleneck) => void;
}

export const BottleneckPanel: React.FC<BottleneckPanelProps> = ({
  bottlenecks,
  onClose,
  onViewEntity,
  onCreateTask
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 border-red-400';
      case 'medium':
        return 'text-yellow-400 border-yellow-400';
      case 'low':
        return 'text-green-400 border-green-400';
      default:
        return 'text-dark-400 border-dark-400';
    }
  };

  const getTypeIcon = (type: Bottleneck['type']) => {
    switch (type) {
      case 'deal':
        return <Target className="w-4 h-4 text-blue-400" />;
      case 'task':
        return <CheckCircle className="w-4 h-4 text-purple-400" />;
      case 'contact':
        return <User className="w-4 h-4 text-green-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-dark-400" />;
    }
  };

  return (
    <Card className="p-4 border-l-4 border-red-400">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-red-400 rounded-full flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-white">Bottlenecks Detected</h3>
            <p className="text-xs text-dark-400">
              {bottlenecks.length} items that may be blocking your progress
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
      
      {bottlenecks.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {bottlenecks.map(bottleneck => (
            <div 
              key={bottleneck.id} 
              className="p-3 rounded-lg bg-dark-200/50 border border-dark-300 hover:border-dark-200 transition-colors"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  {getTypeIcon(bottleneck.type)}
                </div>
                
                <div className="ml-3 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-white">{bottleneck.title}</h4>
                      <p className="text-sm text-dark-400 mt-1">{bottleneck.description}</p>
                    </div>
                    
                    <div className={`px-2 py-0.5 text-xs border rounded-full ${getPriorityColor(bottleneck.priority)}`}>
                      {bottleneck.priority}
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center text-xs text-dark-400">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Idle for {bottleneck.idle_days} days</span>
                  </div>
                  
                  <div className="mt-2 flex justify-end space-x-2">
                    <button
                      onClick={() => onViewEntity(bottleneck.type, bottleneck.entity_id)}
                      className="text-xs bg-dark-300 hover:bg-dark-400 text-white px-2 py-1 rounded transition-colors flex items-center"
                    >
                      <ArrowRight className="w-3 h-3 mr-1" />
                      <span>View {bottleneck.type}</span>
                    </button>
                    
                    <button
                      onClick={() => onCreateTask(bottleneck)}
                      className="text-xs bg-accent hover:bg-accent/80 text-white px-2 py-1 rounded transition-colors"
                    >
                      Create Task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No bottlenecks detected</p>
          <p className="text-dark-400 text-sm">
            Great job! Your workflow is running smoothly.
          </p>
        </div>
      )}
    </Card>
  );
};