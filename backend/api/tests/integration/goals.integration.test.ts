// Goals API Integration Tests
import request from 'supertest';
import express from 'express';
import { GoalType, GoalStatus } from '../../src/types/goals.js';

// Mock config first
jest.mock('../../src/config/index', () => ({
  config: {
    logging: { level: 'info' },
    jwt: { secret: 'test-secret', refreshSecret: 'test-refresh' },
    database: { url: 'test-db' },
    cors: { origin: '*' },
    rateLimit: { windowMs: 900000, maxRequests: 100 },
  },
}));

// Mock the database and services for integration testing
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  getDatabase: jest.fn(),
}));

jest.mock('../../src/models/Goal', () => ({
  GoalModel: {
    create: jest.fn(),
    findByUserId: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    updateProgress: jest.fn(),
    isCompleted: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../src/models/LifeArea', () => ({
  LifeAreaModel: {
    findById: jest.fn(),
  },
}));

// Create test app with goals routes
const createTestApp = (): express.Application => {
  const app = express();
  app.use(express.json());
  
  // Import and use goals routes
  const { goalsRouter } = require('../../src/routes/goals.js');
  app.use('/api/v1/goals', goalsRouter);
  
  // Import our actual error handler
  const { errorHandler } = require('../../src/middleware/errorHandler.js');
  app.use(errorHandler);

  return app;
};

import { GoalModel } from '../../src/models/Goal.js';
import { LifeAreaModel } from '../../src/models/LifeArea.js';

const mockGoalModel = GoalModel as jest.Mocked<typeof GoalModel>;
const mockLifeAreaModel = LifeAreaModel as jest.Mocked<typeof LifeAreaModel>;

// Create the test app
const app = createTestApp();

// Helper function to create JWT tokens for testing
const createTestToken = (userId: string = 'test-user-123') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, email: 'test@example.com', sessionId: 'session_123' },
    'test-secret',
    { expiresIn: '15m' }
  );
};

describe('Goals API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/goals', () => {
    test('should return user goals', async() => {
      // Given
      const mockGoals = [
        {
          id: '550e8400-e29b-41d4-a716-446655440012',
          userId: 'test-user-123',
          lifeAreaId: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Lose 10kg',
          description: 'Weight loss goal',
          goalType: GoalType.NUMERIC,
          targetValue: 10,
          currentValue: 5,
          targetUnit: 'kg',
          deadline: new Date('2026-12-31'),
          priority: 1,
          status: GoalStatus.ACTIVE,
          metadata: {},
          reminderConfig: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440013',
          userId: 'test-user-123',
          lifeAreaId: '550e8400-e29b-41d4-a716-446655440004',
          title: 'Exercise Daily',
          description: 'Daily exercise habit',
          goalType: GoalType.HABIT,
          targetValue: null,
          currentValue: 0,
          targetUnit: null,
          deadline: null,
          priority: 2,
          status: GoalStatus.ACTIVE,
          metadata: {},
          reminderConfig: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGoalModel.findByUserId.mockResolvedValue(mockGoals as any);

      // When
      const response = await request(app)
        .get('/api/v1/goals')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].title).toBe('Lose 10kg');
      expect(response.body.data[1].title).toBe('Exercise Daily');
      expect(mockGoalModel.findByUserId).toHaveBeenCalledWith('test-user-123', {});
    });

    test('should return filtered goals by goal type', async() => {
      // Given
      const mockGoals = [
        {
          id: '550e8400-e29b-41d4-a716-446655440014',
          userId: 'test-user-123',
          lifeAreaId: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Lose 10kg',
          description: 'Weight loss goal',
          goalType: GoalType.NUMERIC,
          targetValue: 10,
          currentValue: 5,
          targetUnit: 'kg',
          deadline: new Date('2026-12-31'),
          priority: 1,
          status: GoalStatus.ACTIVE,
          metadata: {},
          reminderConfig: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGoalModel.findByUserId.mockResolvedValue(mockGoals as any);

      // When
      const response = await request(app)
        .get('/api/v1/goals?goalType=numeric')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].goalType).toBe(GoalType.NUMERIC);
      expect(mockGoalModel.findByUserId).toHaveBeenCalledWith('test-user-123', { goalType: 'numeric' });
    });

    test('should return empty array when no goals found', async() => {
      // Given
      mockGoalModel.findByUserId.mockResolvedValue([]);

      // When
      const response = await request(app)
        .get('/api/v1/goals')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('POST /api/v1/goals', () => {
    test('should create a numeric goal successfully', async() => {
      // Given
      const mockLifeArea = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: 'test-user-123',
        name: 'Health',
        type: 'health',
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockGoal = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        userId: 'test-user-123',
        lifeAreaId: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Lose 10kg',
        description: 'Weight loss goal',
        goalType: GoalType.NUMERIC,
        targetValue: 10,
        currentValue: 0,
        targetUnit: 'kg',
        deadline: new Date('2026-12-31'),
        priority: 1,
        status: GoalStatus.ACTIVE,
        metadata: {},
        reminderConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLifeAreaModel.findById.mockResolvedValue(mockLifeArea as any);
      mockGoalModel.create.mockResolvedValue(mockGoal as any);

      const goalData = {
        title: 'Lose 10kg',
        description: 'Weight loss goal',
        lifeAreaId: '550e8400-e29b-41d4-a716-446655440001',
        goalType: GoalType.NUMERIC,
        targetValue: 10,
        targetUnit: 'kg',
        deadline: '2026-12-31',
        priority: 1,
      };

      // When
      const response = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send(goalData)
        .expect(201);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Lose 10kg');
      expect(response.body.data.goalType).toBe(GoalType.NUMERIC);
      expect(mockLifeAreaModel.findById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440001');
      expect(mockGoalModel.create).toHaveBeenCalledWith('test-user-123', goalData);
    });

    test('should create a habit goal successfully', async() => {
      // Given
      const mockLifeArea = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: 'test-user-123',
        name: 'Health',
        type: 'health',
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockGoal = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        userId: 'test-user-123',
        lifeAreaId: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Exercise Daily',
        description: 'Daily exercise habit',
        goalType: GoalType.HABIT,
        targetValue: null,
        currentValue: 0,
        targetUnit: null,
        deadline: null,
        priority: 2,
        status: GoalStatus.ACTIVE,
        metadata: {},
        reminderConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLifeAreaModel.findById.mockResolvedValue(mockLifeArea as any);
      mockGoalModel.create.mockResolvedValue(mockGoal as any);

      const goalData = {
        title: 'Exercise Daily',
        description: 'Daily exercise habit',
        lifeAreaId: '550e8400-e29b-41d4-a716-446655440001',
        goalType: GoalType.HABIT,
        priority: 2,
      };

      // When
      const response = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send(goalData)
        .expect(201);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Exercise Daily');
      expect(response.body.data.goalType).toBe(GoalType.HABIT);
      expect(mockLifeAreaModel.findById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440001');
      expect(mockGoalModel.create).toHaveBeenCalledWith('test-user-123', goalData);
    });

    test('should create a milestone goal successfully', async() => {
      // Given
      const mockLifeArea = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        userId: 'test-user-123',
        name: 'Career',
        type: 'career',
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockGoal = {
        id: '550e8400-e29b-41d4-a716-446655440005',
        userId: 'test-user-123',
        lifeAreaId: '550e8400-e29b-41d4-a716-446655440004',
        title: 'Get Promotion',
        description: 'Career milestone',
        goalType: GoalType.MILESTONE,
        targetValue: null,
        currentValue: 0,
        targetUnit: null,
        deadline: new Date('2026-06-30'),
        priority: 1,
        status: GoalStatus.ACTIVE,
        metadata: {},
        reminderConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLifeAreaModel.findById.mockResolvedValue(mockLifeArea as any);
      mockGoalModel.create.mockResolvedValue(mockGoal as any);

      const goalData = {
        title: 'Get Promotion',
        description: 'Career milestone',
        lifeAreaId: '550e8400-e29b-41d4-a716-446655440004',
        goalType: GoalType.MILESTONE,
        deadline: '2026-06-30',
        priority: 1,
      };

      // When
      const response = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send(goalData)
        .expect(201);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Get Promotion');
      expect(response.body.data.goalType).toBe(GoalType.MILESTONE);
    });

    test('should create a binary goal successfully', async() => {
      // Given
      const mockLifeArea = {
        id: '550e8400-e29b-41d4-a716-446655440006',
        userId: 'test-user-123',
        name: 'Personal',
        type: 'personal',
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockGoal = {
        id: '550e8400-e29b-41d4-a716-446655440007',
        userId: 'test-user-123',
        lifeAreaId: '550e8400-e29b-41d4-a716-446655440006',
        title: 'Learn Guitar',
        description: 'Personal development goal',
        goalType: GoalType.BINARY,
        targetValue: null,
        currentValue: 0,
        targetUnit: null,
        deadline: new Date('2026-12-31'),
        priority: 3,
        status: GoalStatus.ACTIVE,
        metadata: {},
        reminderConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLifeAreaModel.findById.mockResolvedValue(mockLifeArea as any);
      mockGoalModel.create.mockResolvedValue(mockGoal as any);

      const goalData = {
        title: 'Learn Guitar',
        description: 'Personal development goal',
        lifeAreaId: '550e8400-e29b-41d4-a716-446655440006',
        goalType: GoalType.BINARY,
        deadline: '2026-12-31',
        priority: 3,
      };

      // When
      const response = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send(goalData)
        .expect(201);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Learn Guitar');
      expect(response.body.data.goalType).toBe(GoalType.BINARY);
    });

    test('should return 400 when required fields are missing', async() => {
      // Given
      const goalData = {
        // Missing title, lifeAreaId, and goalType
      };

      // When & Then
      const response = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send(goalData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Request validation failed');
    });

    test('should return 400 when numeric goal missing target value', async() => {
      // Given
      const mockLifeArea = {
        id: '550e8400-e29b-41d4-a716-446655440009',
        userId: 'test-user-123',
        name: 'Health',
        type: 'health',
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLifeAreaModel.findById.mockResolvedValue(mockLifeArea as any);
      mockGoalModel.create.mockRejectedValue(new Error('Numeric goals must have a target value'));

      const goalData = {
        title: 'Lose Weight',
        lifeAreaId: '550e8400-e29b-41d4-a716-446655440009',
        goalType: GoalType.NUMERIC,
        // Missing targetValue - validation should catch this
      };

      // When & Then
      const response = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send(goalData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Request validation failed');
    });
  });

  describe('GET /api/v1/goals/:id', () => {
    test('should return a specific goal', async() => {
      // Given
      const mockGoal = {
        id: '550e8400-e29b-41d4-a716-44665544000a',
        userId: 'test-user-123',
        lifeAreaId: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Lose 10kg',
        description: 'Weight loss goal',
        goalType: GoalType.NUMERIC,
        targetValue: 10,
        currentValue: 5,
        targetUnit: 'kg',
        deadline: new Date('2026-12-31'),
        priority: 1,
        status: GoalStatus.ACTIVE,
        metadata: {},
        reminderConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGoalModel.findById.mockResolvedValue(mockGoal as any);

      // When
      const response = await request(app)
        .get('/api/v1/goals/550e8400-e29b-41d4-a716-44665544000a')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('550e8400-e29b-41d4-a716-44665544000a');
      expect(response.body.data.title).toBe('Lose 10kg');
      expect(mockGoalModel.findById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-44665544000a');
    });

    test('should return 404 when goal not found', async() => {
      // Given
      mockGoalModel.findById.mockResolvedValue(null);

      // When & Then
      const response = await request(app)
        .get('/api/v1/goals/550e8400-e29b-41d4-a716-44665544000b')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('Goal not found');
    });
  });

  describe('PUT /api/v1/goals/:id/progress (deprecated)', () => {
    test('should return 410 (deprecated)', async() => {
      // Given
      const mockGoal = {
        id: '550e8400-e29b-41d4-a716-44665544000c',
        userId: 'test-user-123',
        lifeAreaId: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Lose 10kg',
        description: 'Weight loss goal',
        goalType: GoalType.NUMERIC,
        targetValue: 10,
        currentValue: 5,
        targetUnit: 'kg',
        deadline: new Date('2026-12-31'),
        priority: 1,
        status: GoalStatus.ACTIVE,
        metadata: {},
        reminderConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedGoal = {
        ...mockGoal,
        currentValue: 7,
        updatedAt: new Date(),
      };

      mockGoalModel.findById.mockResolvedValue(mockGoal as any);
      mockGoalModel.updateProgress.mockResolvedValue(updatedGoal as any);
      mockGoalModel.isCompleted.mockReturnValue(false);

      const progressData = {
        currentValue: 7,
      };

      // When
      const response = await request(app)
        .put('/api/v1/goals/550e8400-e29b-41d4-a716-44665544000c/progress')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send(progressData)
        .expect(410);

      // Then
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('GONE');
    });

    test('returns 410 even when goal not found (deprecated)', async() => {
      // Given
      mockGoalModel.findById.mockResolvedValue(null);

      const progressData = {
        currentValue: 7,
      };

      // When & Then
      const response = await request(app)
        .put('/api/v1/goals/550e8400-e29b-41d4-a716-44665544000d/progress')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send(progressData)
        .expect(410);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('GONE');
    });

    test('returns 410 even when unauthorized (deprecated)', async() => {
      // Given
      const mockGoal = {
        id: '550e8400-e29b-41d4-a716-44665544000e',
        userId: 'other-user-123', // Different user
        lifeAreaId: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Lose 10kg',
        description: 'Weight loss goal',
        goalType: GoalType.NUMERIC,
        targetValue: 10,
        currentValue: 5,
        targetUnit: 'kg',
        deadline: new Date('2026-12-31'),
        priority: 1,
        status: GoalStatus.ACTIVE,
        metadata: {},
        reminderConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGoalModel.findById.mockResolvedValue(mockGoal as any);

      const progressData = {
        currentValue: 7,
      };

      // When
      const response = await request(app)
        .put('/api/v1/goals/550e8400-e29b-41d4-a716-44665544000e/progress')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send(progressData)
        .expect(410);

      // Then
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('GONE');
    });
  });

  describe('DELETE /api/v1/goals/:id', () => {
    test('should delete a goal successfully', async() => {
      // Given
      const mockGoal = {
        id: '550e8400-e29b-41d4-a716-44665544000f',
        userId: 'test-user-123',
        lifeAreaId: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Lose 10kg',
        description: 'Weight loss goal',
        goalType: GoalType.NUMERIC,
        targetValue: 10,
        currentValue: 5,
        targetUnit: 'kg',
        deadline: new Date('2026-12-31'),
        priority: 1,
        status: GoalStatus.ACTIVE,
        metadata: {},
        reminderConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGoalModel.findById.mockResolvedValue(mockGoal as any);
      mockGoalModel.delete.mockResolvedValue(true);

      // When
      const response = await request(app)
        .delete('/api/v1/goals/550e8400-e29b-41d4-a716-44665544000f')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Goal deleted successfully');
      expect(mockGoalModel.findById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-44665544000f');
      expect(mockGoalModel.delete).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-44665544000f');
    });

    test('should return 404 when goal not found for deletion', async() => {
      // Given
      mockGoalModel.findById.mockResolvedValue(null);

      // When & Then
      const response = await request(app)
        .delete('/api/v1/goals/550e8400-e29b-41d4-a716-446655440010')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('Goal not found');
    });

    test('should return 403 when user does not own the goal', async() => {
      // Given
      const mockGoal = {
        id: '550e8400-e29b-41d4-a716-446655440011',
        userId: 'other-user-123', // Different user
        lifeAreaId: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Lose 10kg',
        description: 'Weight loss goal',
        goalType: GoalType.NUMERIC,
        targetValue: 10,
        currentValue: 5,
        targetUnit: 'kg',
        deadline: new Date('2026-12-31'),
        priority: 1,
        status: GoalStatus.ACTIVE,
        metadata: {},
        reminderConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGoalModel.findById.mockResolvedValue(mockGoal as any);

      // When & Then
      const response = await request(app)
        .delete('/api/v1/goals/550e8400-e29b-41d4-a716-446655440011')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toContain('Unauthorized to delete this goal');
    });
  });
}); 