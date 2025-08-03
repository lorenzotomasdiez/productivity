// Goals API Integration Tests
import request from 'supertest';
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

// Mock request to have authenticated user
jest.mock('../../src/app', () => {
  const express = require('express');
  const mockApp = express();
  
  // Add middleware to simulate authenticated user
  mockApp.use((req: any, res: any, next: any) => {
    req.user = { id: 'test-user-123', email: 'test@example.com' };
    next();
  });
  
  mockApp.use(express.json());
  
  // Import and use routes after setting up middleware
  const { goalsRouter } = require('../../src/routes/goals');
  mockApp.use('/api/v1/goals', goalsRouter);
  
  return { app: mockApp };
});

import { GoalModel } from '../../src/models/Goal.js';
import { LifeAreaModel } from '../../src/models/LifeArea.js';

const mockGoalModel = GoalModel as jest.Mocked<typeof GoalModel>;
const mockLifeAreaModel = LifeAreaModel as jest.Mocked<typeof LifeAreaModel>;

// Import the mocked app
const { app } = require('../../src/app.js');

describe('Goals API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/goals', () => {
    test('should return user goals', async() => {
      // Given
      const mockGoals = [
        {
          id: 'goal_1',
          userId: 'test-user-123',
          lifeAreaId: 'area_1',
          title: 'Lose 10kg',
          description: 'Weight loss goal',
          goalType: GoalType.NUMERIC,
          targetValue: 10,
          currentValue: 5,
          targetUnit: 'kg',
          deadline: new Date('2025-12-31'),
          priority: 1,
          status: GoalStatus.ACTIVE,
          metadata: {},
          reminderConfig: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'goal_2',
          userId: 'test-user-123',
          lifeAreaId: 'area_2',
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
          id: 'goal_1',
          userId: 'test-user-123',
          lifeAreaId: 'area_1',
          title: 'Lose 10kg',
          description: 'Weight loss goal',
          goalType: GoalType.NUMERIC,
          targetValue: 10,
          currentValue: 5,
          targetUnit: 'kg',
          deadline: new Date('2025-12-31'),
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
        id: 'area_1',
        userId: 'test-user-123',
        name: 'Health',
        type: 'health',
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockGoal = {
        id: 'goal_1',
        userId: 'test-user-123',
        lifeAreaId: 'area_1',
        title: 'Lose 10kg',
        description: 'Weight loss goal',
        goalType: GoalType.NUMERIC,
        targetValue: 10,
        currentValue: 0,
        targetUnit: 'kg',
        deadline: new Date('2025-12-31'),
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
        lifeAreaId: 'area_1',
        goalType: GoalType.NUMERIC,
        targetValue: 10,
        targetUnit: 'kg',
        deadline: '2025-12-31',
        priority: 1,
      };

      // When
      const response = await request(app)
        .post('/api/v1/goals')
        .send(goalData)
        .expect(201);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Lose 10kg');
      expect(response.body.data.goalType).toBe(GoalType.NUMERIC);
      expect(mockLifeAreaModel.findById).toHaveBeenCalledWith('area_1');
      expect(mockGoalModel.create).toHaveBeenCalledWith('test-user-123', goalData);
    });

    test('should create a habit goal successfully', async() => {
      // Given
      const mockLifeArea = {
        id: 'area_1',
        userId: 'test-user-123',
        name: 'Health',
        type: 'health',
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockGoal = {
        id: 'goal_1',
        userId: 'test-user-123',
        lifeAreaId: 'area_1',
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
        lifeAreaId: 'area_1',
        goalType: GoalType.HABIT,
        priority: 2,
      };

      // When
      const response = await request(app)
        .post('/api/v1/goals')
        .send(goalData)
        .expect(201);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Exercise Daily');
      expect(response.body.data.goalType).toBe(GoalType.HABIT);
    });

    test('should create a milestone goal successfully', async() => {
      // Given
      const mockLifeArea = {
        id: 'area_2',
        userId: 'test-user-123',
        name: 'Career',
        type: 'career',
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockGoal = {
        id: 'goal_1',
        userId: 'test-user-123',
        lifeAreaId: 'area_2',
        title: 'Get Promotion',
        description: 'Career milestone',
        goalType: GoalType.MILESTONE,
        targetValue: null,
        currentValue: 0,
        targetUnit: null,
        deadline: new Date('2025-06-30'),
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
        lifeAreaId: 'area_2',
        goalType: GoalType.MILESTONE,
        deadline: '2025-06-30',
        priority: 1,
      };

      // When
      const response = await request(app)
        .post('/api/v1/goals')
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
        id: 'area_3',
        userId: 'test-user-123',
        name: 'Personal',
        type: 'personal',
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockGoal = {
        id: 'goal_1',
        userId: 'test-user-123',
        lifeAreaId: 'area_3',
        title: 'Learn Guitar',
        description: 'Learn to play guitar',
        goalType: GoalType.BINARY,
        targetValue: null,
        currentValue: 0,
        targetUnit: null,
        deadline: new Date('2025-12-31'),
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
        description: 'Learn to play guitar',
        lifeAreaId: 'area_3',
        goalType: GoalType.BINARY,
        deadline: '2025-12-31',
        priority: 3,
      };

      // When
      const response = await request(app)
        .post('/api/v1/goals')
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
        description: 'Missing title and lifeAreaId',
        goalType: GoalType.NUMERIC,
      };

      // When & Then
      const response = await request(app)
        .post('/api/v1/goals')
        .send(goalData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Title, lifeAreaId, and goalType are required');
    });

    test('should return 404 when life area not found', async() => {
      // Given
      mockLifeAreaModel.findById.mockResolvedValue(null);

      const goalData = {
        title: 'Test Goal',
        lifeAreaId: 'nonexistent',
        goalType: GoalType.NUMERIC,
        targetValue: 10,
      };

      // When & Then
      const response = await request(app)
        .post('/api/v1/goals')
        .send(goalData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('Life area not found');
    });

    test('should return 422 when numeric goal missing target value', async() => {
      // Given
      const mockLifeArea = {
        id: 'area_1',
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
        lifeAreaId: 'area_1',
        goalType: GoalType.NUMERIC,
        // Missing targetValue
      };

      // When & Then
      const response = await request(app)
        .post('/api/v1/goals')
        .send(goalData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Numeric goals must have a target value');
    });
  });

  describe('GET /api/v1/goals/:id', () => {
    test('should return a specific goal', async() => {
      // Given
      const mockGoal = {
        id: 'goal_1',
        userId: 'test-user-123',
        lifeAreaId: 'area_1',
        title: 'Lose 10kg',
        description: 'Weight loss goal',
        goalType: GoalType.NUMERIC,
        targetValue: 10,
        currentValue: 5,
        targetUnit: 'kg',
        deadline: new Date('2025-12-31'),
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
        .get('/api/v1/goals/goal_1')
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('goal_1');
      expect(response.body.data.title).toBe('Lose 10kg');
      expect(mockGoalModel.findById).toHaveBeenCalledWith('goal_1');
    });

    test('should return 404 when goal not found', async() => {
      // Given
      mockGoalModel.findById.mockResolvedValue(null);

      // When & Then
      const response = await request(app)
        .get('/api/v1/goals/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('Goal not found');
    });
  });

  describe('PUT /api/v1/goals/:id/progress', () => {
    test('should update goal progress successfully', async() => {
      // Given
      const mockGoal = {
        id: 'goal_1',
        userId: 'test-user-123',
        lifeAreaId: 'area_1',
        title: 'Lose 10kg',
        description: 'Weight loss goal',
        goalType: GoalType.NUMERIC,
        targetValue: 10,
        currentValue: 5,
        targetUnit: 'kg',
        deadline: new Date('2025-12-31'),
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
        .put('/api/v1/goals/goal_1/progress')
        .send(progressData)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.data.currentValue).toBe(7);
      expect(mockGoalModel.findById).toHaveBeenCalledWith('goal_1');
      expect(mockGoalModel.updateProgress).toHaveBeenCalledWith('goal_1', 7);
    });

    test('should return 404 when goal not found for progress update', async() => {
      // Given
      mockGoalModel.findById.mockResolvedValue(null);

      const progressData = {
        currentValue: 7,
      };

      // When & Then
      const response = await request(app)
        .put('/api/v1/goals/nonexistent/progress')
        .send(progressData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('Goal not found');
    });

    test('should return 403 when user does not own the goal', async() => {
      // Given
      const mockGoal = {
        id: 'goal_1',
        userId: 'other-user-123', // Different user
        lifeAreaId: 'area_1',
        title: 'Lose 10kg',
        description: 'Weight loss goal',
        goalType: GoalType.NUMERIC,
        targetValue: 10,
        currentValue: 5,
        targetUnit: 'kg',
        deadline: new Date('2025-12-31'),
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

      // When & Then
      const response = await request(app)
        .put('/api/v1/goals/goal_1/progress')
        .send(progressData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toContain('Unauthorized to update this goal');
    });
  });

  describe('DELETE /api/v1/goals/:id', () => {
    test('should delete a goal successfully', async() => {
      // Given
      const mockGoal = {
        id: 'goal_1',
        userId: 'test-user-123',
        lifeAreaId: 'area_1',
        title: 'Lose 10kg',
        description: 'Weight loss goal',
        goalType: GoalType.NUMERIC,
        targetValue: 10,
        currentValue: 5,
        targetUnit: 'kg',
        deadline: new Date('2025-12-31'),
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
        .delete('/api/v1/goals/goal_1')
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Goal deleted successfully');
      expect(mockGoalModel.findById).toHaveBeenCalledWith('goal_1');
      expect(mockGoalModel.delete).toHaveBeenCalledWith('goal_1');
    });

    test('should return 404 when goal not found for deletion', async() => {
      // Given
      mockGoalModel.findById.mockResolvedValue(null);

      // When & Then
      const response = await request(app)
        .delete('/api/v1/goals/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('Goal not found');
    });

    test('should return 403 when user does not own the goal', async() => {
      // Given
      const mockGoal = {
        id: 'goal_1',
        userId: 'other-user-123', // Different user
        lifeAreaId: 'area_1',
        title: 'Lose 10kg',
        description: 'Weight loss goal',
        goalType: GoalType.NUMERIC,
        targetValue: 10,
        currentValue: 5,
        targetUnit: 'kg',
        deadline: new Date('2025-12-31'),
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
        .delete('/api/v1/goals/goal_1')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toContain('Unauthorized to delete this goal');
    });
  });
}); 