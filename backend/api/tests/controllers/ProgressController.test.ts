import request from 'supertest';
import { app } from '../../src/app';
import { GoalModel } from '../../src/models/Goal';
import { LifeAreaModel } from '../../src/models/LifeArea';
import { Goal, GoalType, GoalStatus, ProgressEntry, DataSource, CreateProgressEntryRequest, UpdateProgressEntryRequest } from '../../src/types/goals';
import { LifeArea, LifeAreaType } from '../../src/types/lifeAreas';
import { User } from '../../src/types/auth';
import { Request, Response, NextFunction } from 'express';

// Mock dependencies for testing
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

jest.mock('../../src/config/redis', () => ({
  getRedisClient: jest.fn(),
}));

// Mock the auth middleware to always pass
jest.mock('../../src/middleware/auth', () => ({
  authenticateToken: (req: Request, res: Response, next: NextFunction) => {
    req.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      profileData: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    next();
  },
}));

// Mock test utilities
const createTestUser = (): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  profileData: {},
  createdAt: new Date(),
  updatedAt: new Date(),
});

const generateTestToken = (_userId: string): string => 'mock-jwt-token';

describe('ProgressController', () => {
  let authToken: string;
  let testUser: User;
  let testGoal: Goal;
  let testLifeArea: LifeArea;

  beforeAll(async() => {
    testUser = createTestUser();
    authToken = generateTestToken(testUser.id);

    // Mock test life area and goal for progress testing
    testLifeArea = {
      id: 'test-life-area-id',
      userId: testUser.id,
      name: 'Test Life Area',
      type: LifeAreaType.HEALTH,
      description: 'Test description',
      configuration: {},
      sortOrder: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    testGoal = {
      id: 'test-goal-id',
      userId: testUser.id,
      lifeAreaId: testLifeArea.id,
      title: 'Test Goal',
      description: 'Test goal description',
      goalType: GoalType.NUMERIC,
      targetValue: 100,
      currentValue: 0,
      targetUnit: 'steps',
      deadline: null,
      priority: 3,
      status: GoalStatus.ACTIVE,
      metadata: {},
      reminderConfig: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock the model methods
    jest.spyOn(LifeAreaModel, 'create').mockResolvedValue(testLifeArea);
    jest.spyOn(GoalModel, 'create').mockResolvedValue(testGoal);
    jest.spyOn(GoalModel, 'findById').mockResolvedValue(testGoal);

    // Mock the service methods
    const { ProgressEntryService } = require('../../src/services/ProgressEntryService');
    const { GoalService } = require('../../src/services/GoalService');
    
    const mockProgressEntry: ProgressEntry = {
      id: 'test-progress-entry-id',
      goalId: testGoal.id,
      userId: testUser.id,
      entryDate: new Date('2025-08-03'),
      value: 50,
      notes: 'Test progress entry',
      dataSource: DataSource.MANUAL,
      metadata: {},
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockProgressEntries: ProgressEntry[] = [
      {
        id: 'test-progress-entry-1',
        goalId: testGoal.id,
        userId: testUser.id,
        entryDate: new Date('2025-08-03'),
        value: 75,
        notes: 'Another progress entry',
        dataSource: DataSource.MANUAL,
        metadata: {},
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockUpdatedProgressEntry: ProgressEntry = {
      id: 'test-progress-entry-id',
      goalId: testGoal.id,
      userId: testUser.id,
      entryDate: new Date('2025-08-03'),
      value: 100,
      notes: 'Updated progress entry',
      dataSource: DataSource.APPLE_HEALTH,
      metadata: {},
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(ProgressEntryService, 'createProgressEntry').mockResolvedValue(mockProgressEntry);
    jest.spyOn(ProgressEntryService, 'getProgressEntries').mockResolvedValue(mockProgressEntries);
    jest.spyOn(ProgressEntryService, 'updateProgressEntry').mockResolvedValue(mockUpdatedProgressEntry);
    jest.spyOn(ProgressEntryService, 'deleteProgressEntry').mockResolvedValue(true);
    jest.spyOn(GoalService, 'getGoalById').mockResolvedValue(testGoal);
  });

  describe('POST /api/v1/goals/:goalId/progress', () => {
    it('should create a new progress entry successfully', async() => {
      const progressData: CreateProgressEntryRequest = {
        goalId: testGoal.id,
        userId: testUser.id,
        entryDate: '2025-08-03',
        value: 50,
        notes: 'Test progress entry',
        dataSource: DataSource.MANUAL,
      };

      const response = await request(app)
        .post(`/api/v1/goals/${testGoal.id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(progressData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        goalId: testGoal.id,
        userId: testUser.id,
        value: 50,
        notes: 'Test progress entry',
        dataSource: 'manual',
      });
      expect(response.body.data.entryDate).toContain('2025-08-03');
    });

    it('should return 400 for invalid progress data', async() => {
      const invalidData = {
        entryDate: 'invalid-date',
        value: 'not-a-number',
      } as any; // Type assertion for invalid data testing

      const response = await request(app)
        .post(`/api/v1/goals/${testGoal.id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Entry date must be in YYYY-MM-DD format');
    });

    it('should return 404 for non-existent goal', async() => {
      // Mock the service to throw an error for non-existent goal
      const { ProgressEntryService } = require('../../src/services/ProgressEntryService');
      jest.spyOn(ProgressEntryService, 'createProgressEntry').mockRejectedValueOnce(new Error('Goal not found'));

      const progressData: CreateProgressEntryRequest = {
        goalId: 'non-existent-id',
        userId: testUser.id,
        entryDate: '2025-08-03',
        value: 50,
      };

      await request(app)
        .post('/api/v1/goals/non-existent-id/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send(progressData)
        .expect(404);
    });

    it('should return 403 for goal not owned by user', async() => {
      // Mock the service to throw an error for unauthorized access
      const { ProgressEntryService } = require('../../src/services/ProgressEntryService');
      jest.spyOn(ProgressEntryService, 'createProgressEntry').mockRejectedValueOnce(new Error('Unauthorized to add progress to this goal'));

      const otherUser = createTestUser();
      const otherUserToken = generateTestToken(otherUser.id);

      const progressData: CreateProgressEntryRequest = {
        goalId: testGoal.id,
        userId: otherUser.id,
        entryDate: '2025-08-03',
        value: 50,
      };

      await request(app)
        .post(`/api/v1/goals/${testGoal.id}/progress`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(progressData)
        .expect(403);
    });
  });

  describe('GET /api/v1/goals/:goalId/progress', () => {
    it('should retrieve progress entries for a goal', async() => {
      // First create a progress entry
      await request(app)
        .post(`/api/v1/goals/${testGoal.id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entryDate: '2025-08-03',
          value: 75,
          notes: 'Another progress entry',
        });

      const response = await request(app)
        .get(`/api/v1/goals/${testGoal.id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.goal).toBeDefined();
      expect(response.body.data.progress_entries).toBeInstanceOf(Array);
      expect(response.body.data.statistics).toBeDefined();
    });

    it('should return 404 for non-existent goal', async() => {
      // Mock the service to throw an error for non-existent goal
      const { GoalService } = require('../../src/services/GoalService');
      jest.spyOn(GoalService, 'getGoalById').mockResolvedValueOnce(null);

      await request(app)
        .get('/api/v1/goals/non-existent-id/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 403 for goal not owned by user', async() => {
      // Mock the service to throw an error for unauthorized access
      const { GoalService } = require('../../src/services/GoalService');
      jest.spyOn(GoalService, 'getGoalById').mockRejectedValueOnce(new Error('Unauthorized to access this goal'));

      const otherUser = createTestUser();
      const otherUserToken = generateTestToken(otherUser.id);

      await request(app)
        .get(`/api/v1/goals/${testGoal.id}/progress`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/v1/progress-entries/:id', () => {
    let progressEntryId: string;

    beforeEach(async() => {
      // Create a progress entry to update
      const response = await request(app)
        .post(`/api/v1/goals/${testGoal.id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entryDate: '2025-08-03',
          value: 25,
          notes: 'Initial progress entry',
        });

      progressEntryId = response.body.data.id;
    });

    it('should update a progress entry successfully', async() => {
      const updateData: UpdateProgressEntryRequest = {
        value: 100,
        notes: 'Updated progress entry',
        dataSource: DataSource.APPLE_HEALTH,
      };

      const response = await request(app)
        .put(`/api/v1/progress-entries/${progressEntryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: progressEntryId,
        value: 100,
        notes: 'Updated progress entry',
        dataSource: 'apple_health',
      });
    });

    it('should return 404 for non-existent progress entry', async() => {
      // Mock the service to throw an error for non-existent progress entry
      const { ProgressEntryService } = require('../../src/services/ProgressEntryService');
      jest.spyOn(ProgressEntryService, 'updateProgressEntry').mockRejectedValueOnce(new Error('Progress entry not found'));

      const updateData = {
        value: 100,
        notes: 'Updated progress entry',
      };

      await request(app)
        .put('/api/v1/progress-entries/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);
    });

    it('should return 403 for progress entry not owned by user', async() => {
      // Mock the service to throw an error for unauthorized access
      const { ProgressEntryService } = require('../../src/services/ProgressEntryService');
      jest.spyOn(ProgressEntryService, 'updateProgressEntry').mockRejectedValueOnce(new Error('Unauthorized to update this progress entry'));

      const otherUser = createTestUser();
      const otherUserToken = generateTestToken(otherUser.id);

      const updateData: UpdateProgressEntryRequest = {
        value: 100,
        notes: 'Updated progress entry',
      };

      await request(app)
        .put(`/api/v1/progress-entries/${progressEntryId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(updateData)
        .expect(403);
    });
  });

  describe('DELETE /api/v1/progress-entries/:id', () => {
    let progressEntryId: string;

    beforeEach(async() => {
      // Create a progress entry to delete
      const response = await request(app)
        .post(`/api/v1/goals/${testGoal.id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entryDate: '2025-08-03',
          value: 50,
          notes: 'Progress entry to delete',
        });

      progressEntryId = response.body.data.id;
    });

    it('should delete a progress entry successfully', async() => {
      const response = await request(app)
        .delete(`/api/v1/progress-entries/${progressEntryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent progress entry', async() => {
      // Mock the service to throw an error for non-existent progress entry
      const { ProgressEntryService } = require('../../src/services/ProgressEntryService');
      jest.spyOn(ProgressEntryService, 'deleteProgressEntry').mockRejectedValueOnce(new Error('Progress entry not found'));

      await request(app)
        .delete('/api/v1/progress-entries/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 403 for progress entry not owned by user', async() => {
      // Mock the service to throw an error for unauthorized access
      const { ProgressEntryService } = require('../../src/services/ProgressEntryService');
      jest.spyOn(ProgressEntryService, 'deleteProgressEntry').mockRejectedValueOnce(new Error('Unauthorized to delete this progress entry'));

      const otherUser = createTestUser();
      const otherUserToken = generateTestToken(otherUser.id);

      await request(app)
        .delete(`/api/v1/progress-entries/${progressEntryId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });
  });
}); 