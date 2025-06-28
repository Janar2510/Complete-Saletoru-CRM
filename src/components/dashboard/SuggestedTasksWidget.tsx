// SuggestedTasksWidget.tsx

import React from 'react';
import { ClipboardCheck, Lightbulb } from 'lucide-react';
import { Card } from '../common/Card';

export const SuggestedTasksWidget: React.FC = () => {
  const suggestedTasks = [
    {
      id: '1',
      title: 'Follow up with warm leads',
      icon: ClipboardCheck,
    },
    {
      id: '2',
      title: 'Draft Q3 sales email sequence',
      icon: Lightbulb,
    },
    {
      id: '3',
      title: 'Schedule feedback sync with team',
      icon: ClipboardCheck,
    },
  ];

  return (
    <Card className="p-4 border border-dark-200/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Suggested Tasks</h3>
      </div>

      <ul className="space-y-2">
        {suggestedTasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center space-x-3 bg-dark-200 rounded-md px-3 py-2 hover:bg-dark-100 transition-all"
          >
            <task.icon className="w-5 h-5 text-accent" />
            <span className="text-sm text-white">{task.title}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};
