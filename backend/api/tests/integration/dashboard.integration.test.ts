import request from 'supertest';
import express from 'express';

// Mock the auth middleware to always pass
jest.mock('../../src/middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = {
      id: 'test-user-123',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    next();
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

describe('Dashboard API Integration Tests', () => {
  const app = createTestApp();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/dashboard/stats', () => {
    test('should return 200 and dashboard statistics for authenticated user', async () => {
      // Mock data
      const mockLifeAreas = [
        { id: 'la1', name: 'Health', type: 'health', isActive: true },
        { id: 'la2', name: 'Finance', type: 'finance', isActive: true },
      ];
      
      const mockGoals = [
        { id: 'g1', title: 'Exercise Daily', status: 'active', lifeAreaId: 'la1' },
        { id: 'g2', title: 'Save Money', status: 'active', lifeAreaId: 'la2' },
        { id: 'g3', title: 'Learn Guitar', status: 'completed', lifeAreaId: 'la1' },
      ];
      
      const mockProgressEntries = [
        { id: 'pe1', goalId: 'g1', entryDate: new Date(), value: 5 },
        { id: 'pe2', goalId: 'g2', entryDate: new Date(), value: 100 },
      ];

      // Mock the models
      const { LifeAreaModel } = require('../../src/models/LifeArea.js');
      const { GoalModel } = require('../../src/models/Goal.js');
      const { ProgressEntryModel } = require('../../src/models/ProgressEntry.js');
      
      LifeAreaModel.findByUserId.mockResolvedValue(mockLifeAreas);
      GoalModel.findByUserId.mockResolvedValue(mockGoals);
      ProgressEntryModel.findByUserId.mockResolvedValue(mockProgressEntries);

      const response = await request(app)
        .get('/api/v1/dashboard/stats');

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
        .get('/api/v1/dashboard/stats');

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
        { id: 'pe1', goalId: 'g1', entryDate: today, value: 5 },
        { id: 'pe2', goalId: 'g1', entryDate: yesterday, value: 4 },
        { id: 'pe3', goalId: 'g1', entryDate: twoDaysAgo, value: 3 },
      ];

      const { ProgressEntryModel } = require('../../src/models/ProgressEntry.js');
      ProgressEntryModel.findByUserId.mockResolvedValue(mockProgressEntries);

      const response = await request(app)
        .get('/api/v1/dashboard/stats');

      expect(response.status).toBe(200);
      expect(response.body.data.summary.current_streak).toBe(3);
    });

    test('should handle database errors gracefully', async () => {
      // Mock database error
      const { LifeAreaModel } = require('../../src/models/LifeArea.js');
      LifeAreaModel.findByUserId.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/v1/dashboard/stats');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('POST /api/v1/dashboard/widgets', () => {
    test('should return 200 and update user dashboard widgets', async () => {
      const widgetData = {
        widgets: [
          { id: 'widget1', type: 'goals_summary', position: { x: 0, y: 0 } },
          { id: 'widget2', type: 'progress_chart', position: { x: 1, y: 0 } },
        ],
      };

      const response = await request(app)
        .post('/api/v1/dashboard/widgets')
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
        .send(invalidWidgetData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
