-- Jarvis Personal Life Management System
-- PostgreSQL Database Schema
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- =============================================
-- USERS AND AUTHENTICATION
-- =============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    apple_id VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    profile_data JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255),
    device_name VARCHAR(255),
    refresh_token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- LIFE AREAS MANAGEMENT
-- =============================================

CREATE TYPE life_area_type AS ENUM (
    'health',
    'finance', 
    'learning',
    'work',
    'goals',
    'productivity',
    'relationships',
    'hobbies',
    'personal_growth',
    'custom'
);

CREATE TABLE life_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type life_area_type NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(7), -- Hex color code
    configuration JSONB DEFAULT '{}', -- Custom fields, tracking methods, automation rules
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- GOALS AND PROGRESS TRACKING
-- =============================================

CREATE TYPE goal_type AS ENUM (
    'numeric',      -- Specific number target (read 50 books)
    'habit',        -- Daily/weekly habits (workout 3x/week)
    'milestone',    -- Project-based goals (complete course)
    'binary',       -- Yes/No goals (get promotion)
    'custom'        -- Flexible custom tracking
);

CREATE TYPE goal_status AS ENUM (
    'active',
    'completed', 
    'paused',
    'cancelled',
    'archived'
);

CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    life_area_id UUID REFERENCES life_areas(id) ON DELETE CASCADE,
    parent_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL, -- For sub-goals
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type goal_type NOT NULL,
    target_value NUMERIC,
    current_value NUMERIC DEFAULT 0,
    target_unit VARCHAR(50),
    deadline DATE,
    priority INTEGER DEFAULT 3, -- 1-5 scale
    status goal_status DEFAULT 'active',
    metadata JSONB DEFAULT '{}', -- Custom fields, tracking config
    reminder_config JSONB DEFAULT '{}', -- Reminder settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE data_source AS ENUM (
    'manual',
    'apple_health',
    'apple_calendar', 
    'apple_reminders',
    'api_integration',
    'ai_automation',
    'file_import'
);

CREATE TABLE progress_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    value NUMERIC,
    notes TEXT,
    data_source data_source DEFAULT 'manual',
    metadata JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]', -- File references, images, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- AI CHAT SYSTEM (JARVIS)
-- =============================================

CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    context_data JSONB DEFAULT '{}', -- Relevant life areas, goals, recent data
    is_archived BOOLEAN DEFAULT FALSE,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE message_role AS ENUM (
    'user',
    'assistant', 
    'system'
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    tokens_used INTEGER,
    model_used VARCHAR(100),
    processing_time_ms INTEGER,
    metadata JSONB DEFAULT '{}', -- Context references, function calls, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- RESEARCH ENGINE
-- =============================================

CREATE TABLE research_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    research_prompt TEXT NOT NULL,
    schedule_config JSONB DEFAULT '{}', -- Frequency, time, parameters
    target_life_areas UUID[] DEFAULT '{}', -- Array of life_area IDs
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE research_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'approved',
    'rejected',
    'integrated',
    'archived'
);

CREATE TABLE research_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES research_categories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT,
    summary TEXT,
    sources JSONB DEFAULT '[]', -- URLs, references, data sources
    status research_status DEFAULT 'pending',
    quality_score NUMERIC(3,2), -- AI-generated quality score 0-1
    relevance_score NUMERIC(3,2), -- Relevance to user's interests
    research_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    integrated_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- =============================================
-- AUTOMATION AND INTEGRATIONS
-- =============================================

CREATE TYPE trigger_type AS ENUM (
    'schedule',      -- Time-based triggers
    'event',         -- Event-based triggers
    'condition',     -- Condition-based triggers
    'manual'         -- Manual triggers
);

CREATE TYPE action_type AS ENUM (
    'notification',
    'data_update',
    'api_call',
    'ai_task',
    'email',
    'research_trigger'
);

CREATE TABLE automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type trigger_type NOT NULL,
    trigger_config JSONB DEFAULT '{}',
    action_type action_type NOT NULL,
    action_config JSONB DEFAULT '{}',
    conditions JSONB DEFAULT '{}', -- Additional conditions
    is_active BOOLEAN DEFAULT TRUE,
    run_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    trigger_data JSONB DEFAULT '{}',
    action_result JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'success', -- success, failed, partial
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- THIRD-PARTY INTEGRATIONS
-- =============================================

CREATE TYPE integration_provider AS ENUM (
    'apple_health',
    'apple_calendar',
    'apple_reminders',
    'gmail',
    'outlook',
    'google_calendar',
    'notion',
    'todoist',
    'github',
    'twitter',
    'linkedin',
    'custom_api'
);

CREATE TABLE integration_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider integration_provider NOT NULL,
    connection_data JSONB DEFAULT '{}', -- Tokens, config, mapping rules
    sync_config JSONB DEFAULT '{}', -- What to sync, frequency
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    next_sync_at TIMESTAMP WITH TIME ZONE,
    sync_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one connection per provider per user
    UNIQUE(user_id, provider)
);

CREATE TABLE integration_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID REFERENCES integration_connections(id) ON DELETE CASCADE,
    sync_type VARCHAR(100), -- data_import, data_export, bidirectional
    records_processed INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'success',
    error_details JSONB DEFAULT '{}',
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS AND REMINDERS
-- =============================================

CREATE TYPE notification_type AS ENUM (
    'reminder',
    'achievement',
    'insight',
    'alert',
    'research_ready',
    'goal_milestone',
    'system'
);

CREATE TYPE entity_type AS ENUM (
    'goal',
    'life_area', 
    'research',
    'chat',
    'automation',
    'integration'
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    notification_type notification_type NOT NULL,
    related_entity_type entity_type,
    related_entity_id UUID,
    action_url TEXT, -- Deep link or action
    priority INTEGER DEFAULT 3, -- 1-5 scale
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validate entity references
    CONSTRAINT valid_entity_reference CHECK (
        (related_entity_type = 'goal' AND related_entity_id IS NOT NULL) OR
        (related_entity_type = 'life_area' AND related_entity_id IS NOT NULL) OR
        (related_entity_type = 'research' AND related_entity_id IS NOT NULL) OR
        (related_entity_type = 'chat' AND related_entity_id IS NOT NULL) OR
        (related_entity_type = 'automation' AND related_entity_id IS NOT NULL) OR
        (related_entity_type = 'integration' AND related_entity_id IS NOT NULL) OR
        (related_entity_type IS NULL AND related_entity_id IS NULL)
    )
);

-- =============================================
-- ANALYTICS AND INSIGHTS
-- =============================================

CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    metric_data JSONB DEFAULT '{}',
    period_start DATE,
    period_end DATE,
    period_type VARCHAR(20), -- daily, weekly, monthly, yearly
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique metrics per period
    UNIQUE(user_id, metric_name, period_start, period_end, period_type)
);

CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(100), -- trend_analysis, goal_recommendation, habit_insight
    title VARCHAR(255),
    content TEXT,
    confidence_score NUMERIC(3,2), -- 0-1 confidence in insight
    data_sources JSONB DEFAULT '[]', -- What data was used
    related_entities JSONB DEFAULT '{}', -- Related goals, life areas
    is_dismissed BOOLEAN DEFAULT FALSE,
    is_acted_upon BOOLEAN DEFAULT FALSE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Users and Sessions
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_apple_id ON users(apple_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_refresh_token_hash ON user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Life Areas
CREATE INDEX idx_life_areas_user_id ON life_areas(user_id);
CREATE INDEX idx_life_areas_type ON life_areas(type);
CREATE INDEX idx_life_areas_is_active ON life_areas(is_active);
CREATE INDEX idx_life_areas_sort_order ON life_areas(sort_order);

-- Goals and Progress
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_life_area_id ON goals(life_area_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_deadline ON goals(deadline);
CREATE INDEX idx_goals_priority ON goals(priority);
CREATE INDEX idx_progress_entries_goal_id ON progress_entries(goal_id);
CREATE INDEX idx_progress_entries_user_id ON progress_entries(user_id);
CREATE INDEX idx_progress_entries_date ON progress_entries(entry_date);
CREATE INDEX idx_progress_entries_data_source ON progress_entries(data_source);

-- Chat System
CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_last_message ON chat_conversations(last_message_at);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);

-- Research Engine
CREATE INDEX idx_research_categories_user_id ON research_categories(user_id);
CREATE INDEX idx_research_categories_is_active ON research_categories(is_active);
CREATE INDEX idx_research_categories_next_run ON research_categories(next_run_at);
CREATE INDEX idx_research_results_category_id ON research_results(category_id);
CREATE INDEX idx_research_results_user_id ON research_results(user_id);
CREATE INDEX idx_research_results_status ON research_results(status);
CREATE INDEX idx_research_results_research_date ON research_results(research_date);

-- Automation
CREATE INDEX idx_automation_rules_user_id ON automation_rules(user_id);
CREATE INDEX idx_automation_rules_is_active ON automation_rules(is_active);
CREATE INDEX idx_automation_rules_trigger_type ON automation_rules(trigger_type);
CREATE INDEX idx_automation_logs_rule_id ON automation_logs(rule_id);
CREATE INDEX idx_automation_logs_created_at ON automation_logs(created_at);

-- Integrations
CREATE INDEX idx_integration_connections_user_id ON integration_connections(user_id);
CREATE INDEX idx_integration_connections_provider ON integration_connections(provider);
CREATE INDEX idx_integration_connections_is_active ON integration_connections(is_active);
CREATE INDEX idx_integration_connections_next_sync ON integration_connections(next_sync_at);
CREATE INDEX idx_integration_sync_logs_connection_id ON integration_sync_logs(connection_id);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_entity ON notifications(related_entity_type, related_entity_id);

-- Analytics
CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_metric ON user_analytics(metric_name);
CREATE INDEX idx_user_analytics_period ON user_analytics(period_start, period_end);
CREATE INDEX idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX idx_ai_insights_generated_at ON ai_insights(generated_at);

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_life_areas_updated_at BEFORE UPDATE ON life_areas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_progress_entries_updated_at BEFORE UPDATE ON progress_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_research_categories_updated_at BEFORE UPDATE ON research_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON automation_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_connections_updated_at BEFORE UPDATE ON integration_connections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update goal current_value when progress is added
CREATE OR REPLACE FUNCTION update_goal_current_value()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE goals 
    SET current_value = (
        SELECT COALESCE(SUM(value), 0) 
        FROM progress_entries 
        WHERE goal_id = NEW.goal_id
    ),
    updated_at = NOW()
    WHERE id = NEW.goal_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_goal_progress AFTER INSERT OR UPDATE OR DELETE ON progress_entries
    FOR EACH ROW EXECUTE FUNCTION update_goal_current_value();

-- Update conversation last_message_at when message is added
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations 
    SET last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_last_message AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Default life area types for new users
CREATE TABLE default_life_areas (
    type life_area_type PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(7),
    sort_order INTEGER
);

INSERT INTO default_life_areas (type, name, description, icon, color, sort_order) VALUES
('health', 'Health & Fitness', 'Physical and mental wellbeing, exercise, diet', 'heart.fill', '#FF6B6B', 1),
('finance', 'Finance', 'Money management, investments, budgeting', 'dollarsign.circle.fill', '#4ECDC4', 2),
('learning', 'Learning & Growth', 'Education, skills, personal development', 'book.fill', '#45B7D1', 3),
('work', 'Work & Career', 'Professional goals, projects, achievements', 'briefcase.fill', '#96CEB4', 4),
('productivity', 'Productivity', 'Time management, habits, systems', 'clock.fill', '#FFEAA7', 5),
('relationships', 'Relationships', 'Family, friends, social connections', 'person.2.fill', '#DDA0DD', 6);

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Dashboard overview view
CREATE VIEW user_dashboard AS
SELECT 
    u.id AS user_id,
    u.name,
    COUNT(DISTINCT la.id) AS total_life_areas,
    COUNT(DISTINCT g.id) AS total_goals,
    COUNT(DISTINCT CASE WHEN g.status = 'active' THEN g.id END) AS active_goals,
    COUNT(DISTINCT CASE WHEN g.status = 'completed' THEN g.id END) AS completed_goals,
    COUNT(DISTINCT pe.id) AS total_progress_entries,
    COUNT(DISTINCT CASE WHEN pe.entry_date = CURRENT_DATE THEN pe.id END) AS today_progress_entries,
    MAX(pe.created_at) AS last_progress_update
FROM users u
LEFT JOIN life_areas la ON u.id = la.user_id AND la.is_active = true
LEFT JOIN goals g ON u.id = g.user_id
LEFT JOIN progress_entries pe ON g.id = pe.goal_id
GROUP BY u.id, u.name;

-- Research summary view
CREATE VIEW research_summary AS
SELECT 
    rc.id AS category_id,
    rc.user_id,
    rc.name AS category_name,
    rc.is_active,
    COUNT(rr.id) AS total_results,
    COUNT(CASE WHEN rr.status = 'pending' THEN rr.id END) AS pending_results,
    COUNT(CASE WHEN rr.status = 'approved' THEN rr.id END) AS approved_results,
    MAX(rr.research_date) AS last_research_date,
    rc.next_run_at
FROM research_categories rc
LEFT JOIN research_results rr ON rc.id = rr.category_id
GROUP BY rc.id, rc.user_id, rc.name, rc.is_active, rc.next_run_at;

-- =============================================
-- PERMISSIONS AND SECURITY
-- =============================================

-- Create application user (for API connections)
-- This should be run separately with appropriate credentials
-- CREATE USER jarvis_api WITH PASSWORD 'secure_password_here';
-- GRANT CONNECT ON DATABASE jarvis TO jarvis_api;
-- GRANT USAGE ON SCHEMA public TO jarvis_api;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO jarvis_api;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO jarvis_api;

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (uncomment and modify when implementing)
-- CREATE POLICY user_data_isolation ON users
--     FOR ALL TO jarvis_api
--     USING (id = current_setting('app.current_user_id')::UUID);

-- =============================================
-- SCHEMA VERSION
-- =============================================

CREATE TABLE schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES ('1.0.0');

-- Schema creation complete
-- Total tables: 20
-- Total indexes: 45+
-- Total triggers: 8
-- Total views: 2