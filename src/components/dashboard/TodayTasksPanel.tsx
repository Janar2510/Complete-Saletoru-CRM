import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { Card } from '@/components/common/Card';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueTime?: string;
}

interface TodayTasksPanelProps {
  tasks: Task[];
  onTaskToggle: (taskId: string) => void;
  onAddTask: () => void;
}

export const TodayTasksPanel: React.FC<TodayTasksPanelProps> = ({ tasks, onTaskToggle, onAddTask }) => {
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <Card className="p-4 bg-dark-100 border border-dark-300/50 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Today's Tasks</h2>
        <button
          onClick={onAddTask}
          className="text-sm text-accent hover:underline"
        >
          + Add Task
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {sortedTasks.map(task => (
          <div
            key={task.id}
            className="flex justify-between items-start p-3 rounded-lg bg-dark-200 hover:bg-dark-300 transition-colors cursor-pointer"
            onClick={() => onTaskToggle(task.id)}
          >
            <div className="flex items-start space-x-3">
              <div className="mt-1">
                {task.completed ? (
                  <CheckCircle className="text-green-400 w-5 h-5" />
                ) : (
                  <Circle className="text-gray-400 w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className={`text-sm font-medium ${task.completed ? 'line-through text-dark-400' : 'text-white'}`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-xs text-dark-400 mt-1">{task.description}</p>
                )}
              </div>
            </div>
            {task.dueTime && (
              <div className="text-xs text-dark-400 mt-1 whitespace-nowrap">{task.dueTime}</div>
            )}
          </div>
        ))}

        {tasks.length === 0 && (
          <p className="text-sm text-dark-400 text-center">No tasks for today 🎉</p>
        )}
      </div>
    </Card>
  );
};

export default TodayTasksPanel;
