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

  describe('update', () => {
    test('should update goal title successfully', async() => {
      // Given
      const goalId = 'goal_123';
      const updates = { title: 'Updated Goal Title' };

      const mockUpdatedGoal = {
        id: goalId,
        user_id: testUserId,
        life_area_id: testLifeAreaId,
        parent_goal_id: null,
        title: updates.title,
        description: 'Read 24 books this year',
        goal_type: 'numeric',
        target_value: 24,
        current_value: 6,
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
      const updatedGoal = await GoalModel.update(goalId, updates);

      // Then
      expect(updatedGoal).toBeDefined();
      expect(updatedGoal?.title).toBe('Updated Goal Title');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE goals'),
        expect.arrayContaining([updates.title, expect.any(Date), goalId])
      );
    });

    test('should update multiple fields successfully', async() => {
      // Given
      const goalId = 'goal_123';
      const updates = {
        title: 'Updated Title',
        description: 'Updated description',
        priority: 5,
        deadline: '2025-06-30'
      };

      const mockUpdatedGoal = {
        id: goalId,
        user_id: testUserId,
        life_area_id: testLifeAreaId,
        parent_goal_id: null,
        title: updates.title,
        description: updates.description,
        goal_type: 'numeric',
        target_value: 24,
        current_value: 6,
        target_unit: 'books',
        deadline: updates.deadline,
        priority: updates.priority,
        status: 'active',
        metadata: '{}',
        reminder_config: '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery.mockResolvedValue({ rows: [mockUpdatedGoal], rowCount: 1 });

      // When
      const updatedGoal = await GoalModel.update(goalId, updates);

      // Then
      expect(updatedGoal).toBeDefined();
      expect(updatedGoal?.title).toBe('Updated Title');
      expect(updatedGoal?.description).toBe('Updated description');
      expect(updatedGoal?.priority).toBe(5);
      expect(updatedGoal?.deadline).toEqual(new Date('2025-06-30'));
    });

    test('should throw error for empty title', async() => {
      // Given
      const goalId = 'goal_123';
      const updates = { title: '   ' };

      // When & Then
      await expect(GoalModel.update(goalId, updates)).rejects.toThrow('Goal title cannot be empty');
      expect(mockQuery).not.toHaveBeenCalled();
    });

    test('should handle empty title with only whitespace', async() => {
      // Given
      const goalId = 'goal_123';
      const updates = { title: '\t\n  \r' };

      // When & Then
      await expect(GoalModel.update(goalId, updates)).rejects.toThrow('Goal title cannot be empty');
      expect(mockQuery).not.toHaveBeenCalled();
    });

    test('should handle metadata updates', async() => {
      // Given
      const goalId = 'goal_123';
      const metadata = { category: 'learning', difficulty: 'medium' };
      const updates = { metadata };

      const mockUpdatedGoal = {
        id: goalId,
        user_id: testUserId,
        life_area_id: testLifeAreaId,
        parent_goal_id: null,
        title: 'Read Books',
        description: 'Read 24 books this year',
        goal_type: 'numeric',
        target_value: 24,
        current_value: 6,
        target_unit: 'books',
        deadline: null,
        priority: 3,
        status: 'active',
        metadata: JSON.stringify(metadata),
        reminder_config: '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery.mockResolvedValue({ rows: [mockUpdatedGoal], rowCount: 1 });

      // When
      const updatedGoal = await GoalModel.update(goalId, updates);

      // Then
      expect(updatedGoal).toBeDefined();
      expect(updatedGoal?.metadata).toEqual(metadata);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('metadata = $'),
        expect.arrayContaining([JSON.stringify(metadata), expect.any(Date), goalId])
      );
    });

    test('should handle reminder config updates', async() => {
      // Given
      const goalId = 'goal_123';
      const reminderConfig = { frequency: 'daily', time: '09:00' };
      const updates = { reminderConfig };

      const mockUpdatedGoal = {
        id: goalId,
        user_id: testUserId,
        life_area_id: testLifeAreaId,
        parent_goal_id: null,
        title: 'Read Books',
        description: 'Read 24 books this year',
        goal_type: 'numeric',
        target_value: 24,
        current_value: 6,
        target_unit: 'books',
        deadline: null,
        priority: 3,
        status: 'active',
        metadata: '{}',
        reminder_config: JSON.stringify(reminderConfig),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery.mockResolvedValue({ rows: [mockUpdatedGoal], rowCount: 1 });

      // When
      const updatedGoal = await GoalModel.update(goalId, updates);

      // Then
      expect(updatedGoal).toBeDefined();
      expect(updatedGoal?.reminderConfig).toEqual(reminderConfig);
    });

    test('should return existing goal when no updates provided', async() => {
      // Given
      const goalId = 'goal_123';
      const updates = {};

      const mockGoal = {
        id: goalId,
        user_id: testUserId,
        life_area_id: testLifeAreaId,
        parent_goal_id: null,
        title: 'Read Books',
        description: 'Read 24 books this year',
        goal_type: 'numeric',
        target_value: 24,
        current_value: 6,
        target_unit: 'books',
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
      const result = await GoalModel.update(goalId, updates);

      // Then
      expect(result).toBeDefined();
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM goals WHERE id = $1',
        [goalId]
      );
    });

    test('should handle empty string values correctly', async() => {
      // Given
      const goalId = 'goal_123';
      const updates = {
        description: '',
        targetUnit: '',
        deadline: '',
        metadata: {},
        reminderConfig: {}
      };

      const mockUpdatedGoal = {
        id: goalId,
        user_id: testUserId,
        life_area_id: testLifeAreaId,
        parent_goal_id: null,
        title: 'Read Books',
        description: '',
        goal_type: 'numeric',
        target_value: 24,
        current_value: 6,
        target_unit: '',
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
      const updatedGoal = await GoalModel.update(goalId, updates);

      // Then
      expect(updatedGoal).toBeDefined();
      expect(updatedGoal?.description).toBe('');
      expect(updatedGoal?.targetUnit).toBe('');
      expect(updatedGoal?.deadline).toBeNull();
    });

    test('should handle goal not found', async() => {
      // Given
      const goalId = 'goal_123';
      const updates = { title: 'Updated Title' };

      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      // When
      const result = await GoalModel.update(goalId, updates);

      // Then
      expect(result).toBeNull();
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

    test('should return 0% when target value is 0', () => {
      // Given
      const goal = {
        id: 'goal_123',
        userId: testUserId,
        lifeAreaId: testLifeAreaId,
        title: 'Read Books',
        description: null,
        goalType: GoalType.NUMERIC,
        targetValue: 0,
        currentValue: 5,
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
      expect(percentage).toBe(0);
    });

    test('should return 0% when target value is null', () => {
      // Given
      const goal = {
        id: 'goal_123',
        userId: testUserId,
        lifeAreaId: testLifeAreaId,
        title: 'Read Books',
        description: null,
        goalType: GoalType.NUMERIC,
        targetValue: null,
        currentValue: 5,
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
      expect(percentage).toBe(0);
    });

    test('should return 100% for completed goal regardless of target value', () => {
      // Given
      const goal = {
        id: 'goal_123',
        userId: testUserId,
        lifeAreaId: testLifeAreaId,
        title: 'Read Books',
        description: null,
        goalType: GoalType.NUMERIC,
        targetValue: null,
        currentValue: 0,
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

    test('should cap percentage at 100% when current value exceeds target', () => {
      // Given
      const goal = {
        id: 'goal_123',
        userId: testUserId,
        lifeAreaId: testLifeAreaId,
        title: 'Read Books',
        description: null,
        goalType: GoalType.NUMERIC,
        targetValue: 24,
        currentValue: 30,
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
      expect(percentage).toBe(100);
    });

    test('should round percentage correctly', () => {
      // Given
      const goal = {
        id: 'goal_123',
        userId: testUserId,
        lifeAreaId: testLifeAreaId,
        title: 'Read Books',
        description: null,
        goalType: GoalType.NUMERIC,
        targetValue: 100,
        currentValue: 33,
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
      expect(percentage).toBe(33); // 33/100 * 100 = 33%
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

    test('should detect completed numeric goal when current value exceeds target', () => {
      // Given
      const goal = {
        id: 'goal_123',
        userId: testUserId,
        lifeAreaId: testLifeAreaId,
        title: 'Read Books',
        description: null,
        goalType: GoalType.NUMERIC,
        targetValue: 24,
        currentValue: 30,
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

    test('should detect incomplete numeric goal when target value is null', () => {
      // Given
      const goal = {
        id: 'goal_123',
        userId: testUserId,
        lifeAreaId: testLifeAreaId,
        title: 'Read Books',
        description: null,
        goalType: GoalType.NUMERIC,
        targetValue: null,
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

    test('should detect completed binary goal', () => {
      // Given
      const goal = {
        id: 'goal_123',
        userId: testUserId,
        lifeAreaId: testLifeAreaId,
        title: 'Learn to Cook',
        description: null,
        goalType: GoalType.BINARY,
        targetValue: null,
        currentValue: 0,
        targetUnit: null,
        deadline: null,
        priority: 3,
        status: GoalStatus.COMPLETED,
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

    test('should detect incomplete binary goal', () => {
      // Given
      const goal = {
        id: 'goal_123',
        userId: testUserId,
        lifeAreaId: testLifeAreaId,
        title: 'Learn to Cook',
        description: null,
        goalType: GoalType.BINARY,
        targetValue: null,
        currentValue: 0,
        targetUnit: null,
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

    test('should detect completed milestone goal', () => {
      // Given
      const goal = {
        id: 'goal_123',
        userId: testUserId,
        lifeAreaId: testLifeAreaId,
        title: 'Complete Project Phase 1',
        description: null,
        goalType: GoalType.MILESTONE,
        targetValue: null,
        currentValue: 0,
        targetUnit: null,
        deadline: null,
        priority: 3,
        status: GoalStatus.COMPLETED,
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

    test('should detect completed habit goal', () => {
      // Given
      const goal = {
        id: 'goal_123',
        userId: testUserId,
        lifeAreaId: testLifeAreaId,
        title: 'Daily Meditation',
        description: null,
        goalType: GoalType.HABIT,
        targetValue: null,
        currentValue: 0,
        targetUnit: null,
        deadline: null,
        priority: 3,
        status: GoalStatus.COMPLETED,
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

    test('should handle unknown goal type by checking status', () => {
      // Given
      const goal = {
        id: 'goal_123',
        userId: testUserId,
        lifeAreaId: testLifeAreaId,
        title: 'Unknown Goal Type',
        description: null,
        goalType: 'UNKNOWN_TYPE' as GoalType,
        targetValue: null,
        currentValue: 0,
        targetUnit: null,
        deadline: null,
        priority: 3,
        status: GoalStatus.COMPLETED,
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
  });

  describe('mapRowToGoal', () => {
    test('should handle metadata with valid JSON', () => {
      // Given
      const row = {
        id: 'goal_123',
        user_id: testUserId,
        life_area_id: testLifeAreaId,
        parent_goal_id: null,
        title: 'Test Goal',
        description: 'Test Description',
        goal_type: 'numeric',
        target_value: '24',
        current_value: '6',
        target_unit: 'books',
        deadline: '2025-12-31',
        priority: '3',
        status: 'active',
        metadata: '{"category": "learning", "difficulty": "medium"}',
        reminder_config: '{"frequency": "daily", "time": "09:00"}',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      // When
      const goal = GoalModel['mapRowToGoal'](row);

      // Then
      expect(goal.metadata).toEqual({ category: 'learning', difficulty: 'medium' });
      expect(goal.reminderConfig).toEqual({ frequency: 'daily', time: '09:00' });
      expect(goal.targetValue).toBe(24);
      expect(goal.currentValue).toBe(6);
      expect(goal.priority).toBe(3);
      expect(goal.deadline).toEqual(new Date('2025-12-31'));
    });

    test('should handle metadata with empty JSON', () => {
      // Given
      const row = {
        id: 'goal_123',
        user_id: testUserId,
        life_area_id: testLifeAreaId,
        parent_goal_id: null,
        title: 'Test Goal',
        description: 'Test Description',
        goal_type: 'numeric',
        target_value: '24',
        current_value: '6',
        target_unit: 'books',
        deadline: null,
        priority: '3',
        status: 'active',
        metadata: '{}',
        reminder_config: '{}',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      // When
      const goal = GoalModel['mapRowToGoal'](row);

      // Then
      expect(goal.metadata).toEqual({});
      expect(goal.reminderConfig).toEqual({});
      expect(goal.deadline).toBeNull();
    });

    test('should handle null values in database row', () => {
      // Given
      const row = {
        id: 'goal_123',
        user_id: testUserId,
        life_area_id: testLifeAreaId,
        parent_goal_id: null,
        title: 'Test Goal',
        description: null,
        goal_type: 'numeric',
        target_value: null,
        current_value: '0',
        target_unit: null,
        deadline: null,
        priority: '3',
        status: 'active',
        metadata: null,
        reminder_config: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      // When
      const goal = GoalModel['mapRowToGoal'](row);

      // Then
      expect(goal.description).toBeNull();
      expect(goal.targetValue).toBeNull();
      expect(goal.targetUnit).toBeNull();
      expect(goal.deadline).toBeNull();
      expect(goal.metadata).toEqual({});
      expect(goal.reminderConfig).toEqual({});
    });
  });
});