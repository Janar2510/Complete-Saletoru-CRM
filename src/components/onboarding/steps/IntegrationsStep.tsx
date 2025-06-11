import React from 'react';
import { Mail, Calendar, Check, ExternalLink } from 'lucide-react';

interface IntegrationsStepProps {
  data: {
    connectEmail: boolean;
    connectCalendar: boolean;
  };
  setData: (data: any) => void;
}

export const IntegrationsStep: React.FC<IntegrationsStepProps> = ({ data, setData }) => {
  const handleToggleEmail = () => {
    setData({
      ...data,
      connectEmail: !data.connectEmail
    });
  };
  
  const handleToggleCalendar = () => {
    setData({
      ...data,
      connectCalendar: !data.connectCalendar
    });
  };
  
  return (
    <div className="space-y-6">
      <p className="text-dark-400">
        Connect your email and calendar to get the most out of SaleToru CRM. These integrations are optional and can be set up later.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          className={`p-6 rounded-lg border-2 transition-colors cursor-pointer ${
            data.connectEmail 
              ? 'border-accent bg-accent/10' 
              : 'border-dark-300 hover:border-dark-200'
          }`}
          onClick={handleToggleEmail}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-400" />
            </div>
            
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              data.connectEmail 
                ? 'bg-accent' 
                : 'bg-dark-300'
            }`}>
              {data.connectEmail && <Check className="w-4 h-4 text-white" />}
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2">Email Integration</h3>
          <p className="text-sm text-dark-400 mb-4">
            Connect your email to track conversations, send emails directly from SaleToru, and get notifications.
          </p>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-1 rounded-full bg-dark-300 text-dark-400">Gmail</span>
            <span className="text-xs px-2 py-1 rounded-full bg-dark-300 text-dark-400">Outlook</span>
            <span className="text-xs px-2 py-1 rounded-full bg-dark-300 text-dark-400">IMAP</span>
          </div>
        </div>
        
        <div 
          className={`p-6 rounded-lg border-2 transition-colors cursor-pointer ${
            data.connectCalendar 
              ? 'border-accent bg-accent/10' 
              : 'border-dark-300 hover:border-dark-200'
          }`}
          onClick={handleToggleCalendar}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-400" />
            </div>
            
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              data.connectCalendar 
                ? 'bg-accent' 
                : 'bg-dark-300'
            }`}>
              {data.connectCalendar && <Check className="w-4 h-4 text-white" />}
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2">Calendar Integration</h3>
          <p className="text-sm text-dark-400 mb-4">
            Connect your calendar to schedule meetings, track events, and sync with your CRM activities.
          </p>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-1 rounded-full bg-dark-300 text-dark-400">Google Calendar</span>
            <span className="text-xs px-2 py-1 rounded-full bg-dark-300 text-dark-400">Outlook Calendar</span>
          </div>
        </div>
      </div>
      
      <div className="bg-dark-200/50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm text-dark-400">
            Need help setting up integrations?
          </p>
          <a 
            href="#" 
            className="text-accent hover:text-accent/80 text-sm flex items-center space-x-1 transition-colors"
          >
            <span>View documentation</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};