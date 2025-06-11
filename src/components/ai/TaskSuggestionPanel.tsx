import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  User, 
  Target, 
  Calendar, 
  Plus, 
  X, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Card } from '../common/Card';
import { TaskSuggestion } from '../../types/ai';
import { formatDistanceToNow } from 'date-fns';

interface TaskSuggestionPanelProps {
  suggestions: TaskSuggestion[];
  onClose: () => void;
  onCreateTask: (task: TaskSuggestion) => void;
  onCreateAllTasks: (tasks: TaskSuggestion[]) => void;
}

export const TaskSuggestionPanel: React.FC<TaskSuggestionPanelProps> = ({
  suggestions,
  onClose,
  onCreateTask,
  onCreateAllTasks
}) => {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const toggleTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const selectAll = () => {
    if (selectedTasks.size === suggestions.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(suggestions.map(task => task.id)));
    }
  };

  const handleCreateSelected = () => {
    const tasksToCreate = suggestions.filter(task => selectedTasks.has(task.id));
    onCreateAllTasks(tasksToCreate);
  };

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

  const getTypeIcon = (type: TaskSuggestion['type']) => {
    switch (type) {
      case 'follow_up':
        return <ArrowRight className="w-4 h-4 text-blue-400" />;
      case 'check_in':
        return <User className="w-4 h-4 text-green-400" />;
      case 'prepare':
        return <CheckCircle className="w-4 h-4 text-purple-400" />;
      case 'review':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-dark-400" />;
    }
  };

  return (
    <Card className="p-4 border-l-4 border-accent">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-white">Suggested Tasks</h3>
            <p className="text-xs text-dark-400">
              {suggestions.length} tasks based on your current workload
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
      
      {suggestions.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={selectAll}
              className="text-xs text-accent hover:text-accent/80 transition-colors"
            >
              {selectedTasks.size === suggestions.length ? 'Deselect All' : 'Select All'}
            </button>
            
            <button
              onClick={handleCreateSelected}
              disabled={selectedTasks.size === 0}
              className="text-xs bg-accent hover:bg-accent/80 disabled:opacity-50 text-white px-2 py-1 rounded transition-colors flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Create Selected ({selectedTasks.size})</span>
            </button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {suggestions.map(task => (
              <div 
                key={task.id} 
                className={`p-3 rounded-lg border transition-colors ${
                  selectedTasks.has(task.id) 
                    ? 'bg-accent/10 border-accent' 
                    : 'bg-dark-200/50 border-dark-300 hover:border-dark-200'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={() => toggleTask(task.id)}
                      className="rounded border-dark-300 text-accent focus:ring-accent"
                    />
                  </div>
                  
                  <div className="ml-3 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white flex items-center">
                          {getTypeIcon(task.type)}
                          <span className="ml-2">{task.title}</span>
                        </h4>
                        {task.description && (
                          <p className="text-sm text-dark-400 mt-1">{task.description}</p>
                        )}
                      </div>
                      
                      <div className={`px-2 py-0.5 text-xs border rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </div>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {task.due_date && (
                        <div className="flex items-center text-dark-400">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>Due {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}</span>
                        </div>
                      )}
                      
                      {task.related_deal && (
                        <div className="flex items-center text-dark-400">
                          <Target className="w-3 h-3 mr-1" />
                          <span>{task.related_deal.title}</span>
                        </div>
                      )}
                      
                      {task.related_contact && (
                        <div className="flex items-center text-dark-400">
                          <User className="w-3 h-3 mr-1" />
                          <span>{task.related_contact.name}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-dark-500">{task.reason}</span>
                      
                      <button
                        onClick={() => onCreateTask(task)}
                        className="text-xs bg-dark-300 hover:bg-dark-400 text-white px-2 py-1 rounded transition-colors"
                      >
                        Create Task
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-6">
          <Clock className="w-12 h-12 text-dark-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No task suggestions</p>
          <p className="text-dark-400 text-sm">
            Great job! You're all caught up on your tasks.
          </p>
        </div>
      )}
    </Card>
  );
};