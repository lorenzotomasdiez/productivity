// Goals Model Tests - TDD Implementation

// Mock config dependencies
jest.mock('../../src/config/index', () => ({
  config: {
    logging: { level: 'info' },
    jwt: { secret: 'test-secret', refreshSecret: 'test-refresh' },
    database: { url: 'test-db' },
  },
}));

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  getDatabase: jest.fn(),
}));

import { GoalModel } from '../../src/models/Goal';
import { GoalType, GoalStatus } from '../../src/types/goals';
import { v4 as uuidv4 } from 'uuid';

describe('Goal Model', () => {
  const testUserId = uuidv4();
  const testLifeAreaId = uuidv4();
  const mockQuery = require('../../src/config/database').query;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create numeric goal successfully', async() => {
      // Given
      const goalData = {
        lifeAreaId: testLifeAreaId,
        title: 'Read 24 Books',
        description: 'Read 24 books this year',
        goalType: GoalType.NUMERIC,
        targetValue: 24,
        targetUnit: 'books',
        deadline: '2025-12-31',
        priority: 4,
      };

      const mockGoal = {
        id: 'goal_123',
        user_id: testUserId,
        life_area_id: testLifeAreaId,
        parent_goal_id: null,
        title: goalData.title,
        description: goalData.description,
        goal_type: goalData.goalType,
        target_value: goalData.targetValue,
        current_value: 0,
        target_unit: goalData.targetUnit,
        deadline: '2025-12-31',
        priority: goalData.priority,
        status: 'active',
        metadata: '{}',
        reminder_config: '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery.mockResolvedValue({ rows: [mockGoal], rowCount: 1 });

      // When
      const goal = await GoalModel.create(testUserId, goalData);

      // Then
      expect(goal).toBeDefined();
      expect(goal.id).toBe('goal_123');
      expect(goal.userId).toBe(testUserId);
      expect(goal.title).toBe('Read 24 Books');
      expect(goal.goalType).toBe(GoalType.NUMERIC);
      expect(goal.targetValue).toBe(24);
      expect(goal.currentValue).toBe(0);
      expect(goal.status).toBe(GoalStatus.ACTIVE);
    });

    test('should create habit goal successfully', async() => {
      // Given
      const goalData = {
        lifeAreaId: testLifeAreaId,
        title: 'Daily Meditation',
        goalType: GoalType.HABIT,
        targetValue: 1,
        targetUnit: 'sessions per day',
      };

      const mockGoal = {
        id: 'goal_habit',
        user_id: testUserId,
        life_area_id: testLifeAreaId,
        parent_goal_id: null,
        title: goalData.title,
        description: null,
        goal_type: goalData.goalType,
        target_value: goalData.targetValue,
        current_value: 0,
        target_unit: goalData.targetUnit,
        deadline: null,
        priority: 3,
        status: 'active',
        metadata: '{}',
        reminder_config: '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery.mockResolvedValue({ rows: [mockGoal], rowCount: 1 });

      // When
      const goal = await GoalModel.create(testUserId, goalData);

      // Then
      expect(goal.goalType).toBe(GoalType.HABIT);
      expect(goal.targetValue).toBe(1);
      expect(goal.targetUnit).toBe('sessions per day');
    });

    test('should throw error for invalid goal data', async() => {
      // Given
      const invalidData = {
        lifeAreaId: '',
        title: '',
        goalType: 'invalid' as any,
      };

      // When & Then
      await expect(GoalModel.create(testUserId, invalidData))
        .rejects.toThrow();
    });
  });

  describe('findByUserId', () => {
    test('should return all goals for user', async() => {
      // Given
      const mockGoals = [
        {
          id: 'goal_1',
          user_id: testUserId,
          life_area_id: testLifeAreaId,
          parent_goal_id: null,
          title: 'Read Books',
          description: null,
          goal_type: 'numeric',
          target_value: 24,
          current_value: 5,
          target_unit: 'books',
          deadline: null,
          priority: 3,
          status: 'active',
          metadata: '{}',
          reminder_config: '{}',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'goal_2',
          user_id: testUserId,
          life_area_id: testLifeAreaId,
          parent_goal_id: null,
          title: 'Daily Exercise',
          description: null,
          goal_type: 'habit',
          target_value: 1,
          current_value: 0,
          target_unit: 'workouts per day',
          deadline: null,
          priority: 4,
          status: 'active',
          metadata: '{}',
          reminder_config: '{}',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockQuery.mockResolvedValue({ rows: mockGoals, rowCount: 2 });

      // When
      const goals = await GoalModel.findByUserId(testUserId);

      // Then
      expect(goals).toHaveLength(2);
      expect(goals[0]?.userId).toBe(testUserId);
      expect(goals[1]?.userId).toBe(testUserId);
    });

    test('should filter by status', async() => {
      // Given
      const activeGoals = [
        {
          id: 'goal_active',
          user_id: testUserId,
          life_area_id: testLifeAreaId,
          parent_goal_id: null,
          title: 'Active Goal',
          description: null,
          goal_type: 'numeric',
          target_value: 10,
          current_value: 3,
          target_unit: 'units',
          deadline: null,
          priority: 3,
          status: 'active',
          metadata: '{}',
          reminder_config: '{}',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockQuery.mockResolvedValue({ rows: activeGoals, rowCount: 1 });

      // When
      const goals = await GoalModel.findByUserId(testUserId, { status: GoalStatus.ACTIVE });

      // Then
      expect(goals).toHaveLength(1);
      expect(goals[0]?.status).toBe(GoalStatus.ACTIVE);
    });
  });

  describe('updateProgress', () => {
    test('should update goal progress for numeric goal', async() => {
      // Given
      const goalId = 'goal_123';
      const progressValue = 5;

      const mockUpdatedGoal = {
        id: goalId,
        user_id: testUserId,
        life_area_id: testLifeAreaId,
        parent_goal_id: null,
        title: 'Read Books',
        description: null,
        goal_type: 'numeric',
        target_value: 24,
        current_value: progressValue,
        target_unit: 'books',
        deadline: null,
        priority: 3,
        status: 'active',
        metadata: '{}',
        reminder_config: '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery.mockResolvedValue({ rows: [mockUpdatedGoal], rowCount: 1 });

      // When
      const updatedGoal = await GoalModel.updateProgress(goalId, progressValue);

      // Then
      expect(updatedGoal).toBeDefined();
      expect(updatedGoal?.currentValue).toBe(progressValue);
    });
  });

  describe('calculateProgressPercentage', () => {
    test('should calculate progress percentage for numeric goal', async() => {
      // Given
      const goal = {
        id: 'goal_123',
        userId: testUserId,
        lifeAreaId: testLifeAreaId,
        title: 'Read Books',
        description: null,
        goalType: GoalType.NUMERIC,
        targetValue: 24,
        currentValue: 6,
        targetUnit: 'books',
        deadline: null,
        priority: 3,
        status: GoalStatus.ACTIVE,
        metadata: {},
        reminderConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // When
      const percentage = GoalModel.calculateProgressPercentage(goal);

      // Then
      expect(percentage).toBe(25); // 6/24 * 100 = 25%
    });

    test('should return 100% for completed goal', async() => {
      // Given
      const goal = {
        id: 'goal_123',
        userId: testUserId,
        lifeAreaId: testLifeAreaId,
        title: 'Read Books',
        description: null,
        goalType: GoalType.NUMERIC,
        targetValue: 24,
        currentValue: 24,
        targetUnit: 'books',
        deadline: null,
        priority: 3,
        status: GoalStatus.COMPLETED,
        metadata: {},
        reminderConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // When
      const percentage = GoalModel.calculateProgressPercentage(goal);

      // Then
      expect(percentage).toBe(100);
    });
  });

  describe('isCompleted', () => {
    test('should detect completed numeric goal', async() => {
      // Given
      const goal = {
        id: 'goal_123',
        userId: testUserId,
        lifeAreaId: testLifeAreaId,
        title: 'Read Books',
        description: null,
        goalType: GoalType.NUMERIC,
        targetValue: 24,
        currentValue: 24,
        targetUnit: 'books',
        deadline: null,
        priority: 3,
        status: GoalStatus.ACTIVE,
        metadata: {},
        reminderConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // When
      const isCompleted = GoalModel.isCompleted(goal);

      // Then
      expect(isCompleted).toBe(true);
    });

    test('should detect incomplete numeric goal', async() => {
      // Given
      const goal = {
        id: 'goal_123',
        userId: testUserId,
        lifeAreaId: testLifeAreaId,
        title: 'Read Books',
        description: null,
        goalType: GoalType.NUMERIC,
        targetValue: 24,
        currentValue: 15,
        targetUnit: 'books',
        deadline: null,
        priority: 3,
        status: GoalStatus.ACTIVE,
        metadata: {},
        reminderConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // When
      const isCompleted = GoalModel.isCompleted(goal);

      // Then
      expect(isCompleted).toBe(false);
    });
  });
});