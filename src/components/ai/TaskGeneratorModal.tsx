import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  Target, 
  User, 
  Calendar, 
  Plus,
  ArrowRight
} from 'lucide-react';
import { Card } from '../common/Card';
import { TaskSuggestion } from '../../types/ai';
import { AITaskAPI } from '../../lib/ai-task-api';
import { DealsAPI } from '../../lib/deals-api';
import { Deal } from '../../types/deals';

interface TaskGeneratorModalProps {
  dealId?: string;
  onClose: () => void;
  onTasksGenerated: (tasks: TaskSuggestion[]) => void;
}

export const TaskGeneratorModal: React.FC<TaskGeneratorModalProps> = ({
  dealId,
  onClose,
  onTasksGenerated
}) => {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [taskType, setTaskType] = useState<'closing' | 'onboarding' | 'proposal'>('proposal');
  const [loading, setLoading] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<TaskSuggestion[]>([]);
  const [step, setStep] = useState<'select_deal' | 'select_type' | 'review'>('select_deal');

  useEffect(() => {
    if (dealId) {
      loadDeal(dealId);
      setStep('select_type');
    }
  }, [dealId]);

  const loadDeal = async (id: string) => {
    try {
      const dealData = await DealsAPI.getDeal(id);
      if (dealData) {
        setDeal(dealData);
      }
    } catch (error) {
      console.error('Error loading deal:', error);
    }
  };

  const handleDealSelect = (selectedDeal: Deal) => {
    setDeal(selectedDeal);
    setStep('select_type');
  };

  const handleTypeSelect = (type: 'closing' | 'onboarding' | 'proposal') => {
    setTaskType(type);
    generateTasks(type);
  };

  const generateTasks = async (type: 'closing' | 'onboarding' | 'proposal') => {
    if (!deal) return;
    
    try {
      setLoading(true);
      const tasks = await AITaskAPI.generateTasksForDeal(deal.id, type);
      setGeneratedTasks(tasks);
      setStep('review');
    } catch (error) {
      console.error('Error generating tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onTasksGenerated(generatedTasks);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-200">
          <h2 className="text-xl font-semibold text-white">Generate Task Checklist</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {step === 'select_deal' && (
            <div className="space-y-6">
              <p className="text-dark-400">
                Select a deal to generate a task checklist for:
              </p>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {/* This would be a list of deals in a real implementation */}
                <div 
                  className="p-4 rounded-lg bg-dark-200/50 border border-dark-300 hover:border-accent cursor-pointer transition-colors"
                  onClick={() => handleDealSelect({
                    id: '1',
                    deal_id: 'DEAL-001',
                    title: 'Enterprise Software Package',
                    value: 75000,
                    currency: 'USD',
                    status: 'open',
                    probability: 75,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Target className="w-5 h-5 text-blue-400" />
                      <div>
                        <h3 className="font-medium text-white">Enterprise Software Package</h3>
                        <p className="text-sm text-dark-400">$75,000 • 75% probability</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-dark-400" />
                  </div>
                </div>
                
                <div 
                  className="p-4 rounded-lg bg-dark-200/50 border border-dark-300 hover:border-accent cursor-pointer transition-colors"
                  onClick={() => handleDealSelect({
                    id: '2',
                    deal_id: 'DEAL-002',
                    title: 'Cloud Infrastructure',
                    value: 45000,
                    currency: 'USD',
                    status: 'open',
                    probability: 60,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Target className="w-5 h-5 text-blue-400" />
                      <div>
                        <h3 className="font-medium text-white">Cloud Infrastructure</h3>
                        <p className="text-sm text-dark-400">$45,000 • 60% probability</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-dark-400" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {step === 'select_type' && deal && (
            <div className="space-y-6">
              <div className="bg-dark-200/50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="font-medium text-white">{deal.title}</h3>
                    <p className="text-sm text-dark-400">
                      ${deal.value.toLocaleString()} • {deal.probability}% probability
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-dark-400">
                What type of task checklist would you like to generate?
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => handleTypeSelect('proposal')}
                  className="p-4 rounded-lg bg-dark-200/50 border border-dark-300 hover:border-accent transition-colors text-left"
                >
                  <div className="flex flex-col items-center text-center">
                    <FileText className="w-8 h-8 text-blue-400 mb-2" />
                    <h3 className="font-medium text-white mb-1">Proposal Checklist</h3>
                    <p className="text-xs text-dark-400">
                      Tasks for creating and presenting a proposal
                    </p>
                  </div>
                </button>
                
                <button
                  onClick={() => handleTypeSelect('closing')}
                  className="p-4 rounded-lg bg-dark-200/50 border border-dark-300 hover:border-accent transition-colors text-left"
                >
                  <div className="flex flex-col items-center text-center">
                    <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
                    <h3 className="font-medium text-white mb-1">Closing Checklist</h3>
                    <p className="text-xs text-dark-400">
                      Tasks for finalizing and closing the deal
                    </p>
                  </div>
                </button>
                
                <button
                  onClick={() => handleTypeSelect('onboarding')}
                  className="p-4 rounded-lg bg-dark-200/50 border border-dark-300 hover:border-accent transition-colors text-left"
                >
                  <div className="flex flex-col items-center text-center">
                    <User className="w-8 h-8 text-purple-400 mb-2" />
                    <h3 className="font-medium text-white mb-1">Onboarding Checklist</h3>
                    <p className="text-xs text-dark-400">
                      Tasks for onboarding a new client
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}
          
          {step === 'review' && (
            <div className="space-y-6">
              <div className="bg-dark-200/50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="font-medium text-white">{deal?.title}</h3>
                    <p className="text-sm text-dark-400">
                      ${deal?.value.toLocaleString()} • {taskType} checklist
                    </p>
                  </div>
                </div>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-white">Generating tasks...</span>
                </div>
              ) : (
                <>
                  <p className="text-dark-400">
                    Review the generated tasks:
                  </p>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {generatedTasks.map((task, index) => (
                      <div 
                        key={task.id} 
                        className="p-3 rounded-lg bg-dark-200/50 border border-dark-300 transition-colors"
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5 mr-3 bg-dark-300 w-6 h-6 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">{index + 1}</span>
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-dark-400 mt-1">{task.description}</p>
                            )}
                            
                            <div className="mt-2 flex items-center text-xs">
                              <div className="flex items-center text-dark-400 mr-3">
                                <Calendar className="w-3 h-3 mr-1" />
                                <span>Due in {new Date(task.due_date!).getDate() - new Date().getDate()} days</span>
                              </div>
                              
                              <div className={`px-2 py-0.5 rounded-full text-xs ${
                                task.priority === 'high' 
                                  ? 'bg-red-500/20 text-red-400' 
                                  : task.priority === 'medium'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-green-500/20 text-green-400'
                              }`}>
                                {task.priority}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-dark-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-dark-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          
          {step === 'review' && !loading && (
            <button
              onClick={handleFinish}
              className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create {generatedTasks.length} Tasks</span>
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

// Placeholder for FileText component
const FileText: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);