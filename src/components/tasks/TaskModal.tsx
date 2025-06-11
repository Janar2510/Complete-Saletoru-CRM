import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Calendar, 
  User, 
  Target, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Bell,
  Repeat
} from 'lucide-react';
import { Card } from '../common/Card';
import { supabase } from '../../lib/supabase';

export interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  due_time?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string;
  related_deal_id?: string;
  related_contact_id?: string;
  is_recurring?: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrence_end_date?: string;
  recurrence_custom?: string;
  reminder?: boolean;
  reminder_time?: number; // minutes before due
  created_at?: string;
  created_by?: string;
}

interface TaskModalProps {
  task?: Task;
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  isNew: boolean;
  users: any[];
  deals: any[];
  contacts: any[];
}

export const TaskModal: React.FC<TaskModalProps> = ({ 
  task, 
  onClose, 
  onSave, 
  isNew,
  users,
  deals,
  contacts
}) => {
  const [formData, setFormData] = useState<Partial<Task>>(
    task || {
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      is_recurring: false,
      reminder: false
    }
  );
  
  const [showRecurring, setShowRecurring] = useState(!!task?.is_recurring);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // If editing a task with a due date but no time, set default time to 9:00 AM
    if (task?.due_date && !task?.due_time) {
      setFormData(prev => ({
        ...prev,
        due_time: '09:00'
      }));
    }
  }, [task]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Task title is required';
    }
    
    if (showRecurring && !formData.recurrence_pattern) {
      newErrors.recurrence_pattern = 'Recurrence pattern is required for recurring tasks';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // If not recurring, remove recurring fields
    const taskData = { ...formData };
    if (!showRecurring) {
      taskData.is_recurring = false;
      taskData.recurrence_pattern = undefined;
      taskData.recurrence_end_date = undefined;
      taskData.recurrence_custom = undefined;
    } else {
      taskData.is_recurring = true;
    }
    
    // If no reminder, remove reminder fields
    if (!taskData.reminder) {
      taskData.reminder_time = undefined;
    }
    
    try {
      setSaving(true);
      await onSave(taskData);
    } catch (error) {
      console.error('Error saving task:', error);
      setErrors({ submit: 'Failed to save task. Please try again.' });
      setSaving(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-dark-300/50 text-dark-400 border-dark-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
        <div className="flex items-center justify-between p-6 border-b border-dark-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              {isNew ? 'Create New Task' : 'Edit Task'}
            </h2>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{errors.submit}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white mb-2">
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-dark-200/70 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                  errors.title ? 'border-red-500' : 'border-dark-300'
                }`}
                placeholder="Enter task title"
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date || ''}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 bg-dark-200/70 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Due Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="time"
                  name="due_time"
                  value={formData.due_time || ''}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 bg-dark-200/70 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['low', 'medium', 'high'].map((priority) => (
                  <label 
                    key={priority}
                    className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-colors ${
                      formData.priority === priority 
                        ? getPriorityColor(priority) 
                        : 'border-dark-300 bg-dark-200/50 text-dark-400 hover:bg-dark-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={priority}
                      checked={formData.priority === priority}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="capitalize">{priority}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-200/70 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Assigned To
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                <select
                  name="assigned_to"
                  value={formData.assigned_to || ''}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 bg-dark-200/70 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.raw_user_meta_data?.full_name || user.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Related Deal
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                <select
                  name="related_deal_id"
                  value={formData.related_deal_id || ''}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 bg-dark-200/70 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">None</option>
                  {deals.map(deal => (
                    <option key={deal.id} value={deal.id}>
                      {deal.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Related Contact
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                <select
                  name="related_contact_id"
                  value={formData.related_contact_id || ''}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 bg-dark-200/70 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">None</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 bg-dark-200/70 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Enter task description"
              />
            </div>
            
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-dark-400" />
                  <span className="text-white">Set Reminder</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="reminder"
                    checked={formData.reminder}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>
              
              {formData.reminder && (
                <div className="pl-7">
                  <label className="block text-sm font-medium text-white mb-2">
                    Remind me
                  </label>
                  <select
                    name="reminder_time"
                    value={formData.reminder_time || 15}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-dark-200/70 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value={5}>5 minutes before</option>
                    <option value={15}>15 minutes before</option>
                    <option value={30}>30 minutes before</option>
                    <option value={60}>1 hour before</option>
                    <option value={120}>2 hours before</option>
                    <option value={1440}>1 day before</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Repeat className="w-5 h-5 text-dark-400" />
                  <span className="text-white">Recurring Task</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRecurring}
                    onChange={(e) => setShowRecurring(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>
              
              {showRecurring && (
                <div className="pl-7 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Recurrence Pattern
                    </label>
                    <select
                      name="recurrence_pattern"
                      value={formData.recurrence_pattern || ''}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 bg-dark-200/70 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent ${
                        errors.recurrence_pattern ? 'border-red-500' : 'border-dark-300'
                      }`}
                    >
                      <option value="">Select pattern</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom</option>
                    </select>
                    {errors.recurrence_pattern && (
                      <p className="text-red-400 text-sm mt-1">{errors.recurrence_pattern}</p>
                    )}
                  </div>
                  
                  {formData.recurrence_pattern === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Custom Pattern
                      </label>
                      <input
                        type="text"
                        name="recurrence_custom"
                        value={formData.recurrence_custom || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-dark-200/70 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="e.g., Every 2 weeks on Monday"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="recurrence_end_date"
                      value={formData.recurrence_end_date || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-dark-200/70 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-dark-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-accent hover:bg-accent/80 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isNew ? 'Create Task' : 'Update Task'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};