import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  CheckCircle, 
  Clock, 
  ArrowUp, 
  ArrowDown,
  User,
  Target,
  RefreshCw
} from 'lucide-react';
import { Card } from '../common/Card';
import { TaskItem } from './TaskItem';
import { Task, TaskModal } from './TaskModal';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface TaskListProps {
  userId?: string;
  showFilters?: boolean;
  limit?: number;
  onCreateTask?: () => void;
  className?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  userId,
  showFilters = true,
  limit,
  onCreateTask,
  className = ''
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'created_at'>('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  
  useEffect(() => {
    loadTasks();
    loadUsers();
    loadDeals();
    loadContacts();
  }, [userId]);
  
  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder]);
  
  const loadTasks = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('tasks').select('*');
      
      if (userId) {
        query = query.eq('assigned_to', userId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      
      // Mock data for development
      setTasks([
        {
          id: '1',
          title: 'Follow up with TechCorp Inc.',
          description: 'Send proposal follow-up email',
          due_date: format(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          due_time: '14:00',
          priority: 'high',
          status: 'pending',
          assigned_to: 'user-1',
          related_deal_id: '1',
          is_recurring: false,
          reminder: true,
          reminder_time: 15,
          created_at: new Date().toISOString(),
          created_by: 'user-1'
        },
        {
          id: '2',
          title: 'Prepare demo for StartupXYZ',
          description: 'Customize demo for cloud infrastructure needs',
          due_date: format(new Date(), 'yyyy-MM-dd'),
          due_time: '10:00',
          priority: 'medium',
          status: 'completed',
          assigned_to: 'user-1',
          related_deal_id: '2',
          is_recurring: false,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'user-1'
        },
        {
          id: '3',
          title: 'Review contract terms',
          description: 'Legal review for Enterprise Software Package',
          due_date: format(new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          due_time: '16:30',
          priority: 'high',
          status: 'in_progress',
          assigned_to: 'user-1',
          related_deal_id: '1',
          is_recurring: false,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'user-1'
        },
        {
          id: '4',
          title: 'Update CRM data',
          description: 'Import new contacts from trade show',
          due_date: format(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          priority: 'low',
          status: 'pending',
          is_recurring: false,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'user-1'
        },
        {
          id: '5',
          title: 'Weekly team meeting',
          description: 'Discuss project progress and roadblocks',
          due_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          due_time: '09:00',
          priority: 'medium',
          status: 'pending',
          is_recurring: true,
          recurrence_pattern: 'weekly',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'user-1'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, raw_user_meta_data');
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      
      // Mock data
      setUsers([
        {
          id: 'user-1',
          email: 'user@example.com',
          raw_user_meta_data: { full_name: 'John Doe' }
        }
      ]);
    }
  };
  
  const loadDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('id, title');
      
      if (error) throw error;
      
      setDeals(data || []);
    } catch (error) {
      console.error('Error loading deals:', error);
      
      // Mock data
      setDeals([
        { id: '1', title: 'Enterprise Software Package' },
        { id: '2', title: 'Cloud Infrastructure' }
      ]);
    }
  };
  
  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name');
      
      if (error) throw error;
      
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      
      // Mock data
      setContacts([
        { id: '1', first_name: 'John', last_name: 'Smith' },
        { id: '2', first_name: 'Sarah', last_name: 'Johnson' }
      ]);
    }
  };
  
  const filterTasks = () => {
    let filtered = [...tasks];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(term) || 
        task.description?.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date + (a.due_time ? `T${a.due_time}` : '')) : new Date(9999, 11, 31);
          bValue = b.due_date ? new Date(b.due_date + (b.due_time ? `T${b.due_time}` : '')) : new Date(9999, 11, 31);
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        default:
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    // Apply limit if specified
    if (limit && filtered.length > limit) {
      filtered = filtered.slice(0, limit);
    }
    
    setFilteredTasks(filtered);
  };
  
  const handleToggleStatus = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
      
      if (error) throw error;
      
      // Update local state
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
      
      // Update local state optimistically
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      ));
    }
  };
  
  const handleCreateTask = () => {
    if (onCreateTask) {
      onCreateTask();
    } else {
      setSelectedTask(null);
      setShowTaskModal(true);
    }
  };
  
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };
  
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
      
      // Update local state
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      
      // Update local state optimistically
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };
  
  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      if (selectedTask) {
        // Update existing task
        const { data, error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', selectedTask.id)
          .select();
        
        if (error) throw error;
        
        if (data) {
          setTasks(tasks.map(t => t.id === selectedTask.id ? data[0] as Task : t));
        }
      } else {
        // Create new task
        const { data, error } = await supabase
          .from('tasks')
          .insert([{
            ...taskData,
            created_at: new Date().toISOString(),
            created_by: userId || 'user-1' // Use current user ID or fallback
          }])
          .select();
        
        if (error) throw error;
        
        if (data) {
          setTasks([data[0] as Task, ...tasks]);
        }
      }
      
      setShowTaskModal(false);
    } catch (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  };
  
  return (
    <div className={className}>
      {showFilters && (
        <Card className="p-4 mb-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-dark-200/70 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent w-full"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-dark-200/70 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-dark-200/70 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <div className="flex items-center space-x-2">
              <span className="text-dark-400 text-sm">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-dark-200/70 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="created_at">Created Date</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-dark-200/70 border border-dark-300 rounded-lg text-dark-400 hover:text-white transition-colors"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
              </button>
            </div>
            
            <div className="ml-auto">
              <button
                onClick={handleCreateTask}
                className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>
          </div>
        </Card>
      )}
      
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No tasks found</h3>
            <p className="text-dark-400 mb-6">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first task'}
            </p>
            <button
              onClick={handleCreateTask}
              className="bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Add Task
            </button>
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleStatus={handleToggleStatus}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              users={users}
              deals={deals}
              contacts={contacts}
            />
          ))
        )}
      </div>
      
      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={selectedTask || undefined}
          onClose={() => setShowTaskModal(false)}
          onSave={handleSaveTask}
          isNew={!selectedTask}
          users={users}
          deals={deals}
          contacts={contacts}
        />
      )}
    </div>
  );
};