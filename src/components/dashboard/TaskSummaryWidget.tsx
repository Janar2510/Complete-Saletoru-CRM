import React from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card } from '../common/Card';

interface TaskSummaryWidgetProps {
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}

export const TaskSummaryWidget: React.FC<TaskSummaryWidgetProps> = ({
  completedTasks,
  pendingTasks,
  overdueTasks,
}) => {
  const totalTasks = completedTasks + pendingTasks + overdueTasks;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card className="p-6 h-full border border-dark-200/50 bg-gradient-to-br from-dark-100/50 to-dark-100/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Task Summary</h3>
        <div className="text-sm text-dark-400">{totalTasks} total</div>
      </div>

      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeDasharray={`${completionRate}, 100`}
              className="transition-all duration-300"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{Math.round(completionRate)}%</div>
              <div className="text-xs text-dark-400">Complete</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-dark-400">Completed</span>
          </div>
          <span className="text-sm font-medium text-white">{completedTasks}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-dark-400">Pending</span>
          </div>
          <span className="text-sm font-medium text-white">{pendingTasks}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-dark-400">Overdue</span>
          </div>
          <span className="text-sm font-medium text-white">{overdueTasks}</span>
        </div>
      </div>
    </Card>
  );
};