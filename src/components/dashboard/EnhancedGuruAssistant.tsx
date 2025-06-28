import React from 'react';
import { Card } from '@/components/common/Card';
import { Bot, MessageSquareText, Rocket } from 'lucide-react';

interface EnhancedGuruAssistantProps {
  userName: string;
}

export const EnhancedGuruAssistant: React.FC<EnhancedGuruAssistantProps> = ({
  userName,
}) => {
  const handleClick = (question: string) => {
    const guruButton = document.querySelector(
      '.fixed.bottom-6.right-6.w-14.h-14'
    ) as HTMLElement;

    if (guruButton) {
      guruButton.click();

      setTimeout(() => {
        const input = document.querySelector(
          '.bg-dark-200.border.border-dark-300.rounded-lg.px-3.py-2.text-white'
        ) as HTMLInputElement;
        if (input) {
          input.value = question;
          input.focus();
        }
      }, 300);
    }
  };

  return (
    <Card className="p-6 border border-dark-300 bg-dark-100/60 mt-6">
      <div className="flex items-center space-x-4 mb-4">
        <Bot className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-semibold text-white">
          Guru Suggestions for {userName}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() =>
            handleClick('What are my most urgent tasks today?')
          }
          className="p-4 bg-dark-200 rounded-lg hover:bg-dark-300 transition text-left"
        >
          <div className="flex items-center space-x-2 mb-2">
            <MessageSquareText className="w-5 h-5 text-accent" />
            <h4 className="text-white font-medium">Urgent Tasks</h4>
          </div>
          <p className="text-sm text-dark-400">
            Ask Guru to highlight today’s top priorities.
          </p>
        </button>

        <button
          onClick={() => handleClick('Where are deals getting stuck?')}
          className="p-4 bg-dark-200 rounded-lg hover:bg-dark-300 transition text-left"
        >
          <div className="flex items-center space-x-2 mb-2">
            <MessageSquareText className="w-5 h-5 text-yellow-400" />
            <h4 className="text-white font-medium">Deal Bottlenecks</h4>
          </div>
          <p className="text-sm text-dark-400">
            Let Guru analyze and surface pipeline friction.
          </p>
        </button>

        <button
          onClick={() =>
            handleClick('Give me weekly performance insights.')
          }
          className="p-4 bg-dark-200 rounded-lg hover:bg-dark-300 transition text-left"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Rocket className="w-5 h-5 text-green-400" />
            <h4 className="text-white font-medium">Performance Recap</h4>
          </div>
          <p className="text-sm text-dark-400">
            Ask for a summary of your sales performance.
          </p>
        </button>
      </div>
    </Card>
  );
};
