/*
  # SaleToruGuru AI Assistant System

  1. New Tables
    - `ai_logs` - Stores all AI interactions and responses
    - `ai_sessions` - Manages user chat sessions
    - `ai_preferences` - User-specific AI settings and preferences
    - `ai_knowledge_base` - Stores AI training data and context
  
  2. Security
    - Enable RLS on all AI tables
    - Add policies for authenticated users to manage their own data
    - Secure session management and data access controls
  
  3. Features
    - Session continuity across page refreshes
    - Role-based data access for AI responses
    - Comprehensive logging for analytics and improvement
*/

-- AI Logs table for storing all interactions
CREATE TABLE IF NOT EXISTS ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  prompt_text text NOT NULL,
  response_text text NOT NULL,
  response_type text DEFAULT 'general' CHECK (response_type IN ('general', 'analytics', 'suggestion', 'command', 'error')),
  context_data jsonb DEFAULT '{}',
  processing_time_ms integer,
  tokens_used integer,
  confidence_score numeric(3,2),
  feedback_rating integer CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  created_at timestamptz DEFAULT now()
);

-- AI Sessions table for managing chat continuity
CREATE TABLE IF NOT EXISTS ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  session_name text,
  context_summary text,
  last_activity_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  session_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- AI Preferences table for user customization
CREATE TABLE IF NOT EXISTS ai_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  response_style text DEFAULT 'professional' CHECK (response_style IN ('professional', 'casual', 'detailed', 'concise')),
  auto_suggestions boolean DEFAULT true,
  digest_frequency text DEFAULT 'daily' CHECK (digest_frequency IN ('never', 'daily', 'weekly', 'monthly')),
  preferred_timezone text DEFAULT 'UTC',
  notification_settings jsonb DEFAULT '{"mentions": true, "digests": true, "alerts": true}',
  data_access_level text DEFAULT 'full' CHECK (data_access_level IN ('limited', 'standard', 'full')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Knowledge Base for contextual responses
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('deals', 'contacts', 'companies', 'analytics', 'workflows', 'general')),
  topic text NOT NULL,
  content text NOT NULL,
  keywords text[] DEFAULT '{}',
  relevance_score numeric(3,2) DEFAULT 1.0,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Command Templates for quick responses
CREATE TABLE IF NOT EXISTS ai_command_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  command_name text UNIQUE NOT NULL,
  command_pattern text NOT NULL,
  response_template text NOT NULL,
  required_permissions text[] DEFAULT '{}',
  category text NOT NULL,
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_command_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own AI logs" ON ai_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own AI sessions" ON ai_sessions
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own AI preferences" ON ai_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can read AI knowledge base" ON ai_knowledge_base
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can read AI command templates" ON ai_command_templates
  FOR SELECT TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_logs_session_id ON ai_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_id ON ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_active ON ai_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_last_activity ON ai_sessions(last_activity_at);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_category ON ai_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_keywords ON ai_knowledge_base USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_search ON ai_knowledge_base USING gin(to_tsvector('english', topic || ' ' || content));

-- Triggers for updated_at
CREATE TRIGGER update_ai_preferences_updated_at BEFORE UPDATE ON ai_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_knowledge_base_updated_at BEFORE UPDATE ON ai_knowledge_base 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default AI preferences for existing users
INSERT INTO ai_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM ai_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Insert default command templates
INSERT INTO ai_command_templates (command_name, command_pattern, response_template, category) VALUES
('pipeline_summary', 'summarize.*pipeline|pipeline.*summary', 'Here''s your pipeline summary: {pipeline_data}', 'analytics'),
('deal_analysis', 'analyze.*deals?|deals?.*analysis', 'Based on your deals data: {deal_insights}', 'analytics'),
('contact_search', 'find.*contact|search.*contact', 'I found these contacts: {contact_results}', 'contacts'),
('task_reminder', 'remind.*task|task.*reminder', 'Here are your upcoming tasks: {task_list}', 'productivity'),
('performance_metrics', 'performance|metrics|stats', 'Your performance metrics: {metrics_data}', 'analytics')
ON CONFLICT (command_name) DO NOTHING;

-- Insert knowledge base entries
INSERT INTO ai_knowledge_base (category, topic, content, keywords) VALUES
('deals', 'Pipeline Management', 'Pipeline management involves tracking deals through various stages from lead to close. Key metrics include conversion rates, average deal size, and sales velocity.', ARRAY['pipeline', 'deals', 'stages', 'conversion']),
('contacts', 'Contact Organization', 'Effective contact management requires proper categorization, regular follow-ups, and maintaining accurate contact information.', ARRAY['contacts', 'organization', 'follow-up', 'management']),
('analytics', 'Sales Metrics', 'Important sales metrics include win rate, average deal size, sales cycle length, and pipeline velocity.', ARRAY['metrics', 'analytics', 'sales', 'performance']),
('workflows', 'Automation Best Practices', 'Automation can streamline repetitive tasks like follow-up emails, task assignments, and data entry.', ARRAY['automation', 'workflows', 'efficiency', 'tasks'])
ON CONFLICT DO NOTHING;