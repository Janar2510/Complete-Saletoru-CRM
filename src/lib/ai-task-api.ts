import { supabase, isSupabaseConfigured } from './supabase';
import { DealsAPI } from './deals-api';
import type { Deal } from '../types/deals';
import type { 
  SuggestedTask, 
  TaskSuggestion, 
  Bottleneck, 
  ProductivityInsight, 
  FocusTimeSlot 
} from '../types/ai';

export class AITaskAPI {
  static async getSuggestedTasks(): Promise<SuggestedTask[]> {
    try {
      // Get deals data with proper error handling
      const deals = await DealsAPI.getDeals();
      
      if (!deals || deals.length === 0) {
        console.log('No deals found, returning default suggestions');
        return this.getDefaultSuggestions();
      }

      // Generate AI-powered task suggestions based on deals
      const suggestions = this.generateTaskSuggestions(deals);
      
      return suggestions;
    } catch (error) {
      console.error('Error getting suggested tasks:', error);
      // Return default suggestions as fallback
      return this.getDefaultSuggestions();
    }
  }

  static async getBottlenecks(): Promise<Bottleneck[]> {
    try {
      // In a real implementation, this would analyze deals, tasks, and contacts
      // to identify bottlenecks. For now, return mock data.
      return [
        {
          id: 'bottleneck-1',
          type: 'deal',
          entity_id: 'deal-1',
          title: 'Enterprise Software Package',
          description: 'Deal has been in proposal stage for 14 days without activity',
          priority: 'high',
          idle_days: 14
        },
        {
          id: 'bottleneck-2',
          type: 'contact',
          entity_id: 'contact-1',
          title: 'John Smith at TechCorp',
          description: 'High-value lead has not responded to last 3 emails',
          priority: 'medium',
          idle_days: 8
        },
        {
          id: 'bottleneck-3',
          type: 'deal',
          entity_id: 'deal-2',
          title: 'Cloud Infrastructure',
          description: 'Waiting for technical requirements for 10 days',
          priority: 'medium',
          idle_days: 10
        }
      ];
    } catch (error) {
      console.error('Error getting bottlenecks:', error);
      return [];
    }
  }

  static async getProductivityInsights(): Promise<ProductivityInsight[]> {
    try {
      // In a real implementation, this would analyze user activity and performance
      return [
        {
          id: 'insight-1',
          category: 'time_management',
          title: 'Response Time Improvement',
          description: 'Your average email response time has improved by 25% this week',
          metric_value: 2.5,
          metric_unit: 'hours',
          metric_change: -25,
          action_url: '/emails',
          action_label: 'View Email Analytics'
        },
        {
          id: 'insight-2',
          category: 'deal_progress',
          title: 'Deal Velocity',
          description: 'Deals are moving 15% faster through your pipeline this month',
          metric_value: 18,
          metric_unit: 'days',
          metric_change: 15,
          action_url: '/deals',
          action_label: 'View Pipeline'
        },
        {
          id: 'insight-3',
          category: 'task_completion',
          title: 'Task Completion Rate',
          description: 'You completed 92% of your tasks this week, up from 78% last week',
          metric_value: 92,
          metric_unit: '%',
          metric_change: 14
        },
        {
          id: 'insight-4',
          category: 'contact_engagement',
          title: 'Contact Engagement',
          description: 'Your contact engagement score has increased by 8% this month',
          metric_value: 85,
          metric_unit: 'score',
          metric_change: 8,
          action_url: '/contacts',
          action_label: 'View Contacts'
        }
      ];
    } catch (error) {
      console.error('Error getting productivity insights:', error);
      return [];
    }
  }

  static async getFocusTimeRecommendations(): Promise<FocusTimeSlot[]> {
    try {
      // In a real implementation, this would analyze calendar and activity patterns
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return [
        {
          start: new Date(tomorrow.setHours(9, 0, 0, 0)).toISOString(),
          end: new Date(tomorrow.setHours(10, 30, 0, 0)).toISOString(),
          quality_score: 95,
          reason: 'No meetings scheduled, historically your most productive time'
        },
        {
          start: new Date(tomorrow.setHours(14, 0, 0, 0)).toISOString(),
          end: new Date(tomorrow.setHours(15, 30, 0, 0)).toISOString(),
          quality_score: 88,
          reason: 'Post-lunch focus period with minimal interruptions'
        },
        {
          start: new Date(tomorrow.setHours(16, 30, 0, 0)).toISOString(),
          end: new Date(tomorrow.setHours(18, 0, 0, 0)).toISOString(),
          quality_score: 82,
          reason: 'End-of-day deep work session before wrap-up'
        }
      ];
    } catch (error) {
      console.error('Error getting focus time recommendations:', error);
      return [];
    }
  }

  static async generateTasksForDeal(dealId: string, type: 'closing' | 'onboarding' | 'proposal'): Promise<TaskSuggestion[]> {
    try {
      // In a real implementation, this would generate tasks based on deal data and type
      const baseDate = new Date();
      
      const taskTemplates = {
        proposal: [
          {
            title: 'Research client requirements',
            description: 'Gather detailed requirements and pain points',
            priority: 'high' as const,
            days_offset: 1
          },
          {
            title: 'Create custom proposal',
            description: 'Draft proposal based on discovery findings',
            priority: 'high' as const,
            days_offset: 3
          },
          {
            title: 'Schedule proposal presentation',
            description: 'Book meeting to present proposal to stakeholders',
            priority: 'medium' as const,
            days_offset: 5
          },
          {
            title: 'Follow up on proposal',
            description: 'Check in on proposal status and address questions',
            priority: 'medium' as const,
            days_offset: 7
          }
        ],
        closing: [
          {
            title: 'Review contract terms',
            description: 'Ensure all terms are acceptable to both parties',
            priority: 'high' as const,
            days_offset: 1
          },
          {
            title: 'Address final objections',
            description: 'Handle any remaining concerns or questions',
            priority: 'high' as const,
            days_offset: 2
          },
          {
            title: 'Prepare closing documents',
            description: 'Get all paperwork ready for signature',
            priority: 'high' as const,
            days_offset: 3
          },
          {
            title: 'Schedule signing meeting',
            description: 'Coordinate final signing with all parties',
            priority: 'high' as const,
            days_offset: 4
          }
        ],
        onboarding: [
          {
            title: 'Send welcome package',
            description: 'Provide onboarding materials and next steps',
            priority: 'high' as const,
            days_offset: 1
          },
          {
            title: 'Schedule kickoff meeting',
            description: 'Plan initial project kickoff with client team',
            priority: 'high' as const,
            days_offset: 2
          },
          {
            title: 'Set up client accounts',
            description: 'Create necessary accounts and access credentials',
            priority: 'medium' as const,
            days_offset: 3
          },
          {
            title: 'Conduct training session',
            description: 'Train client team on product/service usage',
            priority: 'medium' as const,
            days_offset: 7
          }
        ]
      };

      const templates = taskTemplates[type] || taskTemplates.proposal;
      
      return templates.map((template, index) => {
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + template.days_offset);
        
        return {
          id: `generated-${type}-${dealId}-${index}`,
          title: template.title,
          description: template.description,
          type: 'prepare' as const,
          priority: template.priority,
          due_date: dueDate.toISOString(),
          related_deal: {
            id: dealId,
            title: 'Selected Deal'
          },
          reason: `Generated for ${type} workflow`
        };
      });
    } catch (error) {
      console.error('Error generating tasks for deal:', error);
      return [];
    }
  }

  private static generateTaskSuggestions(deals: Deal[]): SuggestedTask[] {
    const suggestions: SuggestedTask[] = [];

    deals.forEach(deal => {
      // Analyze deal stage and generate appropriate tasks
      const stageBasedTasks = this.getStageBasedTasks(deal);
      suggestions.push(...stageBasedTasks);

      // Check for stale deals (no activity in 7+ days)
      if (deal.last_activity_at) {
        const lastActivity = new Date(deal.last_activity_at);
        const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceActivity >= 7) {
          suggestions.push({
            id: `follow-up-${deal.id}`,
            title: `Follow up on ${deal.title}`,
            description: `No activity for ${daysSinceActivity} days. Reach out to maintain momentum.`,
            priority: daysSinceActivity >= 14 ? 'high' : 'medium',
            category: 'follow_up',
            dealId: deal.id,
            contactId: deal.contact_id || undefined,
            estimatedTime: 15,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            reasoning: `Deal has been inactive for ${daysSinceActivity} days, which may indicate lost momentum.`
          });
        }
      }

      // Check for deals approaching close date
      if (deal.expected_close_date) {
        const closeDate = new Date(deal.expected_close_date);
        const daysToClose = Math.floor((closeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        if (daysToClose <= 7 && daysToClose > 0) {
          suggestions.push({
            id: `urgent-close-${deal.id}`,
            title: `Urgent: Close ${deal.title}`,
            description: `Deal closes in ${daysToClose} days. Ensure all requirements are met.`,
            priority: 'high',
            category: 'admin',
            dealId: deal.id,
            estimatedTime: 30,
            dueDate: new Date(closeDate.getTime() - 24 * 60 * 60 * 1000).toISOString(),
            reasoning: `Deal is approaching close date with only ${daysToClose} days remaining.`
          });
        }
      }
    });

    // Sort by priority and limit to top 10
    return suggestions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 10);
  }

  private static getStageBasedTasks(deal: Deal): SuggestedTask[] {
    const tasks: SuggestedTask[] = [];
    const stageName = deal.pipeline_stages?.name?.toLowerCase() || '';

    switch (stageName) {
      case 'lead':
        tasks.push({
          id: `qualify-${deal.id}`,
          title: `Qualify lead: ${deal.title}`,
          description: 'Research prospect and determine if they meet ideal customer profile.',
          priority: 'medium',
          category: 'research',
          dealId: deal.id,
          estimatedTime: 20,
          reasoning: 'New leads need qualification to determine viability.'
        });
        break;

      case 'qualified':
        tasks.push({
          id: `discovery-${deal.id}`,
          title: `Schedule discovery call for ${deal.title}`,
          description: 'Book a discovery call to understand needs and pain points.',
          priority: 'high',
          category: 'meeting',
          dealId: deal.id,
          estimatedTime: 45,
          reasoning: 'Qualified leads need discovery calls to progress to proposal stage.'
        });
        break;

      case 'proposal':
        tasks.push({
          id: `proposal-${deal.id}`,
          title: `Create proposal for ${deal.title}`,
          description: 'Draft and send customized proposal based on discovery findings.',
          priority: 'high',
          category: 'proposal',
          dealId: deal.id,
          estimatedTime: 60,
          reasoning: 'Deals in proposal stage need formal proposals to move forward.'
        });
        break;

      case 'negotiation':
        tasks.push({
          id: `negotiate-${deal.id}`,
          title: `Negotiate terms for ${deal.title}`,
          description: 'Address objections and finalize contract terms.',
          priority: 'high',
          category: 'follow_up',
          dealId: deal.id,
          estimatedTime: 30,
          reasoning: 'Deals in negotiation need active management to close successfully.'
        });
        break;
    }

    return tasks;
  }

  private static getDefaultSuggestions(): SuggestedTask[] {
    return [
      {
        id: 'default-1',
        title: 'Review pipeline health',
        description: 'Analyze current deals and identify bottlenecks in your sales process.',
        priority: 'medium',
        category: 'admin',
        estimatedTime: 30,
        reasoning: 'Regular pipeline reviews help maintain sales momentum.'
      },
      {
        id: 'default-2',
        title: 'Update contact information',
        description: 'Ensure all contact details are current and complete.',
        priority: 'low',
        category: 'admin',
        estimatedTime: 15,
        reasoning: 'Accurate contact data improves communication effectiveness.'
      },
      {
        id: 'default-3',
        title: 'Plan prospecting activities',
        description: 'Identify and research new potential customers for your pipeline.',
        priority: 'medium',
        category: 'research',
        estimatedTime: 45,
        reasoning: 'Consistent prospecting maintains a healthy pipeline.'
      }
    ];
  }

  static async markTaskCompleted(taskId: string): Promise<void> {
    // In a real implementation, this would update the task status
    console.log(`Task ${taskId} marked as completed`);
  }

  static async dismissTask(taskId: string): Promise<void> {
    // In a real implementation, this would dismiss the task
    console.log(`Task ${taskId} dismissed`);
  }
}

// Re-export types for backward compatibility
export type { SuggestedTask, TaskSuggestion, Bottleneck, ProductivityInsight, FocusTimeSlot };