import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { AITaskAPI } from '../../lib/ai-task-api';
import type { SuggestedTask } from '../../types/ai';

export default function SuggestedTasksWidget() {
  const [tasks, setTasks] = useState<SuggestedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const suggestedTasks = await AITaskAPI.getSuggestedTasks();
      setTasks(suggestedTasks);
    } catch (error) {
      console.error('Error loading suggested tasks:', error);
      setError('Failed to load suggested tasks. Using default suggestions.');
      // Set some default tasks as fallback
      setTasks([
        {
          id: 'fallback-1',
          title: 'Review your pipeline',
          description: 'Check for deals that need attention',
          priority: 'medium',
          category: 'admin',
          estimatedTime: 15,
          reasoning: 'Regular pipeline reviews help maintain momentum'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCompleteTask = async (taskId: string) => {
    try {
      await AITaskAPI.markTaskCompleted(taskId);
      setCompletedTasks(prev => new Set([...prev, taskId]));
      // Remove completed task after animation
      setTimeout(() => {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        setCompletedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }, 1000);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleDismissTask = async (taskId: string) => {
    try {
      await AITaskAPI.dismissTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error dismissing task:', error);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-gray-300 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Suggested Tasks</h3>
          <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Suggested Tasks</h3>
        <button
          onClick={loadTasks}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh tasks"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No suggested tasks at the moment</p>
            <p className="text-sm">Check back later for AI-generated recommendations</p>
          </div>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className={`border-l-4 p-4 rounded-r-lg transition-all duration-300 ${
                completedTasks.has(task.id) 
                  ? 'opacity-50 transform scale-95' 
                  : getPriorityColor(task.priority)
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getPriorityIcon(task.priority)}
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <span className="text-xs text-gray-500">
                      ~{task.estimatedTime}m
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  {task.reasoning && (
                    <p className="text-xs text-gray-500 italic">
                      💡 {task.reasoning}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="p-1 text-green-600 hover:text-green-700 transition-colors"
                    title="Mark as complete"
                    disabled={completedTasks.has(task.id)}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDismissTask(task.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Dismiss task"
                    disabled={completedTasks.has(task.id)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {tasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Tasks are AI-generated based on your pipeline activity
          </p>
        </div>
      )}
    </div>
  );
}

export { SuggestedTasksWidget }