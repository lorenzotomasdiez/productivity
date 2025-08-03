-- Jarvis Personal Life Management System
-- Database Seed Data
-- Version: 1.0.0

-- =============================================
-- EXAMPLE USER DATA (for development)
-- =============================================

-- Insert test user (in production, users come from Apple Sign In)
INSERT INTO users (id, email, apple_id, name, profile_data, preferences) VALUES
(
    '123e4567-e89b-12d3-a456-426614174000',
    'lorenzo@example.com',
    'apple_id_12345',
    'Lorenzo',
    '{
        "timezone": "UTC",
        "language": "en",
        "avatar_url": null
    }',
    '{
        "notifications_enabled": true,
        "ai_suggestions": true,
        "research_frequency": "daily",
        "dashboard_layout": "default"
    }'
);

-- =============================================
-- EXAMPLE LIFE AREAS
-- =============================================

-- Create life areas for the test user
INSERT INTO life_areas (id, user_id, name, type, description, icon, color, sort_order, configuration) VALUES
(
    '223e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Health & Fitness',
    'health',
    'Physical and mental wellbeing, workouts, nutrition',
    'heart.fill',
    '#FF6B6B',
    1,
    '{
        "tracking_methods": ["workouts", "weight", "sleep", "mood"],
        "apple_health_sync": true,
        "default_reminders": {
            "workout": "daily_morning",
            "weight_log": "daily_morning"
        }
    }'
),
(
    '323e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Learning & Development',
    'learning',
    'Books, courses, skills, knowledge acquisition',
    'book.fill',
    '#45B7D1',
    2,
    '{
        "tracking_methods": ["books_read", "courses_completed", "study_hours"],
        "research_topics": ["programming", "productivity", "business"],
        "goal_templates": {
            "reading": "books_per_month",
            "learning": "hours_per_week"
        }
    }'
),
(
    '423e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Finance & Investments',
    'finance',
    'Money management, investments, financial goals',
    'dollarsign.circle.fill',
    '#4ECDC4',
    3,
    '{
        "tracking_methods": ["savings", "investments", "expenses"],
        "research_topics": ["stocks", "crypto", "real_estate"],
        "automation_rules": {
            "expense_categorization": true,
            "investment_alerts": true
        }
    }'
),
(
    '523e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Work & Projects',
    'work',
    'Professional goals, projects, career development',
    'briefcase.fill',
    '#96CEB4',
    4,
    '{
        "tracking_methods": ["projects", "hours", "achievements"],
        "research_topics": ["industry_trends", "tools", "opportunities"],
        "integrations": ["github", "calendar"]
    }'
);

-- =============================================
-- EXAMPLE GOALS
-- =============================================

-- Health goals
INSERT INTO goals (id, user_id, life_area_id, title, description, goal_type, target_value, target_unit, deadline, priority, metadata) VALUES
(
    '623e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    '223e4567-e89b-12d3-a456-426614174000',
    'Workout 4 times per week',
    'Maintain consistent exercise routine with 4 workout sessions weekly',
    'habit',
    4,
    'workouts/week',
    '2025-12-31',
    5,
    '{
        "habit_config": {
            "frequency": "weekly",
            "target_days": ["monday", "wednesday", "friday", "sunday"],
            "reminder_time": "08:00"
        },
        "tracking": {
            "apple_health_sync": true,
            "manual_entry": true
        }
    }'
),
(
    '723e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    '223e4567-e89b-12d3-a456-426614174000',
    'Lose 10 kg',
    'Reach target weight through diet and exercise',
    'numeric',
    10,
    'kg',
    '2025-06-30',
    4,
    '{
        "tracking": {
            "current_weight": 80,
            "target_weight": 70,
            "apple_health_sync": true
        },
        "milestones": [
            {"value": 2.5, "reward": "New workout clothes"},
            {"value": 5, "reward": "Weekend getaway"},
            {"value": 10, "reward": "New wardrobe"}
        ]
    }'
),

-- Learning goals
(
    '823e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    '323e4567-e89b-12d3-a456-426614174000',
    'Read 24 books this year',
    'Read 2 books per month to expand knowledge and perspectives',
    'numeric',
    24,
    'books',
    '2025-12-31',
    4,
    '{
        "categories": ["business", "technology", "personal_development", "fiction"],
        "tracking": {
            "goodreads_sync": false,
            "manual_entry": true,
            "notes_required": true
        },
        "recommendations": {
            "ai_suggestions": true,
            "research_integration": true
        }
    }'
),
(
    '923e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    '323e4567-e89b-12d3-a456-426614174000',
    'Complete SwiftUI Course',
    'Master SwiftUI for iOS development',
    'milestone',
    1,
    'course',
    '2025-03-31',
    5,
    '{
        "course_info": {
            "platform": "Stanford CS193p",
            "duration": "10 weeks",
            "progress_tracking": "lectures_completed"
        },
        "milestones": [
            {"name": "Complete lectures 1-5", "deadline": "2025-02-15"},
            {"name": "Build first app", "deadline": "2025-03-01"},
            {"name": "Complete final project", "deadline": "2025-03-31"}
        ]
    }'
),

-- Finance goals
(
    'a23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    '423e4567-e89b-12d3-a456-426614174000',
    'Save €50,000',
    'Build emergency fund and investment capital',
    'numeric',
    50000,
    'EUR',
    '2025-12-31',
    5,
    '{
        "savings_plan": {
            "monthly_target": 4167,
            "automatic_transfer": true,
            "high_yield_account": true
        },
        "tracking": {
            "bank_integration": false,
            "manual_entry": true,
            "monthly_review": true
        }
    }'
),

-- Work goals
(
    'b23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    '523e4567-e89b-12d3-a456-426614174000',
    'Launch Jarvis App',
    'Complete and launch the personal productivity application',
    'milestone',
    1,
    'project',
    '2025-08-01',
    5,
    '{
        "project_phases": [
            {"name": "MVP Development", "deadline": "2025-05-01"},
            {"name": "Beta Testing", "deadline": "2025-06-15"},
            {"name": "App Store Release", "deadline": "2025-08-01"}
        ],
        "success_metrics": {
            "user_signups": 100,
            "daily_active_users": 50,
            "app_store_rating": 4.5
        }
    }'
);

-- =============================================
-- EXAMPLE PROGRESS ENTRIES
-- =============================================

-- Recent workout progress
INSERT INTO progress_entries (goal_id, user_id, entry_date, value, notes, data_source, metadata) VALUES
(
    '623e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    CURRENT_DATE - INTERVAL '6 days',
    1,
    'Upper body workout - 45 minutes',
    'manual',
    '{"workout_type": "strength", "duration_minutes": 45, "exercises": ["push_ups", "pull_ups", "bench_press"]}'
),
(
    '623e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    CURRENT_DATE - INTERVAL '4 days',
    1,
    'Cardio session - running',
    'apple_health',
    '{"workout_type": "cardio", "duration_minutes": 30, "distance_km": 5.2, "heart_rate_avg": 145}'
),
(
    '623e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    CURRENT_DATE - INTERVAL '2 days',
    1,
    'Full body workout',
    'manual',
    '{"workout_type": "strength", "duration_minutes": 60, "exercises": ["squats", "deadlifts", "overhead_press"]}'
),
(
    '623e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    CURRENT_DATE,
    1,
    'Yoga and stretching',
    'manual',
    '{"workout_type": "flexibility", "duration_minutes": 30, "session_type": "vinyasa_yoga"}'
);

-- Weight tracking progress
INSERT INTO progress_entries (goal_id, user_id, entry_date, value, notes, data_source, metadata) VALUES
(
    '723e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    CURRENT_DATE - INTERVAL '14 days',
    1.2,
    'Good progress this week',
    'apple_health',
    '{"weight_kg": 78.8, "body_fat_percent": 15.2}'
),
(
    '723e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    CURRENT_DATE - INTERVAL '7 days',
    1.8,
    'Steady weight loss continues',
    'apple_health',
    '{"weight_kg": 78.2, "body_fat_percent": 14.9}'
),
(
    '723e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    CURRENT_DATE,
    2.5,
    'Hit first milestone!',
    'apple_health',
    '{"weight_kg": 77.5, "body_fat_percent": 14.5, "milestone_reached": true}'
);

-- Reading progress
INSERT INTO progress_entries (goal_id, user_id, entry_date, value, notes, data_source, metadata) VALUES
(
    '823e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    CURRENT_DATE - INTERVAL '20 days',
    1,
    'Atomic Habits by James Clear',
    'manual',
    '{"book_title": "Atomic Habits", "author": "James Clear", "pages": 320, "rating": 5, "category": "personal_development"}'
),
(
    '823e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    CURRENT_DATE - INTERVAL '5 days',
    1,
    'The Lean Startup by Eric Ries',
    'manual',
    '{"book_title": "The Lean Startup", "author": "Eric Ries", "pages": 336, "rating": 4, "category": "business"}'
);

-- =============================================
-- EXAMPLE RESEARCH CATEGORIES
-- =============================================

INSERT INTO research_categories (id, user_id, name, description, research_prompt, schedule_config, target_life_areas, is_active) VALUES
(
    'c23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Investment Opportunities',
    'Research emerging investment opportunities and market trends',
    'Research the latest investment opportunities, market trends, and emerging sectors. Focus on technology stocks, ETFs, and alternative investments. Provide analysis of risk levels, potential returns, and time horizons. Include recent news and expert opinions from reputable financial sources.',
    '{
        "frequency": "weekly",
        "day_of_week": "monday",
        "time": "09:00",
        "timezone": "UTC"
    }',
    '{"423e4567-e89b-12d3-a456-426614174000"}',
    true
),
(
    'd23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Tech Learning Resources',
    'Find latest programming courses, tutorials, and learning materials',
    'Research the latest programming courses, tutorials, and learning resources. Focus on Swift, SwiftUI, iOS development, and emerging technologies. Include free and paid options, university courses, and industry certifications. Prioritize hands-on projects and practical applications.',
    '{
        "frequency": "bi_weekly",
        "day_of_week": "wednesday",
        "time": "14:00",
        "timezone": "UTC"
    }',
    '{"323e4567-e89b-12d3-a456-426614174000"}',
    true
),
(
    'e23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Twitter Content Ideas',
    'Generate engaging content ideas for Twitter/X about productivity and tech',
    'Generate engaging Twitter/X content ideas about productivity, technology, software development, and entrepreneurship. Include trending topics, controversial takes, educational threads, and personal development insights. Focus on content that drives engagement and provides value to followers.',
    '{
        "frequency": "daily",
        "time": "08:00",
        "timezone": "UTC"
    }',
    '{"523e4567-e89b-12d3-a456-426614174000"}',
    true
);

-- =============================================
-- EXAMPLE RESEARCH RESULTS
-- =============================================

INSERT INTO research_results (id, category_id, user_id, title, content, summary, sources, status, quality_score, relevance_score, research_date) VALUES
(
    'f23e4567-e89b-12d3-a456-426614174000',
    'c23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'AI & Semiconductor Stocks Analysis',
    'The AI revolution continues to drive semiconductor demand, with NVIDIA, AMD, and emerging players showing strong growth potential. Key trends include:\n\n1. **NVIDIA (NVDA)**: Leading in AI chips, strong datacenter growth\n2. **AMD**: Gaining market share, competitive pricing\n3. **ASML**: Essential for chip manufacturing, monopoly position\n4. **Taiwan Semiconductor**: Foundry leader, geopolitical risks\n\nRecommendation: Consider diversified semiconductor ETF (SMH) for exposure with reduced single-stock risk.',
    'Strong growth potential in AI/semiconductor sector. Consider ETF diversification over individual stocks.',
    '[
        {
            "title": "Semiconductor Industry Report Q4 2024",
            "url": "https://example.com/report1",
            "source": "Morgan Stanley"
        },
        {
            "title": "AI Chip Market Analysis",
            "url": "https://example.com/report2", 
            "source": "Goldman Sachs"
        }
    ]',
    'approved',
    0.92,
    0.95,
    CURRENT_DATE - INTERVAL '3 days'
),
(
    'g23e4567-e89b-12d3-a456-426614174000',
    'd23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'SwiftUI Advanced Techniques Course',
    'Found excellent advanced SwiftUI course by Paul Hudson (Hacking with Swift):\n\n**Course: SwiftUI Advanced Techniques**\n- 40+ hours of content\n- Real-world projects\n- Animation mastery\n- Custom views and modifiers\n- Performance optimization\n\n**Alternative: Stanford CS193p 2024**\n- Free university course\n- Latest SwiftUI features\n- Comprehensive projects\n- Academic approach\n\nRecommendation: Start with Stanford for fundamentals, then Paul Hudson for advanced techniques.',
    'Two excellent options: Stanford CS193p (free, comprehensive) and Paul Hudson course (paid, practical).',
    '[
        {
            "title": "SwiftUI Advanced Techniques",
            "url": "https://hackingwithswift.com/advanced-swiftui",
            "source": "Hacking with Swift"
        },
        {
            "title": "CS193p Stanford Course",
            "url": "https://cs193p.sites.stanford.edu",
            "source": "Stanford University"
        }
    ]',
    'pending',
    0.88,
    0.93,
    CURRENT_DATE - INTERVAL '1 day'
);

-- =============================================
-- EXAMPLE CHAT CONVERSATION
-- =============================================

INSERT INTO chat_conversations (id, user_id, title, context_data) VALUES
(
    'h23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Weekly Progress Review',
    '{
        "relevant_goals": [
            "623e4567-e89b-12d3-a456-426614174000",
            "823e4567-e89b-12d3-a456-426614174000"
        ],
        "time_period": "last_7_days",
        "context_type": "progress_review"
    }'
);

INSERT INTO chat_messages (conversation_id, user_id, role, content, model_used, metadata) VALUES
(
    'h23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'user',
    'Hey Jarvis, how am I doing with my goals this week?',
    null,
    '{}'
),
(
    'h23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'assistant',
    'Great question! Looking at your progress this week:\n\n**Workouts**: You''re doing excellent! 4/4 workouts completed this week. You hit your target perfectly with upper body, cardio, full body, and yoga sessions.\n\n**Weight Loss**: Outstanding progress! You''ve lost 2.5kg total and just hit your first milestone. The consistent workouts are clearly paying off.\n\n**Reading**: You finished "The Lean Startup" this week, keeping you on track for your 24 books goal. That''s 2 books completed so far.\n\n**Areas to focus on**: Consider logging some progress on your SwiftUI course and Jarvis app development. Would you like me to suggest a study schedule?',
    'gpt-4',
    '{
        "goals_analyzed": [
            "623e4567-e89b-12d3-a456-426614174000",
            "723e4567-e89b-12d3-a456-426614174000", 
            "823e4567-e89b-12d3-a456-426614174000"
        ],
        "data_sources": ["progress_entries", "goals"]
    }'
),
(
    'h23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'user',
    'Yes, please suggest a study schedule for the SwiftUI course',
    null,
    '{}'
),
(
    'h23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'assistant',
    'Perfect! Based on your goal to complete the SwiftUI course by March 31st, here''s a realistic schedule:\n\n**Week 1-2 (Feb 3-16)**: Lectures 1-5\n- 2.5 lectures per week\n- 1 hour per lecture + practice\n- Schedule: Monday, Wednesday, Friday evenings\n\n**Week 3-4 (Feb 17-Mar 2)**: Lectures 6-10 + First App\n- Focus on building your first simple app\n- Weekend project time for hands-on practice\n\n**Week 5-6 (Mar 3-16)**: Advanced topics + Second App\n- More complex app with multiple views\n- Apply concepts learned\n\n**Week 7-8 (Mar 17-31)**: Final Project\n- Build your own app idea\n- Polish and complete course requirements\n\nI''ll set up reminders for your study sessions and track your progress. Sound good?',
    'gpt-4',
    '{
        "schedule_created": true,
        "goal_referenced": "923e4567-e89b-12d3-a456-426614174000",
        "reminder_suggestions": ["monday_evening", "wednesday_evening", "friday_evening"]
    }'
);

-- =============================================
-- EXAMPLE AUTOMATION RULES
-- =============================================

INSERT INTO automation_rules (id, user_id, name, description, trigger_type, trigger_config, action_type, action_config) VALUES
(
    'i23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Morning Workout Reminder',
    'Send workout reminder every morning at 7 AM',
    'schedule',
    '{
        "schedule": "0 7 * * *",
        "timezone": "UTC",
        "enabled_days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    }',
    'notification',
    '{
        "title": "Time to Work Out! 💪",
        "body": "Your body is your temple. Let''s get moving!",
        "related_goal_id": "623e4567-e89b-12d3-a456-426614174000",
        "priority": 4
    }'
),
(
    'j23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Weight Milestone Celebration',
    'Celebrate when weight loss milestone is reached',
    'condition',
    '{
        "goal_id": "723e4567-e89b-12d3-a456-426614174000",
        "condition": "milestone_reached",
        "check_frequency": "on_progress_update"
    }',
    'notification',
    '{
        "title": "🎉 Milestone Achieved!",
        "body": "Congratulations on reaching your weight loss milestone! Time for a reward!",
        "priority": 5,
        "celebration": true
    }'
);

-- =============================================
-- EXAMPLE NOTIFICATIONS
-- =============================================

INSERT INTO notifications (id, user_id, title, body, notification_type, related_entity_type, related_entity_id, priority, scheduled_for) VALUES
(
    'k23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'New Research Available',
    'Your investment research for this week is ready for review',
    'research_ready',
    'research',
    'f23e4567-e89b-12d3-a456-426614174000',
    4,
    NOW() + INTERVAL '1 hour'
),
(
    'l23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Weekly Progress Summary',
    'Great week! You hit 4/4 workout goals and finished another book.',
    'insight',
    null,
    null,
    3,
    NOW() + INTERVAL '30 minutes'
);

-- =============================================
-- EXAMPLE ANALYTICS DATA
-- =============================================

INSERT INTO user_analytics (user_id, metric_name, metric_value, metric_data, period_start, period_end, period_type) VALUES
(
    '123e4567-e89b-12d3-a456-426614174000',
    'weekly_workout_completion',
    100.0,
    '{"target": 4, "completed": 4, "streak": 3}',
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE,
    'weekly'
),
(
    '123e4567-e89b-12d3-a456-426614174000',
    'monthly_books_read',
    2.0,
    '{"target": 2, "completed": 2, "genres": ["business", "personal_development"]}',
    DATE_TRUNC('month', CURRENT_DATE),
    CURRENT_DATE,
    'monthly'
),
(
    '123e4567-e89b-12d3-a456-426614174000',
    'goal_completion_rate',
    75.0,
    '{"total_goals": 4, "on_track": 3, "behind": 1}',
    DATE_TRUNC('month', CURRENT_DATE),
    CURRENT_DATE,
    'monthly'
);

-- =============================================
-- EXAMPLE AI INSIGHTS
-- =============================================

INSERT INTO ai_insights (id, user_id, insight_type, title, content, confidence_score, data_sources, related_entities) VALUES
(
    'm23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'habit_insight',
    'Workout Consistency Pattern',
    'Your workout consistency is excellent! You''ve maintained a 100% completion rate for 3 weeks straight. The pattern shows you prefer morning workouts and have the highest energy on Mondays and Wednesdays. Consider scheduling your most challenging workouts on these days.',
    0.89,
    '["progress_entries", "automation_logs"]',
    '{
        "goals": ["623e4567-e89b-12d3-a456-426614174000"],
        "life_areas": ["223e4567-e89b-12d3-a456-426614174000"]
    }'
),
(
    'n23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'goal_recommendation',
    'Learning Goal Acceleration',
    'You''re ahead of schedule on your reading goal! Consider adding a complementary goal like "Take notes on each book" or "Write book summaries" to maximize knowledge retention. Your reading pace suggests you could handle 30 books this year instead of 24.',
    0.82,
    '["progress_entries", "goals"]',
    '{
        "goals": ["823e4567-e89b-12d3-a456-426614174000"],
        "life_areas": ["323e4567-e89b-12d3-a456-426614174000"]
    }'
);

-- Seed data complete
-- This provides a realistic example of how the system would look with actual user data