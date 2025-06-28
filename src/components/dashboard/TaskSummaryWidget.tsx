
import React from 'react';
import { Card } from '@/components/common/Card';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

type Props = {
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
};

export const TaskSummaryWidget: React.FC<Props> = ({ completedTasks, pendingTasks, overdueTasks }) => {
  return (
    <Card className="p-4 bg-gradient-to-br from-dark-300 to-dark-100 border border-dark-200/40 text-white">
      <h3 className="text-lg font-semibold mb-4">Task Summary</h3>
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span>Completed</span>
          </div>
          <span className="font-medium">{completedTasks}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span>Pending</span>
          </div>
          <span className="font-medium">{pendingTasks}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span>Overdue</span>
          </div>
          <span className="font-medium">{overdueTasks}</span>
        </div>
      </div>
    </Card>
  );
};