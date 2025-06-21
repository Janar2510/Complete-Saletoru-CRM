import { useState, useEffect, useCallback } from 'react';
import { AIAPI } from '../lib/ai-api';
import { AIContextManager } from '../lib/ai-context';
import { ChatMessage, AISession, AIPreferences } from '../types/ai';
import { useAuth } from '../contexts/AuthContext';

export const useAIAssistant = () => {
  const { user } = useAuth();
  const [session, setSession] = useState<AISession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [preferences, setPreferences] = useState<AIPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      initializeAI();
    }
  }, [user]);

  const initializeAI = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize session
      const currentSession = await AIAPI.getCurrentSession();
      setSession(currentSession);

      // Load message history
      if (currentSession) {
        const history = AIAPI.getMessageHistory();
        setMessages(history);
      }

      // Load user preferences
      if (user) {
        const userPrefs = await AIAPI.getUserPreferences(user.id);
        setPreferences(userPrefs);
      }
    } catch (err) {
      console.error('Error initializing AI:', err);
      setError('Failed to initialize AI assistant');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const sendMessage = useCallback(async (message: string): Promise<ChatMessage | null> => {
    if (!message.trim() || isLoading) return null;

    try {
      setIsLoading(true);
      setError(null);

      // Add user message to the chat
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: message,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Ensure we have a session before processing
      let currentSession = session;
      if (!currentSession) {
        currentSession = await AIAPI.getCurrentSession();
        setSession(currentSession);
      }

      // Get current context
      const context = AIContextManager.getContext();
      
      // Process message with AI, passing the current session
      const response = await AIAPI.processMessage(message, context, currentSession);
      
      // Add AI response to the chat
      setMessages(prev => [...prev, response]);
      
      return response;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, session]);

  const updatePreferences = useCallback(async (newPreferences: Partial<AIPreferences>) => {
    if (!user || !preferences) return;

    try {
      await AIAPI.updateUserPreferences(user.id, newPreferences);
      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Failed to update preferences');
    }
  }, [user, preferences]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const generateDigest = useCallback(async (frequency: 'daily' | 'weekly' | 'monthly') => {
    if (!user) return null;

    try {
      const digest = await AIAPI.generateDigest(user.id, frequency);
      return digest;
    } catch (err) {
      console.error('Error generating digest:', err);
      return null;
    }
  }, [user]);

  const getAnalytics = useCallback(async (timeRange: 'day' | 'week' | 'month' = 'week') => {
    if (!user) return null;

    try {
      const analytics = await AIAPI.getAIAnalytics(user.id, timeRange);
      return analytics;
    } catch (err) {
      console.error('Error getting analytics:', err);
      return null;
    }
  }, [user]);

  // New methods for enhanced CRM intelligence
  const getPipelineAnalysis = useCallback(async () => {
    try {
      return await AIAPI.getPipelineAnalysis();
    } catch (err) {
      console.error('Error getting pipeline analysis:', err);
      return null;
    }
  }, []);

  const getTopLeads = useCallback(async (count: number = 3) => {
    try {
      return await AIAPI.getTopLeads(count);
    } catch (err) {
      console.error('Error getting top leads:', err);
      return null;
    }
  }, []);

  const generateEmailDraft = useCallback(async (dealId: string, purpose: string) => {
    try {
      return await AIAPI.generateEmailDraft(dealId, purpose);
    } catch (err) {
      console.error('Error generating email draft:', err);
      return null;
    }
  }, []);

  const getUserPerformance = useCallback(async (userId: string) => {
    try {
      return await AIAPI.getUserPerformance(userId);
    } catch (err) {
      console.error('Error getting user performance:', err);
      return null;
    }
  }, []);

  return {
    session,
    messages,
    preferences,
    isLoading,
    error,
    sendMessage,
    updatePreferences,
    clearMessages,
    generateDigest,
    getAnalytics,
    initializeAI,
    // New enhanced methods
    getPipelineAnalysis,
    getTopLeads,
    generateEmailDraft,
    getUserPerformance
  };
};