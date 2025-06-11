import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Minimize2, 
  Maximize2, 
  Sparkles,
  TrendingUp,
  User,
  Target,
  Mail,
  Calendar
} from 'lucide-react';
import { useAIAssistant } from '../../hooks/useAIAssistant';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

interface EnhancedGuruAssistantProps {
  userName: string;
}

export const EnhancedGuruAssistant: React.FC<EnhancedGuruAssistantProps> = ({ userName }) => {
  const { 
    messages, 
    isLoading, 
    sendMessage,
    getPipelineAnalysis,
    getTopLeads
  } = useAIAssistant();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [insights, setInsights] = useState<any>(null);
  const [topLeads, setTopLeads] = useState<any[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !insights) {
      loadInsights();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadInsights = async () => {
    try {
      setLoadingInsights(true);
      
      // Load pipeline analysis
      const pipelineData = await getPipelineAnalysis();
      
      // Load top leads
      const leadsData = await getTopLeads(3);
      
      setInsights(pipelineData);
      setTopLeads(leadsData || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    await sendMessage(message);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick suggestions based on CRM intelligence
  const quickSuggestions = [
    "Where are we losing deals?",
    "Who are my top leads?",
    "Draft follow-up email",
    "Summarize my pipeline"
  ];

  return (
    <>
      {/* Floating Guru Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-accent to-purple-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group"
        style={{
          animation: isOpen ? 'none' : 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      >
        <Bot className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full border-2 border-background animate-pulse" />
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 bg-surface border border-dark-200 rounded-xl shadow-2xl z-40 transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-dark-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center relative">
                <img src="https://i.imgur.com/Zylpdjy.png" alt="SaleToru Logo" className="w-8 h-8" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-surface" />
              </div>
              <div>
                <h3 className="font-semibold text-white flex items-center space-x-1">
                  <span>Guru</span>
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                </h3>
                <p className="text-xs text-green-400">Online • Ready to help</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-dark-200 transition-colors"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4 text-dark-400" />
                ) : (
                  <Minimize2 className="w-4 h-4 text-dark-400" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-dark-200 transition-colors"
              >
                <X className="w-4 h-4 text-dark-400" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto h-[calc(100%-140px)]">
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    {/* Welcome Message */}
                    <div className="flex justify-start">
                      <div className="bg-dark-200 text-white px-4 py-3 rounded-lg max-w-xs">
                        <p className="text-sm">
                          Hi {userName}! I'm your AI sales assistant. I can help with pipeline analysis, lead prioritization, and more.
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date().toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {/* CRM Insights */}
                    {!loadingInsights && insights && (
                      <div className="bg-gradient-to-r from-accent/10 to-purple-500/10 rounded-lg p-4 mt-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-accent" />
                          <h4 className="font-medium text-white">Quick Insights</h4>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start space-x-2">
                            <Target className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-white">Pipeline Value</p>
                              <p className="text-dark-400">
                                {insights.totalValue ? `$${insights.totalValue.toLocaleString()}` : 'No active deals'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-2">
                            <User className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-white">Top Lead</p>
                              <p className="text-dark-400">
                                {topLeads.length > 0 
                                  ? `${topLeads[0].first_name} ${topLeads[0].last_name} (${topLeads[0].lead_score}/100)` 
                                  : 'No leads with scores'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-2">
                            <Calendar className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-white">Upcoming</p>
                              <p className="text-dark-400">3 tasks due today</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {loadingInsights && (
                      <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.type === 'user'
                              ? 'bg-accent text-white'
                              : 'bg-dark-200 text-white'
                          }`}
                        >
                          {msg.type === 'assistant' ? (
                            <MarkdownRenderer content={msg.content} />
                          ) : (
                            <p className="text-sm">{msg.content}</p>
                          )}
                          <p className="text-xs opacity-70 mt-1">
                            {msg.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-dark-200 text-white px-4 py-2 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestions */}
              {messages.length === 0 && (
                <div className="px-4 py-2 border-t border-dark-200">
                  <p className="text-xs text-dark-400 mb-2">Try asking:</p>
                  <div className="flex flex-wrap gap-1">
                    {quickSuggestions.map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => setMessage(suggestion)}
                        className="text-xs bg-dark-200 hover:bg-dark-300 text-dark-400 hover:text-white px-2 py-1 rounded transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-dark-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Guru anything..."
                    className="flex-1 bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isLoading}
                    className="bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};