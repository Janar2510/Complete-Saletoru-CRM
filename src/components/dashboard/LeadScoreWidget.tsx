import React from 'react';
import { Plus, Users, Calendar, Mail, FileText, Target } from 'lucide-react';
import { Card } from '../common/Card';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick: () => void;
}

interface QuickActionsToolbarProps {
  onCreateDeal: () => void;
  onAddContact: () => void;
  onScheduleMeeting: () => void;
  onSendEmail: () => void;
  onCreateTask: () => void;
}

export const QuickActionsToolbar: React.FC<QuickActionsToolbarProps> = ({
  onCreateDeal,
  onAddContact,
  onScheduleMeeting,
  onSendEmail,
  onCreateTask,
}) => {
  const actions: QuickAction[] = [
    {
      id: 'create-deal',
      label: 'Add Deal',
      icon: Target,
      color: 'from-accent to-purple-500',
      onClick: onCreateDeal,
    },
    {
      id: 'add-contact',
      label: 'Add Contact',
      icon: Users,
      color: 'from-green-500 to-green-600',
      onClick: onAddContact,
    },
    {
      id: 'schedule-meeting',
      label: 'Schedule Meeting',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      onClick: onScheduleMeeting,
    },
    {
      id: 'send-email',
      label: 'Send Email',
      icon: Mail,
      color: 'from-purple-500 to-purple-600',
      onClick: onSendEmail,
    },
    {
      id: 'create-task',
      label: 'New Task',
      icon: Plus,
      color: 'from-orange-500 to-orange-600',
      onClick: onCreateTask,
    },
  ];

  return (
    <Card className="p-4 border border-dark-200/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={() => {
              try {
                action.onClick();
              } catch (e) {
                console.error(`Quick Action failed: ${action.label}`, e);
              }
            }}
            className={`bg-gradient-to-br ${action.color} text-white p-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 flex flex-col items-center space-y-2 group`}
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            <action.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
};
