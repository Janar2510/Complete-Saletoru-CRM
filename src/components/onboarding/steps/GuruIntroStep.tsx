import React, { useState } from 'react';
import { Bot, Sparkles, MessageSquare, Zap, Target, User } from 'lucide-react';

interface GuruIntroStepProps {
  data: any;
  setData: (data: any) => void;
}

export const GuruIntroStep: React.FC<GuruIntroStepProps> = ({ data, setData }) => {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  
  const samplePrompts = [
    "Help me write an email to a new lead",
    "Explain how pipelines work",
    "Give me tips for starting with CRM",
    "How do I track my sales performance?",
    "What's the best way to organize contacts?",
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 flex items-center justify-center">
          <img src="https://i.imgur.com/Zylpdjy.png" alt="SaleToru Logo" className="w-16 h-16" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center">
            <span>Meet SaleToruGuru</span>
            <Sparkles className="w-4 h-4 text-yellow-400 ml-2" />
          </h3>
          <p className="text-dark-400">Your AI-powered sales assistant</p>
        </div>
      </div>
      
      <p className="text-dark-400">
        SaleToruGuru is your AI assistant that helps you manage your sales process, analyze data, and get insights to close more deals. Here's what Guru can do for you:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-200/50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <h4 className="font-medium text-white">Smart Suggestions</h4>
          </div>
          <p className="text-sm text-dark-400">
            Get personalized suggestions for follow-ups, tasks, and next steps based on your deals and contacts.
          </p>
        </div>
        
        <div className="bg-dark-200/50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h4 className="font-medium text-white">Automation</h4>
          </div>
          <p className="text-sm text-dark-400">
            Automate repetitive tasks like data entry, email follow-ups, and activity logging.
          </p>
        </div>
        
        <div className="bg-dark-200/50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Target className="w-5 h-5 text-green-400" />
            <h4 className="font-medium text-white">Insights</h4>
          </div>
          <p className="text-sm text-dark-400">
            Get data-driven insights about your sales performance, pipeline health, and customer engagement.
          </p>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Try asking Guru</h3>
        <div className="space-y-2">
          {samplePrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => setSelectedPrompt(prompt)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedPrompt === prompt
                  ? 'bg-accent text-white'
                  : 'bg-dark-200/50 text-dark-400 hover:bg-dark-200 hover:text-white'
              }`}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
      
      {selectedPrompt && (
        <div className="bg-dark-200/50 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              <img src="https://i.imgur.com/Zylpdjy.png" alt="SaleToru Logo" className="w-8 h-8" />
            </div>
            <div>
              <p className="text-dark-400 text-sm mb-2">You asked:</p>
              <p className="text-white mb-3">{selectedPrompt}</p>
              <div className="bg-dark-300/50 p-3 rounded-lg">
                <p className="text-white text-sm">
                  {selectedPrompt === "Help me write an email to a new lead" ? (
                    "I'd be happy to help you write an email to a new lead! Here's a template you can use:\n\nSubject: Following up on our conversation\n\nHi [First Name],\n\nI hope this email finds you well. I wanted to follow up on our recent conversation about [Topic/Product/Service].\n\nBased on what you shared about [their specific need/pain point], I believe we can help by [brief value proposition].\n\nWould you be available for a quick 15-minute call this week to discuss this further?\n\nBest regards,\n[Your Name]"
                  ) : selectedPrompt === "Explain how pipelines work" ? (
                    "Sales pipelines in SaleToru CRM represent the stages a deal goes through from initial contact to closing. Each stage has a probability percentage that helps forecast revenue. You can customize stages to match your sales process, and deals move through the pipeline as they progress. This gives you a visual overview of your sales process and helps identify bottlenecks."
                  ) : selectedPrompt === "Give me tips for starting with CRM" ? (
                    "Here are some tips to get started with SaleToru CRM:\n\n1. Import your existing contacts and deals\n2. Customize your pipeline stages to match your sales process\n3. Connect your email to track conversations\n4. Set up regular check-ins with your team\n5. Use tags to organize contacts and deals\n6. Create email templates for common responses\n7. Review the dashboard regularly for insights"
                  ) : selectedPrompt === "How do I track my sales performance?" ? (
                    "To track your sales performance in SaleToru CRM:\n\n1. Check your Dashboard for key metrics\n2. Use the Reports section for detailed analytics\n3. Monitor your deal conversion rates between stages\n4. Track your activity metrics (calls, emails, meetings)\n5. Set up goals and compare actual vs. target\n6. Review win/loss reasons to improve your approach"
                  ) : (
                    "The best way to organize contacts in SaleToru CRM is to:\n\n1. Use tags for categorization (e.g., 'decision-maker', 'influencer')\n2. Group contacts by company\n3. Assign owners to ensure accountability\n4. Use custom fields for industry-specific information\n5. Set up lead scoring to prioritize high-value contacts\n6. Create segments for targeted communication"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};