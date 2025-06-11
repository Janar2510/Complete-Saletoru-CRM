import React from 'react';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Calendar, 
  User, 
  Target, 
  MoreHorizontal,
  Edit,
  Trash2,
  Bell,
  Repeat
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Task } from './TaskModal';

interface TaskItemProps {
  task: Task;
  onToggleStatus: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  users: any[];
  deals: any[];
  contacts: any[];
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleStatus,
  onEdit,
  onDelete,
  users,
  deals,
  contacts
}) => {
  const [showActions, setShowActions] = React.useState(false);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-dark-300';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'in_progress':
        return 'text-blue-400';
      case 'cancelled':
        return 'text-red-400';
      default:
        return 'text-dark-400';
    }
  };
  
  const isOverdue = () => {
    if (!task.due_date) return false;
    if (task.status === 'completed' || task.status === 'cancelled') return false;
    
    const dueDate = new Date(task.due_date);
    if (task.due_time) {
      const [hours, minutes] = task.due_time.split(':').map(Number);
      dueDate.setHours(hours, minutes);
    }
    
    return dueDate < new Date();
  };
  
  const formatDueDate = () => {
    if (!task.due_date) return 'No due date';
    
    const dueDate = new Date(task.due_date);
    if (task.due_time) {
      const [hours, minutes] = task.due_time.split(':').map(Number);
      dueDate.setHours(hours, minutes);
    }
    
    return formatDistanceToNow(dueDate, { addSuffix: true });
  };
  
  const getAssignedUser = () => {
    if (!task.assigned_to) return null;
    return users.find(user => user.id === task.assigned_to);
  };
  
  const getRelatedDeal = () => {
    if (!task.related_deal_id) return null;
    return deals.find(deal => deal.id === task.related_deal_id);
  };
  
  const getRelatedContact = () => {
    if (!task.related_contact_id) return null;
    return contacts.find(contact => contact.id === task.related_contact_id);
  };
  
  const assignedUser = getAssignedUser();
  const relatedDeal = getRelatedDeal();
  const relatedContact = getRelatedContact();
  
  return (
    <div 
      className={`p-4 bg-dark-200/50 rounded-lg border-l-4 ${getPriorityColor(task.priority)} hover:bg-dark-200 transition-colors relative group`}
    >
      <div className="flex items-start space-x-3">
        <button
          onClick={() => onToggleStatus(task.id)}
          className={`mt-0.5 transition-colors ${
            task.status === 'completed' ? 'text-green-400' : 'text-dark-400 hover:text-white'
          }`}
        >
          {task.status === 'completed' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className={`font-medium ${
              task.status === 'completed' ? 'text-dark-400 line-through' : 'text-white'
            }`}>
              {task.title}
            </h3>
            
            <div className="flex items-center space-x-1">
              {task.is_recurring && (
                <Repeat className="w-4 h-4 text-purple-400" title="Recurring Task" />
              )}
              
              {task.reminder && (
                <Bell className="w-4 h-4 text-yellow-400" title="Reminder Set" />
              )}
              
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 rounded hover:bg-dark-300 transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="w-4 h-4 text-dark-400" />
              </button>
            </div>
          </div>
          
          {task.description && (
            <p className={`text-sm mt-1 ${
              task.status === 'completed' ? 'text-dark-500 line-through' : 'text-dark-400'
            }`}>
              {task.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center mt-2 gap-3 text-xs">
            {task.due_date && (
              <div className={`flex items-center space-x-1 ${
                isOverdue() ? 'text-red-400' : 'text-dark-400'
              }`}>
                <Calendar className="w-3 h-3" />
                <span>{formatDueDate()}</span>
              </div>
            )}
            
            {task.due_time && (
              <div className="flex items-center space-x-1 text-dark-400">
                <Clock className="w-3 h-3" />
                <span>{task.due_time}</span>
              </div>
            )}
            
            {assignedUser && (
              <div className="flex items-center space-x-1 text-dark-400">
                <User className="w-3 h-3" />
                <span>{assignedUser.raw_user_meta_data?.full_name || assignedUser.email}</span>
              </div>
            )}
            
            {relatedDeal && (
              <div className="flex items-center space-x-1 text-dark-400">
                <Target className="w-3 h-3" />
                <span>{relatedDeal.title}</span>
              </div>
            )}
            
            {relatedContact && (
              <div className="flex items-center space-x-1 text-dark-400">
                <User className="w-3 h-3" />
                <span>{relatedContact.first_name} {relatedContact.last_name}</span>
              </div>
            )}
            
            <div className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(task.status)}`}>
              {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Menu */}
      {showActions && (
        <div className="absolute right-2 top-10 bg-surface border border-dark-200 rounded-lg shadow-lg z-10 py-1 min-w-32">
          <button
            onClick={() => {
              setShowActions(false);
              onEdit(task);
            }}
            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-dark-200 transition-colors flex items-center space-x-2"
          >
            <Edit className="w-4 h-4 text-dark-400" />
            <span>Edit Task</span>
          </button>
          
          <button
            onClick={() => {
              setShowActions(false);
              onDelete(task.id);
            }}
            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-dark-200 transition-colors flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Task</span>
          </button>
        </div>
      )}
    </div>
  );
};