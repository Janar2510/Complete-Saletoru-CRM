import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Minimize2, 
  Maximize2, 
  Sparkles, 
  MessageCircle,
  Settings,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  ExternalLink,
  Lock,
  TrendingUp,
  User,
  Calendar,
  Mail,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useAIAssistant } from '../../hooks/useAIAssistant';
import { ChatMessage, AIPreferences } from '../../types/ai';
import { useAuth } from '../../contexts/AuthContext';
import { usePlan } from '../../contexts/PlanContext';
import { useFeatureLock } from '../../hooks/useFeatureLock';
import { Card } from '../common/Card';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

interface SaleToruGuruProps {
  className?: string;
}

export const SaleToruGuru: React.FC<SaleToruGuruProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { currentPlan } = usePlan();
  const { withFeatureAccess, FeatureLockModal } = useFeatureLock(currentPlan);
  
  const { 
    messages, 
    preferences, 
    isLoading, 
    error, 
    sendMessage, 
    updatePreferences, 
    clearMessages,
    getAnalytics
  } = useAIAssistant();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [message, setMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && currentPlan === 'team') {
      loadAnalytics();
    }
  }, [isOpen, currentPlan]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAnalytics = async () => {
    try {
      const data = await getAnalytics('week');
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading AI analytics:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    // For Team plan, process normally
    if (currentPlan === 'team') {
      await sendMessage(message);
      setMessage('');
    } 
    // For Pro plan, provide limited responses
    else if (currentPlan === 'pro') {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: message,
        timestamp: new Date(),
      };

      const limitedResponse: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: "I can help with basic CRM questions and finding information. For advanced AI features like suggestions, analysis, and proactive insights, please upgrade to the Team plan.",
        timestamp: new Date(),
        confidence: 0.9,
      };
      
      setMessage('');
    }
    // For Starter plan, show upgrade message
    else {
      withFeatureAccess('ai_assistant', () => {
        // This won't execute since the feature is locked
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionClick = (action: any) => {
    switch (action.action) {
      case 'navigate':
        window.location.href = action.data.path;
        break;
      case 'suggest':
        setMessage(action.data.message);
        break;
      case 'modal':
        // Handle modal opening
        console.log('Open modal:', action.data);
        break;
      default:
        console.log('Action:', action);
    }
  };

  const handleClearChat = () => {
    clearMessages();
    setMessage('');
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const quickSuggestions = [
    "Where are we losing deals?",
    "Who are the top 3 leads?",
    "Draft follow-up for Enterprise Software Package deal",
    "How's John doing?",
    "Summarize my pipeline",
    "Which leads need attention?",
  ];

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-dark-400';
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const chatSize = isFullScreen 
    ? 'fixed inset-4 w-auto h-auto' 
    : isMinimized 
    ? 'w-80 h-16' 
    : 'w-96 h-[600px]';

  return (
    <>
      {/* Floating Guru Button */}
      <button
        onClick={() => {
          if (currentPlan === 'starter') {
            withFeatureAccess('ai_assistant', () => setIsOpen(true));
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-accent to-purple-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group ${className}`}
        style={{
          animation: isOpen ? 'none' : 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
        title={currentPlan === 'starter' ? 'Upgrade to Team plan to unlock AI assistant' : 'Try me: "Summarize this pipeline"'}
      >
        {currentPlan === 'starter' ? (
          <Lock className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        ) : (
          <Bot className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        )}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full border-2 border-background animate-pulse" />
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-surface border border-dark-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          <p className="text-sm text-white">
            {currentPlan === 'starter' 
              ? 'Upgrade to Team plan to unlock AI assistant' 
              : 'Try me: "Summarize my pipeline"'}
          </p>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-surface"></div>
        </div>
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 bg-surface border border-dark-200 rounded-xl shadow-2xl z-40 transition-all duration-300 ${chatSize}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center relative">
                <img src="https://i.imgur.com/Zylpdjy.png" alt="SaleToru Logo" className="w-8 h-8" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-surface" />
              </div>
              <div>
                <h3 className="font-semibold text-white flex items-center space-x-1">
                  <span>SaleToruGuru</span>
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                </h3>
                <p className="text-xs text-green-400">Online • Ready to help</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              {!isFullScreen && (
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded-lg hover:bg-dark-200 transition-colors"
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4 text-dark-400" />
                  ) : (
                    <Minimize2 className="w-4 h-4 text-dark-400" />
                  )}
                </button>
              )}
              
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 rounded-lg hover:bg-dark-200 transition-colors"
                title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                <ExternalLink className="w-4 h-4 text-dark-400" />
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 rounded-lg hover:bg-dark-200 transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4 text-dark-400" />
              </button>
              
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg hover:bg-dark-200 transition-colors"
                title="Clear Chat"
              >
                <RotateCcw className="w-4 h-4 text-dark-400" />
              </button>
              
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-dark-200 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-dark-400" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto" style={{ height: isFullScreen ? 'calc(100vh - 200px)' : '400px' }}>
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-xs">
                      <div className="w-12 h-12 mx-auto mb-4">
                        <img src="https://i.imgur.com/Zylpdjy.png" alt="SaleToru Logo" className="w-full h-full" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        SaleToruGuru AI Assistant
                      </h3>
                      <p className="text-dark-400 mb-4">
                        I can help with pipeline analysis, lead prioritization, email suggestions, and more.
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm text-white">Try asking:</p>
                        <div className="flex flex-wrap gap-2">
                          {quickSuggestions.slice(0, 3).map(suggestion => (
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
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                          msg.type === 'user'
                            ? 'bg-accent text-white'
                            : 'bg-dark-200 text-white'
                        }`}>
                          {msg.type === 'assistant' ? (
                            <MarkdownRenderer content={msg.content} />
                          ) : (
                            <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                          )}
                          
                          {/* Message Actions */}
                          {msg.actions && msg.actions.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {msg.actions.map(action => (
                                <button
                                  key={action.id}
                                  onClick={() => handleActionClick(action)}
                                  className="block w-full text-left px-3 py-2 bg-accent/20 hover:bg-accent/30 rounded-lg text-sm transition-colors"
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {/* Message Footer */}
                          <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                            <span>
                              {msg.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            
                            <div className="flex items-center space-x-2">
                              {msg.confidence && (
                                <span className={`${getConfidenceColor(msg.confidence)}`}>
                                  {Math.round(msg.confidence * 100)}%
                                </span>
                              )}
                              
                              {msg.type === 'assistant' && (
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => handleCopyMessage(msg.content)}
                                    className="hover:text-white transition-colors"
                                    title="Copy message"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  <button className="hover:text-white transition-colors" title="Good response">
                                    <ThumbsUp className="w-3 h-3" />
                                  </button>
                                  <button className="hover:text-white transition-colors" title="Poor response">
                                    <ThumbsDown className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-dark-200 text-white px-4 py-3 rounded-lg">
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
              {messages.length <= 1 && (
                <div className="px-4 py-2 border-t border-dark-200">
                  <p className="text-xs text-dark-400 mb-2">Quick suggestions:</p>
                  <div className="flex flex-wrap gap-1">
                    {quickSuggestions.slice(0, 3).map(suggestion => (
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
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={currentPlan === 'starter' ? 'Upgrade to Team plan to use AI assistant' : "Ask Guru anything... (@Guru for mentions)"}
                    className="flex-1 bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
                    disabled={isLoading || currentPlan === 'starter'}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isLoading || currentPlan === 'starter'}
                    className="bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {currentPlan === 'starter' && (
                  <p className="text-xs text-yellow-400 mt-2 flex items-center">
                    <Lock className="w-3 h-3 mr-1" />
                    Upgrade to Team plan to unlock AI assistant features
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && isOpen && (
        <div className="fixed bottom-24 right-[420px] w-80 bg-surface border border-dark-200 rounded-xl shadow-2xl z-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">AI Preferences</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 rounded hover:bg-dark-200 transition-colors"
            >
              <X className="w-4 h-4 text-dark-400" />
            </button>
          </div>
          
          {preferences && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Response Style</label>
                <select
                  value={preferences.response_style}
                  onChange={(e) => updatePreferences({ response_style: e.target.value as any })}
                  className="w-full bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={currentPlan !== 'team'}
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="detailed">Detailed</option>
                  <option value="concise">Concise</option>
                </select>
                {currentPlan !== 'team' && (
                  <p className="text-xs text-yellow-400 mt-1 flex items-center">
                    <Lock className="w-3 h-3 mr-1" />
                    Available on Team plan
                  </p>
                )}
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={preferences.auto_suggestions}
                    onChange={(e) => updatePreferences({ auto_suggestions: e.target.checked })}
                    className="rounded border-dark-300 text-accent focus:ring-accent"
                    disabled={currentPlan !== 'team'}
                  />
                  <span className="text-sm text-white">Auto suggestions</span>
                </label>
                {currentPlan !== 'team' && (
                  <p className="text-xs text-yellow-400 mt-1 flex items-center">
                    <Lock className="w-3 h-3 mr-1" />
                    Available on Team plan
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Digest Frequency</label>
                <select
                  value={preferences.digest_frequency}
                  onChange={(e) => updatePreferences({ digest_frequency: e.target.value as any })}
                  className="w-full bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={currentPlan !== 'team'}
                >
                  <option value="never">Never</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                {currentPlan !== 'team' && (
                  <p className="text-xs text-yellow-400 mt-1 flex items-center">
                    <Lock className="w-3 h-3 mr-1" />
                    Available on Team plan
                  </p>
                )}
              </div>
              
              {currentPlan === 'team' && analyticsData && (
                <div className="mt-4 pt-4 border-t border-dark-200">
                  <h4 className="font-medium text-white mb-3">AI Usage Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dark-400">Total Interactions</span>
                      <span className="text-white">{analyticsData.total_interactions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Avg. Confidence</span>
                      <span className="text-white">{(analyticsData.avg_confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Avg. Response Time</span>
                      <span className="text-white">{(analyticsData.avg_processing_time / 1000).toFixed(2)}s</span>
                    </div>
                  </div>
                </div>
              )}
              
              {currentPlan !== 'team' && (
                <div className="text-center mt-4">
                  <a href="/pricing" className="text-accent hover:text-accent/80 text-sm">
                    Upgrade to Team plan to unlock all AI features
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <FeatureLockModal />
    </>
  );
};