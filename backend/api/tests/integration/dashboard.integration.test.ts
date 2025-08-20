import request from 'supertest';
import express from 'express';

// Mock the config to use test JWT secret
jest.mock('../../src/config/index.js', () => ({
  config: {
    jwt: {
      secret: 'test-jwt-secret',
      refreshSecret: 'test-jwt-refresh-secret',
    },
  },
}));

// Mock all the database models
jest.mock('../../src/models/LifeArea.js', () => ({
  LifeAreaModel: {
    findByUserId: jest.fn(),
  },
}));

jest.mock('../../src/models/Goal.js', () => ({
  GoalModel: {
    findByUserId: jest.fn(),
  },
}));

jest.mock('../../src/models/ProgressEntry.js', () => ({
  ProgressEntryModel: {
    findByUserId: jest.fn(),
  },
}));

// Create test app with dashboard routes
const createTestApp = (): express.Application => {
  const app = express();
  app.use(express.json());
  
  // Import and use dashboard routes
  const { dashboardRouter } = require('../../src/routes/dashboard.js');
  app.use('/api/v1/dashboard', dashboardRouter);
  
  // Import our actual error handler
  const { errorHandler } = require('../../src/middleware/errorHandler.js');
  app.use(errorHandler);

  return app;
};

// Helper function to create JWT tokens for testing
const createTestToken = (userId: string = 'test-user-123') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, email: 'test@example.com', sessionId: 'session_123' },
    'test-jwt-secret', // Use the same secret as the mocked config
    { expiresIn: '15m' }
  );
};

describe('Dashboard API Integration Tests', () => {
  const app = createTestApp();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/dashboard/stats', () => {
    test('should return 200 and dashboard statistics for authenticated user', async () => {
      // Mock data
      const mockLifeAreas = [
        { id: '550e8400-e29b-41d4-a716-446655440030', name: 'Health', type: 'health', isActive: true },
        { id: '550e8400-e29b-41d4-a716-446655440031', name: 'Finance', type: 'finance', isActive: true },
      ];
      
      const mockGoals = [
        { id: '550e8400-e29b-41d4-a716-446655440032', title: 'Exercise Daily', status: 'active', lifeAreaId: '550e8400-e29b-41d4-a716-446655440030' },
        { id: '550e8400-e29b-41d4-a716-446655440033', title: 'Save Money', status: 'active', lifeAreaId: '550e8400-e29b-41d4-a716-446655440031' },
        { id: '550e8400-e29b-41d4-a716-446655440034', title: 'Learn Guitar', status: 'completed', lifeAreaId: '550e8400-e29b-41d4-a716-446655440030' },
      ];
      
      const mockProgressEntries = [
        { id: '550e8400-e29b-41d4-a716-446655440035', goalId: '550e8400-e29b-41d4-a716-446655440032', entryDate: new Date(), value: 5 },
        { id: '550e8400-e29b-41d4-a716-446655440036', goalId: '550e8400-e29b-41d4-a716-446655440033', entryDate: new Date(), value: 100 },
      ];

      // Mock the models
      const { LifeAreaModel } = require('../../src/models/LifeArea.js');
      const { GoalModel } = require('../../src/models/Goal.js');
      const { ProgressEntryModel } = require('../../src/models/ProgressEntry.js');
      
      LifeAreaModel.findByUserId.mockResolvedValue(mockLifeAreas);
      GoalModel.findByUserId.mockResolvedValue(mockGoals);
      ProgressEntryModel.findByUserId.mockResolvedValue(mockProgressEntries);

      const response = await request(app)
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${createTestToken()}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('life_areas');
      expect(response.body.data).toHaveProperty('recent_progress');
      
      // Check summary data
      expect(response.body.data.summary.total_life_areas).toBe(2);
      expect(response.body.data.summary.total_goals).toBe(3);
      expect(response.body.data.summary.active_goals).toBe(2);
      expect(response.body.data.summary.completed_goals).toBe(1);
      expect(response.body.data.summary.total_progress_entries).toBe(2);
    });

    test('should handle empty data gracefully', async () => {
      // Mock empty data
      const { LifeAreaModel } = require('../../src/models/LifeArea.js');
      const { GoalModel } = require('../../src/models/Goal.js');
      const { ProgressEntryModel } = require('../../src/models/ProgressEntry.js');
      
      LifeAreaModel.findByUserId.mockResolvedValue([]);
      GoalModel.findByUserId.mockResolvedValue([]);
      ProgressEntryModel.findByUserId.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${createTestToken()}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.total_life_areas).toBe(0);
      expect(response.body.data.summary.total_goals).toBe(0);
      expect(response.body.data.summary.active_goals).toBe(0);
      expect(response.body.data.summary.completed_goals).toBe(0);
      expect(response.body.data.summary.total_progress_entries).toBe(0);
    });

    test('should calculate streak correctly', async () => {
      // Mock progress entries with consecutive days
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const mockProgressEntries = [
        { id: '550e8400-e29b-41d4-a716-446655440037', goalId: '550e8400-e29b-41d4-a716-446655440032', entryDate: today, value: 5 },
        { id: '550e8400-e29b-41d4-a716-446655440038', goalId: '550e8400-e29b-41d4-a716-446655440032', entryDate: yesterday, value: 4 },
        { id: '550e8400-e29b-41d4-a716-446655440039', goalId: '550e8400-e29b-41d4-a716-446655440032', entryDate: twoDaysAgo, value: 3 },
      ];

      const { ProgressEntryModel } = require('../../src/models/ProgressEntry.js');
      ProgressEntryModel.findByUserId.mockResolvedValue(mockProgressEntries);

      const response = await request(app)
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${createTestToken()}`);

      expect(response.status).toBe(200);
      expect(response.body.data.summary.current_streak).toBe(3);
    });

    test('should handle database errors gracefully', async () => {
      // Mock database error
      const { LifeAreaModel } = require('../../src/models/LifeArea.js');
      LifeAreaModel.findByUserId.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${createTestToken()}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('POST /api/v1/dashboard/widgets', () => {
    test('should return 200 and update user dashboard widgets', async () => {
      const widgetData = {
        widgets: [
          { id: 'widget1', type: 'metric', position: { x: 0, y: 0 } },
          { id: 'widget2', type: 'chart', position: { x: 1, y: 0 } },
        ],
      };

      const response = await request(app)
        .post('/api/v1/dashboard/widgets')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send(widgetData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('widgets');
      expect(response.body.data.widgets).toHaveLength(2);
    });

    test('should validate widget data structure', async () => {
      const invalidWidgetData = {
        widgets: [
          { id: 'widget1', type: 'invalid_type' }, // Missing required fields
        ],
      };

      const response = await request(app)
        .post('/api/v1/dashboard/widgets')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send(invalidWidgetData);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
