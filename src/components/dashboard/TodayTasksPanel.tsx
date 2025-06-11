import React, { useState } from 'react';
import { CheckCircle, Circle, Clock, Plus, Calendar } from 'lucide-react';
import { Card } from '../common/Card';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueTime?: string;
  dealId?: string;
}

interface TodayTasksPanelProps {
  tasks: Task[];
  onTaskToggle: (taskId: string) => void;
  onAddTask: () => void;
}

export const TodayTasksPanel: React.FC<TodayTasksPanelProps> = ({
  tasks,
  onTaskToggle,
  onAddTask,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'pending':
        return !task.completed;
      case 'completed':
        return task.completed;
      default:
        return true;
    }
  });

  const completedCount = tasks.filter(task => task.completed).length;
  const completionRate = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      default:
        return 'border-l-green-500';
    }
  };

  return (
    <Card className="p-6 border border-dark-200/50 bg-gradient-to-br from-dark-100/50 to-dark-100/30">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 mr-2" />
            <span>Today's Tasks</span>
          </h2>
          <p className="text-sm text-dark-400">
            {completedCount} of {tasks.length} completed ({Math.round(completionRate)}%)
          </p>
        </div>
        <button
          onClick={onAddTask}
          className="bg-gradient-to-r from-accent to-purple-500 hover:opacity-90 text-white p-2 rounded-lg transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex space-x-2 mb-4">
        {(['all', 'pending', 'completed'] as const).map(filterType => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${
              filter === filterType
                ? 'bg-gradient-to-r from-accent to-purple-500 text-white shadow-md'
                : 'bg-dark-200 text-dark-400 hover:text-white hover:bg-dark-300'
            }`}
          >
            {filterType}
          </button>
        ))}
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-dark-400 mx-auto mb-3" />
            <p className="text-dark-400">
              {filter === 'all' ? 'No tasks for today' : `No ${filter} tasks`}
            </p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              className={`p-3 bg-dark-200/50 rounded-lg border-l-4 ${getPriorityColor(task.priority)} transition-all duration-200 hover:bg-dark-200 backdrop-blur-sm`}
            >
              <div className="flex items-start space-x-3">
                <button
                  onClick={() => onTaskToggle(task.id)}
                  className={`mt-0.5 transition-colors ${
                    task.completed ? 'text-green-400' : 'text-dark-400 hover:text-white'
                  }`}
                >
                  {task.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    task.completed ? 'text-dark-400 line-through' : 'text-white'
                  }`}>
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-sm text-dark-400 mt-1">{task.description}</p>
                  )}
                  <div className="flex items-center space-x-3 mt-2 text-xs text-dark-500">
                    {task.dueTime && (
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{task.dueTime}</span>
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded capitalize ${
                      task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};