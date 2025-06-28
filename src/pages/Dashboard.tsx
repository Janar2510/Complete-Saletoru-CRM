import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Calendar, User, Bot, Clock, CheckCircle, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { TaskSummaryWidget } from '@/components/dashboard/TaskSummaryWidget';
import { PipelineOverviewWidget } from '@/components/dashboard/PipelineOverviewWidget';
import { AITipWidget } from '@/components/dashboard/AITipWidget';
import { PerformanceWidget } from '@/components/dashboard/PerformanceWidget';
import { TodayTasksPanel } from '@/components/dashboard/TodayTasksPanel';
import { DealUpdatesPanel } from '@/components/dashboard/DealUpdatesPanel';
import { QuickActionsToolbar } from '@/components/dashboard/QuickActionsToolbar';
import { EnhancedGuruAssistant } from '@/components/dashboard/EnhancedGuruAssistant';
import { PlanUsageWidget } from '@/components/dashboard/PlanUsageWidget';
import { LeadScoreWidget } from '@/components/dashboard/LeadScoreWidget';
import { ProductivityWidget } from '@/components/dashboard/ProductivityWidget';
import { SuggestedTasksWidget } from '@/components/dashboard/SuggestedTasksWidget';

import { SaleToruGuru } from '@/components/ai/SaleToruGuru';
import { GuruInsightPanel } from '@/components/ai/GuruInsightPanel';
import { TaskSuggestionPanel } from '@/components/ai/TaskSuggestionPanel';
import { BottleneckPanel } from '@/components/ai/BottleneckPanel';
import { ProductivityInsightsPanel } from '@/components/ai/ProductivityInsightsPanel';
import { FocusTimePanel } from '@/components/ai/FocusTimePanel';
import { TaskGeneratorModal } from '@/components/ai/TaskGeneratorModal';

import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { useFeatureLock } from '@/hooks/useFeatureLock';

import { ContactsAPI } from '@/lib/contacts-api';
import { DealsAPI } from '@/lib/deals-api';
import { AITaskAPI } from '@/lib/ai-task-api';

import type {
  TaskSuggestion,
  ProductivityInsight,
  FocusTimeSlot,
  Bottleneck,
} from '@/types/ai';

import { Card } from '@/components/common/Card';
import { useTranslation } from 'react-i18next';


const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentPlan } = usePlan();
  const { withFeatureAccess, FeatureLockModal } = useFeatureLock(currentPlan);
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const today = new Date();
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'John';

  // Mock data - in a real app, this would come from your API
  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Follow up with TechCorp Inc.',
      description: 'Send proposal follow-up email',
      completed: false,
      priority: 'high' as const,
      dueTime: '2:00 PM',
      dealId: '1',
    },
    {
      id: '2',
      title: 'Prepare demo for StartupXYZ',
      description: 'Customize demo for cloud infrastructure needs',
      completed: true,
      priority: 'medium' as const,
      dueTime: '10:00 AM',
      dealId: '4',
    },
    {
      id: '3',
      title: 'Review contract terms',
      description: 'Legal review for Enterprise Software Package',
      completed: false,
      priority: 'high' as const,
      dueTime: '4:30 PM',
      dealId: '1',
    },
    {
      id: '4',
      title: 'Update CRM data',
      description: 'Import new contacts from trade show',
      completed: false,
      priority: 'low' as const,
    },
  ]);

  const [topLeads, setTopLeads] = useState<any[]>([]);
  const [topDeals, setTopDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuruInsights, setShowGuruInsights] = useState(false);
  
  // AI Task Suggestions state
  const [showTaskSuggestions, setShowTaskSuggestions] = useState(false);
  const [taskSuggestions, setTaskSuggestions] = useState<TaskSuggestion[]>([]);
  const [showBottlenecks, setShowBottlenecks] = useState(false);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [showProductivityInsights, setShowProductivityInsights] = useState(false);
  const [productivityInsights, setProductivityInsights] = useState<ProductivityInsight[]>([]);
  const [showFocusTime, setShowFocusTime] = useState(false);
  const [focusTimeSlots, setFocusTimeSlots] = useState<FocusTimeSlot[]>([]);
  const [showTaskGenerator, setShowTaskGenerator] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | undefined>(undefined);

  const loadLeadScoreData = useCallback(async () => {
    if (!user || authLoading) return;
    
    try {
      setLoading(true);
      
      // Load top leads
      const contacts = await ContactsAPI.getContacts();
      const sortedContacts = [...contacts]
        .filter(c => c.lead_score && c.lead_score > 0)
        .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          name: `${c.first_name} ${c.last_name}`,
          company: c.company?.name,
          score: c.lead_score || 0
        }));
      
      // Load top deals
      const deals = await DealsAPI.getDeals();
      const sortedDeals = [...deals]
        .filter(d => d.engagement_score && d.engagement_score > 0)
        .sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0))
        .slice(0, 5)
        .map(d => ({
          id: d.id,
          title: d.title,
          value: d.value,
          score: d.engagement_score || 0
        }));
      
      setTopLeads(sortedContacts);
      setTopDeals(sortedDeals);
    } catch (error) {
      console.error('Error loading lead score data:', error);
      
      // Fallback to mock data if API fails
      setTopLeads([
        { id: '1', name: 'John Smith', company: 'Acme Corp', score: 85 },
        { id: '2', name: 'Sarah Johnson', company: 'TechCorp', score: 78 },
        { id: '3', name: 'Michael Brown', company: 'Global Industries', score: 72 },
        { id: '4', name: 'Emily Davis', company: 'Startup Inc', score: 65 },
        { id: '5', name: 'David Wilson', company: 'Enterprise Solutions', score: 58 }
      ]);
      
      setTopDeals([
        { id: '1', title: 'Enterprise Software Package', value: 75000, score: 82 },
        { id: '2', title: 'Cloud Infrastructure', value: 45000, score: 76 },
        { id: '3', title: 'Consulting Services', value: 35000, score: 70 },
        { id: '4', title: 'Data Migration Project', value: 28000, score: 63 },
        { id: '5', title: 'Security Upgrade', value: 18000, score: 55 }
      ]);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadAIData = useCallback(async () => {
    if (!user || authLoading) return;
    
    try {
      // Load task suggestions
      const suggestions = await AITaskAPI.getSuggestedTasks();
      setTaskSuggestions(suggestions);
      
      // Load bottlenecks
      const bottlenecksData = await AITaskAPI.getBottlenecks();
      setBottlenecks(bottlenecksData);
      
      // Load productivity insights
      const insights = await AITaskAPI.getProductivityInsights();
      setProductivityInsights(insights);
      
      // Load focus time slots
      const focusSlots = await AITaskAPI.getFocusTimeRecommendations();
      setFocusTimeSlots(focusSlots);
    } catch (error) {
      console.error('Error loading AI data:', error);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && user) {
      loadLeadScoreData();
      loadAIData();
    }
  }, [user, authLoading, loadLeadScoreData, loadAIData]);

  const dealUpdates = [
    {
      id: '1',
      dealTitle: 'Enterprise Software Package',
      dealValue: 75000,
      action: 'stage_changed' as const,
      fromStage: 'Qualified',
      toStage: 'Proposal',
      user: 'John Doe',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      priority: 'high' as const,
    },
    {
      id: '2',
      dealTitle: 'Cloud Infrastructure',
      dealValue: 15000,
      action: 'created' as const,
      user: 'Sarah Johnson',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      priority: 'medium' as const,
    },
    {
      id: '3',
      dealTitle: 'Financial Services',
      dealValue: 25000,
      action: 'won' as const,
      user: 'Mike Wilson',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      priority: 'high' as const,
    },
  ];

  const pipelineStages = [
    { name: 'Lead', count: 12, value: 180000, color: 'bg-gray-500' },
    { name: 'Qualified', count: 8, value: 320000, color: 'bg-blue-500' },
    { name: 'Proposal', count: 6, value: 450000, color: 'bg-yellow-500' },
    { name: 'Negotiation', count: 4, value: 280000, color: 'bg-orange-500' },
    { name: 'Closed Won', count: 15, value: 750000, color: 'bg-green-500' },
  ];

  const performanceMetrics = [
    { label: 'Revenue', current: 124563, previous: 98420, format: 'currency' as const },
    { label: 'Deals Closed', current: 23, previous: 18, format: 'number' as const },
    { label: 'Conversion Rate', current: 23.4, previous: 21.8, format: 'percentage' as const },
  ];

  const productivityMetrics = [
    { 
      label: t('tasks.completedTasks'), 
      value: 15, 
      previousValue: 12, 
      unit: 'tasks',
      icon: CheckCircle,
      color: 'bg-green-500/20'
    },
    { 
      label: 'Response Time', 
      value: 2.5, 
      previousValue: 3.2, 
      unit: 'hours',
      icon: Clock,
      color: 'bg-blue-500/20'
    },
    { 
      label: 'Deals Progressed', 
      value: 8, 
      previousValue: 5, 
      unit: 'deals',
      icon: Target,
      color: 'bg-purple-500/20'
    },
    { 
      label: 'Focus Time', 
      value: 6, 
      previousValue: 4, 
      unit: 'hours',
      icon: TrendingUp,
      color: 'bg-yellow-500/20'
    }
  ];

  const aiTip = {
    id: 'tip-1',
    title: 'High-value deals need attention',
    description: 'You have 2 deals worth over $50,000 that haven\'t been updated in the past week. Consider reaching out to keep momentum going. Based on historical data, deals that go more than 7 days without activity have a 40% lower close rate.',
    category: 'pipeline' as const,
    priority: 'high' as const,
    actionable: true,
  };

  const handleTaskToggle = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleAddTask = () => {
    console.log('Add task clicked');
  };

  const handleViewDeal = (dealId: string) => {
    console.log('View deal:', dealId);
  };

  const handleDismissTip = (tipId: string) => {
    console.log('Dismiss tip:', tipId);
  };

  const handleSaveTip = (tipId: string) => {
    console.log('Save tip:', tipId);
  };

  // Quick action handlers
  const handleCreateDeal = () => {
    console.log('Create Deal clicked');
    navigate('/deals');
  };
  
  const handleAddContact = () => {
    console.log('Add Contact clicked');
    navigate('/contacts');
  };
  
  const handleScheduleMeeting = () => {
    console.log('Schedule Meeting clicked');
    withFeatureAccess('calendar_integration', () => {
      navigate('/calendar');
    });
  };
  
  const handleSendEmail = () => {
    console.log('Send Email clicked');
    withFeatureAccess('email_integration', () => {
      // Navigate to email composer
      alert('Email composer would open here');
    });
  };
  
  const handleCreateTask = () => {
    console.log('Create Task clicked');
    // Navigate to task creation
    alert('Task creation would open here');
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = tasks.filter(task => !task.completed).length;
  const overdueTasks = 2; // Mock data

  const handleAskGuru = (question: string) => {
    // Open the Guru chat with the question pre-filled
    const guruButton = document.querySelector('.fixed.bottom-6.right-6.w-14.h-14') as HTMLElement;
    if (guruButton) {
      guruButton.click();
      
      // Set the question in the input field
      setTimeout(() => {
        const inputField = document.querySelector('.bg-dark-200.border.border-dark-300.rounded-lg.px-3.py-2.text-white') as HTMLInputElement;
        if (inputField) {
          inputField.value = question;
          inputField.focus();
        }
      }, 300);
    }
  };

  // AI Task Suggestions handlers
  const handleShowTaskSuggestions = () => {
    withFeatureAccess('ai_assistant', () => {
      setShowTaskSuggestions(true);
    });
  };

  const handleShowBottlenecks = () => {
    withFeatureAccess('ai_assistant', () => {
      setShowBottlenecks(true);
    });
  };

  const handleShowProductivityInsights = () => {
    withFeatureAccess('ai_assistant', () => {
      setShowProductivityInsights(true);
    });
  };

  const handleShowFocusTime = () => {
    withFeatureAccess('ai_assistant', () => {
      setShowFocusTime(true);
    });
  };

  const handleShowTaskGenerator = (dealId?: string) => {
    withFeatureAccess('ai_assistant', () => {
      setSelectedDealId(dealId);
      setShowTaskGenerator(true);
    });
  };

  const handleCreateSuggestedTask = (task: TaskSuggestion) => {
    console.log('Create task:', task);
    // In a real app, this would call an API to create the task
    alert(`Task created: ${task.title}`);
  };

  const handleCreateAllTasks = (tasks: TaskSuggestion[]) => {
    console.log('Create all tasks:', tasks);
    // In a real app, this would call an API to create all tasks
    alert(`${tasks.length} tasks created`);
    setShowTaskSuggestions(false);
  };

  const handleViewEntity = (type: string, id: string) => {
    console.log('View entity:', type, id);
    // In a real app, this would navigate to the entity page
    if (type === 'deal') {
      navigate(`/deals?id=${id}`);
    } else if (type === 'contact') {
      navigate(`/contacts?id=${id}`);
    } else if (type === 'task') {
      // Navigate to tasks page
      alert('Navigate to task details');
    }
  };

  const handleScheduleFocusTime = (slot: FocusTimeSlot) => {
    console.log('Schedule focus time:', slot);
    // In a real app, this would call an API to schedule focus time
    alert(`Focus time scheduled: ${new Date(slot.start).toLocaleString()} - ${new Date(slot.end).toLocaleString()}`);
    setShowFocusTime(false);
  };

  const handleTasksGenerated = (tasks: TaskSuggestion[]) => {
    console.log('Tasks generated:', tasks);
    // In a real app, this would call an API to create the tasks
    alert(`${tasks.length} tasks created`);
  };

  // Show loading state while authentication is being determined
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">{t('common.loading')}</div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Please log in to access the dashboard.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {userName}'s {t('common.dashboard')}
          </h1>
          <p className="text-dark-400 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {format(today, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {currentPlan === 'team' && (
            <button
              onClick={() => setShowGuruInsights(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-accent to-purple-500 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <Bot className="w-4 h-4" />
              <span>Guru Insights</span>
            </button>
          )}
          <div className="flex items-center space-x-2 text-sm text-dark-400">
            <User className="w-4 h-4" />
            <span>{t('dashboard.welcome')}</span>
          </div>
        </div>
      </div>

      {/* Guru Insights Panel (conditionally shown) */}
      {showGuruInsights && (
        <GuruInsightPanel 
          onClose={() => setShowGuruInsights(false)}
          onAskGuru={handleAskGuru}
        />
      )}

      {/* Quick Actions */}
    <QuickActionsToolbar
  onCreateDeal={handleCreateDeal}
  onAddContact={handleAddContact}
  onScheduleMeeting={handleScheduleMeeting}
  onSendEmail={handleSendEmail}
  onCreateTask={handleCreateTask}
/>

      />

      {/* AI Task Suggestions Panels */}
      {showTaskSuggestions && (
        <TaskSuggestionPanel
          suggestions={taskSuggestions}
          onClose={() => setShowTaskSuggestions(false)}
          onCreateTask={handleCreateSuggestedTask}
          onCreateAllTasks={handleCreateAllTasks}
        />
      )}

      {showBottlenecks && (
        <BottleneckPanel
          bottlenecks={bottlenecks}
          onClose={() => setShowBottlenecks(false)}
          onViewEntity={handleViewEntity}
          onCreateTask={(bottleneck) => {
            console.log('Create task for bottleneck:', bottleneck);
            // In a real app, this would open a task creation modal
            alert(`Task created for: ${bottleneck.title}`);
          }}
        />
      )}

      {showProductivityInsights && (
        <ProductivityInsightsPanel
          insights={productivityInsights}
          onClose={() => setShowProductivityInsights(false)}
          onAction={(url) => {
            navigate(url);
          }}
        />
      )}

      {showFocusTime && (
        <FocusTimePanel
          focusSlots={focusTimeSlots}
          onClose={() => setShowFocusTime(false)}
          onSchedule={handleScheduleFocusTime}
        />
      )}

      {showTaskGenerator && (
        <TaskGeneratorModal
          dealId={selectedDealId}
          onClose={() => {
            setShowTaskGenerator(false);
            setSelectedDealId(undefined);
          }}
          onTasksGenerated={handleTasksGenerated}
        />
      )}

      {/* Priority Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayTasksPanel
          tasks={tasks}
          onTaskToggle={handleTaskToggle}
          onAddTask={handleAddTask}
        />
        <DealUpdatesPanel
          updates={dealUpdates}
          onViewDeal={handleViewDeal}
        />
      </div>

      {/* Smart Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <TaskSummaryWidget
          completedTasks={completedTasks}
          pendingTasks={pendingTasks}
          overdueTasks={overdueTasks}
        />
        <PipelineOverviewWidget stages={pipelineStages} />
        {currentPlan === 'team' ? (
          <AITipWidget
            tip={aiTip}
            onDismiss={handleDismissTip}
            onSave={handleSaveTip}
          />
        ) : (
          <PlanUsageWidget />
        )}
        <ProductivityWidget
          metrics={productivityMetrics}
          onViewInsights={handleShowProductivityInsights}
        />
      </div>

      {/* AI Task Suggestions and Lead Scoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SuggestedTasksWidget
          onViewAllTasks={() => navigate('/tasks')}
          onCreateTask={handleCreateSuggestedTask}
          onShowAllSuggestions={handleShowTaskSuggestions}
        />
        <LeadScoreWidget 
          topLeads={topLeads}
          topDeals={topDeals}
          onViewAllLeads={() => navigate('/leads')}
          onViewAllDeals={() => navigate('/deals')}
        />
      </div>

      {/* AI Action Buttons */}
      {currentPlan === 'team' && (
        <Card className="p-6 border border-dark-200/50 bg-gradient-to-br from-dark-100/50 to-dark-100/30">
          <h3 className="text-lg font-semibold text-white mb-4">AI Productivity Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={handleShowTaskSuggestions}
              className="p-4 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors text-left backdrop-blur-sm border border-dark-300/30"
            >
              <div className="flex flex-col items-center text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
                <h4 className="font-medium text-white mb-1">Task Suggestions</h4>
                <p className="text-xs text-dark-400">
                  Get AI-powered task recommendations
                </p>
              </div>
            </button>
            
            <button
              onClick={handleShowBottlenecks}
              className="p-4 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors text-left backdrop-blur-sm border border-dark-300/30"
            >
              <div className="flex flex-col items-center text-center">
                <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
                <h4 className="font-medium text-white mb-1">Bottleneck Detection</h4>
                <p className="text-xs text-dark-400">
                  Find where you're stuck
                </p>
              </div>
            </button>
            
            <button
              onClick={handleShowFocusTime}
              className="p-4 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors text-left backdrop-blur-sm border border-dark-300/30"
            >
              <div className="flex flex-col items-center text-center">
                <Clock className="w-8 h-8 text-blue-400 mb-2" />
                <h4 className="font-medium text-white mb-1">Focus Time</h4>
                <p className="text-xs text-dark-400">
                  Schedule optimal deep work sessions
                </p>
              </div>
            </button>
            
            <button
              onClick={() => handleShowTaskGenerator()}
              className="p-4 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors text-left backdrop-blur-sm border border-dark-300/30"
            >
              <div className="flex flex-col items-center text-center">
                <Target className="w-8 h-8 text-purple-400 mb-2" />
                <h4 className="font-medium text-white mb-1">Task Generator</h4>
                <p className="text-xs text-dark-400">
                  Create task checklists for deals
                </p>
              </div>
            </button>
          </div>
        </Card>
      )}

      {/* Enhanced Guru Assistant */}
      {currentPlan === 'team' && (
        <EnhancedGuruAssistant userName={userName} />
      )}
      
      {/* AI Assistant */}
      <SaleToruGuru />
      
      <FeatureLockModal />
    </div>
  );
};

// Placeholder for AlertTriangle component
const AlertTriangle: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
    <path d="M12 9v4"></path>
    <path d="M12 17h.01"></path>
  </svg>
);

export default Dashboard;