import React from 'react';
import { Card } from '@/components/common/Card';
import { Plus, Mail, Users, CalendarDays, ClipboardList } from 'lucide-react';

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
  return (
    <Card className="flex flex-wrap justify-between items-center p-4 gap-4 bg-dark-100 border border-dark-300 text-white">
      <button
        onClick={onCreateDeal}
        className="flex items-center space-x-2 px-4 py-2 rounded-md bg-gradient-to-r from-accent to-purple-500 hover:opacity-90 transition"
      >
        <Plus className="w-4 h-4" />
        <span>Create Deal</span>
      </button>

      <button
        onClick={onAddContact}
        className="flex items-center space-x-2 px-4 py-2 rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 transition"
      >
        <Users className="w-4 h-4" />
        <span>Add Contact</span>
      </button>

      <button
        onClick={onScheduleMeeting}
        className="flex items-center space-x-2 px-4 py-2 rounded-md bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 transition"
      >
        <CalendarDays className="w-4 h-4" />
        <span>Schedule Meeting</span>
      </button>

      <button
        onClick={onSendEmail}
        className="flex items-center space-x-2 px-4 py-2 rounded-md bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 transition"
      >
        <Mail className="w-4 h-4" />
        <span>Send Email</span>
      </button>

      <button
        onClick={onCreateTask}
        className="flex items-center space-x-2 px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition"
      >
        <ClipboardList className="w-4 h-4" />
        <span>Create Task</span>
      </button>
    </Card>
  );
};
