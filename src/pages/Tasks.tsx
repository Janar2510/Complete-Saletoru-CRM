import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Calendar, 
  Filter, 
  Search, 
  Plus,
  User,
  Target,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Repeat,
  Bell
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { TaskList } from '../components/tasks/TaskList';
import { TaskModal, Task } from '../components/tasks/TaskModal';
import { supabase } from '../lib/supabase';
import { format, isToday, isTomorrow, addDays, isAfter, isBefore, startOfWeek, endOfWeek } from 'date-fns';

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'tomorrow' | 'week' | 'overdue'>('all');
  
  // Task statistics
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    today: 0,
    upcoming: 0
  });
  
  useEffect(() => {
    loadTasks();
    loadUsers();
    loadDeals();
    loadContacts();
  }, []);
  
  useEffect(() => {
    calculateStats();
  }, [tasks]);
  
  const loadTasks = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
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
  
  const calculateStats = () => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const tomorrow = format(addDays(now, 1), 'yyyy-MM-dd');
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    
    const completed = tasks.filter(task => task.status === 'completed').length;
    const pending = tasks.filter(task => task.status === 'pending' || task.status === 'in_progress').length;
    
    const overdueTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      if (task.status === 'completed' || task.status === 'cancelled') return false;
      
      const dueDate = new Date(task.due_date);
      if (task.due_time) {
        const [hours, minutes] = task.due_time.split(':').map(Number);
        dueDate.setHours(hours, minutes);
      }
      
      return isBefore(dueDate, now);
    });
    
    const todayTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      return task.due_date === today;
    });
    
    const upcomingTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      if (task.status === 'completed' || task.status === 'cancelled') return false;
      if (task.due_date === today) return false;
      
      const dueDate = new Date(task.due_date);
      return isAfter(dueDate, now);
    });
    
    setStats({
      total: tasks.length,
      completed,
      pending,
      overdue: overdueTasks.length,
      today: todayTasks.length,
      upcoming: upcomingTasks.length
    });
  };
  
  const getFilteredTasks = () => {
    if (timeFilter === 'all') return tasks;
    
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const tomorrow = format(addDays(now, 1), 'yyyy-MM-dd');
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    
    switch (timeFilter) {
      case 'today':
        return tasks.filter(task => task.due_date === today);
      case 'tomorrow':
        return tasks.filter(task => task.due_date === tomorrow);
      case 'week':
        return tasks.filter(task => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          return isAfter(dueDate, weekStart) && isBefore(dueDate, weekEnd);
        });
      case 'overdue':
        return tasks.filter(task => {
          if (!task.due_date) return false;
          if (task.status === 'completed' || task.status === 'cancelled') return false;
          
          const dueDate = new Date(task.due_date);
          if (task.due_time) {
            const [hours, minutes] = task.due_time.split(':').map(Number);
            dueDate.setHours(hours, minutes);
          }
          
          return isBefore(dueDate, now);
        });
      default:
        return tasks;
    }
  };
  
  const handleCreateTask = () => {
    setSelectedTask(null);
    setShowTaskModal(true);
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
            created_by: 'user-1' // Use current user ID
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
      
      // For development, update the UI optimistically
      if (selectedTask) {
        setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, ...taskData } as Task : t));
      } else {
        const newTask = {
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
          created_by: 'user-1',
          ...taskData
        } as Task;
        setTasks([newTask, ...tasks]);
      }
      
      setShowTaskModal(false);
      throw error;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tasks</h1>
          <p className="text-dark-400">Manage your tasks and to-dos</p>
        </div>
        
        <button
          onClick={handleCreateTask}
          className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card className="p-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Total Tasks</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Completed</p>
              <p className="text-2xl font-bold text-white">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Pending</p>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Overdue</p>
              <p className="text-2xl font-bold text-white">{stats.overdue}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Today</p>
              <p className="text-2xl font-bold text-white">{stats.today}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Upcoming</p>
              <p className="text-2xl font-bold text-white">{stats.upcoming}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Time Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTimeFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            timeFilter === 'all'
              ? 'bg-accent text-white'
              : 'bg-dark-200/70 text-dark-400 hover:bg-dark-300 hover:text-white'
          }`}
        >
          All Tasks
        </button>
        
        <button
          onClick={() => setTimeFilter('today')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
            timeFilter === 'today'
              ? 'bg-accent text-white'
              : 'bg-dark-200/70 text-dark-400 hover:bg-dark-300 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Today</span>
        </button>
        
        <button
          onClick={() => setTimeFilter('tomorrow')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
            timeFilter === 'tomorrow'
              ? 'bg-accent text-white'
              : 'bg-dark-200/70 text-dark-400 hover:bg-dark-300 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Tomorrow</span>
        </button>
        
        <button
          onClick={() => setTimeFilter('week')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
            timeFilter === 'week'
              ? 'bg-accent text-white'
              : 'bg-dark-200/70 text-dark-400 hover:bg-dark-300 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>This Week</span>
        </button>
        
        <button
          onClick={() => setTimeFilter('overdue')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
            timeFilter === 'overdue'
              ? 'bg-red-500 text-white'
              : 'bg-dark-200/70 text-dark-400 hover:bg-dark-300 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Overdue</span>
          {stats.overdue > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {stats.overdue}
            </span>
          )}
        </button>
      </div>

      {/* Task List */}
      <Card className="p-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-accent" />
            <span>
              {timeFilter === 'all' ? 'All Tasks' :
               timeFilter === 'today' ? 'Today\'s Tasks' :
               timeFilter === 'tomorrow' ? 'Tomorrow\'s Tasks' :
               timeFilter === 'week' ? 'This Week\'s Tasks' :
               'Overdue Tasks'}
            </span>
          </h2>
          
          <div className="flex items-center space-x-2 text-sm text-dark-400">
            <Repeat className="w-4 h-4 text-purple-400" />
            <span>Recurring</span>
            
            <span className="mx-2">•</span>
            
            <Bell className="w-4 h-4 text-yellow-400" />
            <span>Reminder</span>
          </div>
        </div>
        
        <TaskList 
          showFilters={false}
          className="space-y-3"
        />
      </Card>
      
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

export default Tasks;