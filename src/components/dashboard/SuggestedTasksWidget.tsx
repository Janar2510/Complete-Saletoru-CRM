import React from 'react';
import { Card } from '@/components/common/Card';
import { CheckCircle, PlusCircle, ArrowRight } from 'lucide-react';

interface SuggestedTasksWidgetProps {
  onCreateTask: () => void;
  onViewAllTasks: () => void;
  onShowAllSuggestions: () => void;
}

export const SuggestedTasksWidget: React.FC<SuggestedTasksWidgetProps> = ({
  onCreateTask,
  onViewAllTasks,
  onShowAllSuggestions,
}) => {
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold text-white mb-4">Suggested Tasks</h2>

      <div className="space-y-3">
        <button
          onClick={onCreateTask}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-dark-200 hover:bg-dark-300 text-white transition-all"
        >
          <span className="flex items-center space-x-2">
            <PlusCircle className="w-4 h-4" />
            <span>Create Task</span>
          </span>
        </button>

        <button
          onClick={onShowAllSuggestions}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-dark-200 hover:bg-dark-300 text-white transition-all"
        >
          <span className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>View AI Suggestions</span>
          </span>
        </button>

        <button
          onClick={onViewAllTasks}
          className="text-sm text-accent hover:underline flex items-center"
        >
          View All Tasks <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </Card>
  );
};
