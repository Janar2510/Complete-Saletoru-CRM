import { supabase } from './supabase';
import { DealsAPI } from './deals-api';
import { ContactsAPI } from './contacts-api';
import { 
  AILog, 
  AISession, 
  AIPreferences, 
  ChatMessage, 
  AIAnalytics, 
  AIContext,
  AIKnowledgeBase,
  AICommandTemplate,
  PipelineAnalysis,
  LeadPrioritization,
  EmailDraft,
  UserPerformance
} from '../types/ai';

export class AIAPI {
  private static currentSession: AISession | null = null;
  private static messageHistory: ChatMessage[] = [];

  // Session Management
  static async getCurrentSession(): Promise<AISession | null> {
    if (this.currentSession && new Date(this.currentSession.expires_at) > new Date()) {
      return this.currentSession;
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    // Get or create active session
    let { data: session } = await supabase
      .from('ai_sessions')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('is_active', true)
      .order('last_activity_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session || new Date(session.expires_at) <= new Date()) {
      // Create new session
      const { data: newSession, error } = await supabase
        .from('ai_sessions')
        .insert({
          user_id: user.user.id,
          session_name: `Session ${new Date().toLocaleDateString()}`,
          context_summary: 'New chat session',
        })
        .select()
        .single();

      if (error) throw error;
      session = newSession;
    }

    this.currentSession = session;
    await this.loadSessionHistory(session.id);
    return session;
  }

  static async loadSessionHistory(sessionId: string): Promise<ChatMessage[]> {
    const { data: logs, error } = await supabase
      .from('ai_logs')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) throw error;

    this.messageHistory = [];
    logs?.forEach(log => {
      this.messageHistory.push({
        id: `user-${log.id}`,
        type: 'user',
        content: log.prompt_text,
        timestamp: new Date(log.created_at),
      });
      this.messageHistory.push({
        id: `assistant-${log.id}`,
        type: 'assistant',
        content: log.response_text,
        timestamp: new Date(log.created_at),
        confidence: log.confidence_score,
      });
    });

    return this.messageHistory;
  }

  static getMessageHistory(): ChatMessage[] {
    return this.messageHistory;
  }

  // AI Processing
  static async processMessage(message: string, context?: AIContext): Promise<ChatMessage> {
    const session = await this.getCurrentSession();
    if (!session) throw new Error('No active session');

    const startTime = Date.now();
    
    try {
      // Call the AI assistant edge function
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-assistant/api/process-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          message,
          context: context || {
            user_role: 'user',
            permissions: ['read', 'write'],
            recent_activity: [],
            current_page: window.location.pathname,
            selected_entities: []
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error calling AI assistant: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Create chat message from response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: result.content,
        timestamp: new Date(),
        confidence: result.confidence,
        actions: result.actions
      };
      
      return assistantMessage;
    } catch (error) {
      console.error('Error processing AI message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };

      await this.logInteraction(
        session.id,
        message,
        errorMessage.content,
        'error',
        context,
        Date.now() - startTime,
        0
      );

      return errorMessage;
    }
  }

  // Enhanced CRM Intelligence Methods
  static async getPipelineAnalysis(): Promise<PipelineAnalysis> {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-assistant/api/pipeline-analysis`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error getting pipeline analysis: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting pipeline analysis:', error);
      throw error;
    }
  }
  
  static async getTopLeads(count: number = 3): Promise<any[]> {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-assistant/api/top-leads?count=${count}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error getting top leads: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting top leads:', error);
      throw error;
    }
  }
  
  static async generateEmailDraft(dealId: string, purpose: string): Promise<EmailDraft> {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-assistant/api/email-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          dealId,
          purpose
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error generating email draft: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating email draft:', error);
      throw error;
    }
  }
  
  static async getUserPerformance(userId: string): Promise<UserPerformance> {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-assistant/api/user-performance/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error getting user performance: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting user performance:', error);
      throw error;
    }
  }

  // User Preferences
  static async getUserPreferences(userId: string): Promise<AIPreferences> {
    const { data: preferences, error } = await supabase
      .from('ai_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !preferences) {
      // Create default preferences
      const defaultPrefs = {
        user_id: userId,
        response_style: 'professional' as const,
        auto_suggestions: true,
        digest_frequency: 'daily' as const,
        preferred_timezone: 'UTC',
        notification_settings: { mentions: true, digests: true, alerts: true },
        data_access_level: 'full' as const,
      };

      try {
        const { data: newPrefs, error: insertError } = await supabase
          .from('ai_preferences')
          .insert(defaultPrefs)
          .select()
          .single();

        if (insertError) {
          console.warn('Could not create AI preferences:', insertError);
          // Return default preferences without saving to database
          return defaultPrefs as any;
        }

        return newPrefs;
      } catch (insertError) {
        console.warn('Could not create AI preferences:', insertError);
        // Return default preferences without saving to database
        return defaultPrefs as any;
      }
    }

    return preferences;
  }

  static async updateUserPreferences(userId: string, preferences: Partial<AIPreferences>): Promise<void> {
    const { error } = await supabase
      .from('ai_preferences')
      .update(preferences)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Logging
  private static async logInteraction(
    sessionId: string,
    prompt: string,
    response: string,
    responseType: string,
    context?: any,
    processingTime?: number,
    confidence?: number
  ): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    await supabase
      .from('ai_logs')
      .insert({
        session_id: sessionId,
        user_id: user.user.id,
        prompt_text: prompt,
        response_text: response,
        response_type: responseType,
        context_data: context,
        processing_time_ms: processingTime,
        confidence_score: confidence,
      });
  }

  // Analytics
  static async getAIAnalytics(userId: string, timeRange: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    const startDate = new Date();
    switch (timeRange) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const { data: logs } = await supabase
      .from('ai_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    return {
      total_interactions: logs?.length || 0,
      avg_confidence: logs?.reduce((sum, log) => sum + (log.confidence_score || 0), 0) / (logs?.length || 1),
      response_types: logs?.reduce((acc, log) => {
        acc[log.response_type] = (acc[log.response_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      avg_processing_time: logs?.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0) / (logs?.length || 1),
    };
  }

  // Digest Generation
  static async generateDigest(userId: string, frequency: 'daily' | 'weekly' | 'monthly'): Promise<string> {
    const deals = await DealsAPI.getDeals();
    const contacts = await ContactsAPI.getContacts();
    
    const digest = `📊 **Your ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Digest**\n\n**Pipeline Update**\n• ${deals.length} active deals\n• $${deals.reduce((sum, deal) => sum + deal.value, 0).toLocaleString()} in pipeline\n\n**Contacts**\n• ${contacts.length} total contacts\n• ${contacts.filter(c => c.status === 'active').length} active contacts\n\n**Recommendations**\n• Follow up on stale deals\n• Update contact information\n• Review pipeline performance`;

    return digest;
  }
}

// Supabase URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';