// ProgressEntryService Tests
import { ProgressEntryService } from '../../src/services/ProgressEntryService';
import { ProgressEntryModel } from '../../src/models/ProgressEntry';
import { GoalModel } from '../../src/models/Goal';
import { DataSource } from '../../src/types/goals';

// Mock the models
jest.mock('../../src/models/ProgressEntry');
jest.mock('../../src/models/Goal');

const mockProgressEntryModel = ProgressEntryModel as jest.Mocked<typeof ProgressEntryModel>;
const mockGoalModel = GoalModel as jest.Mocked<typeof GoalModel>;

describe('ProgressEntryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProgressEntry', () => {
    it('should create a progress entry for a valid goal', async() => {
      const mockGoal = {
        id: 'goal-123',
        userId: 'user-123',
        title: 'Test Goal',
        goalType: 'numeric',
        currentValue: 5,
        targetValue: 100,
        status: 'active',
      } as any;

      const mockProgressEntry = {
        id: 'progress-123',
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: new Date('2025-08-03T21:00:00.000Z'),
        value: 10,
        notes: 'Made progress',
        dataSource: DataSource.MANUAL,
        metadata: {},
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGoalModel.findById.mockResolvedValue(mockGoal);
      mockProgressEntryModel.create.mockResolvedValue(mockProgressEntry);

      const progressData = {
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: '2025-08-03T21:00:00.000Z',
        value: 10,
        notes: 'Made progress',
        dataSource: DataSource.MANUAL,
      };

      const result = await ProgressEntryService.createProgressEntry(progressData);

      expect(mockGoalModel.findById).toHaveBeenCalledWith('goal-123');
      expect(mockProgressEntryModel.create).toHaveBeenCalledWith(progressData);
      expect(result).toEqual(mockProgressEntry);
    });

    it('should throw error if goal not found', async() => {
      mockGoalModel.findById.mockResolvedValue(null);

      const progressData = {
        goalId: 'nonexistent',
        userId: 'user-123',
        entryDate: '2025-08-03T21:00:00.000Z',
        value: 10,
      };

      await expect(ProgressEntryService.createProgressEntry(progressData)).rejects.toThrow(
        'Goal not found',
      );

      expect(mockGoalModel.findById).toHaveBeenCalledWith('nonexistent');
      expect(mockProgressEntryModel.create).not.toHaveBeenCalled();
    });

    it('should throw error if user does not own the goal', async() => {
      const mockGoal = {
        id: 'goal-123',
        userId: 'different-user',
        title: 'Test Goal',
        goalType: 'numeric',
        currentValue: 5,
        targetValue: 100,
        status: 'active',
      } as any;

      mockGoalModel.findById.mockResolvedValue(mockGoal);

      const progressData = {
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: '2025-08-03T21:00:00.000Z',
        value: 10,
      };

      await expect(ProgressEntryService.createProgressEntry(progressData)).rejects.toThrow(
        'Unauthorized to add progress to this goal',
      );

      expect(mockGoalModel.findById).toHaveBeenCalledWith('goal-123');
      expect(mockProgressEntryModel.create).not.toHaveBeenCalled();
    });

    it('should NOT directly write goal current value when progress entry has value (DB trigger updates)', async() => {
      const mockGoal = {
        id: 'goal-123',
        userId: 'user-123',
        title: 'Test Goal',
        goalType: 'numeric',
        currentValue: 5,
        targetValue: 100,
        status: 'active',
      } as any;

      const mockProgressEntry = {
        id: 'progress-123',
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: new Date('2025-08-03T21:00:00.000Z'),
        value: 15,
        notes: 'Made progress',
        dataSource: DataSource.MANUAL,
        metadata: {},
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGoalModel.findById.mockResolvedValue(mockGoal);
      mockProgressEntryModel.create.mockResolvedValue(mockProgressEntry);

      const progressData = {
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: '2025-08-03T21:00:00.000Z',
        value: 15,
        notes: 'Made progress',
      };

      const result = await ProgressEntryService.createProgressEntry(progressData);

      expect(mockGoalModel.update).not.toHaveBeenCalled();
      expect(result).toEqual(mockProgressEntry);
    });

    it('should not update goal current value when progress entry has no value', async() => {
      const mockGoal = {
        id: 'goal-123',
        userId: 'user-123',
        title: 'Test Goal',
        goalType: 'numeric',
        currentValue: 5,
        targetValue: 100,
        status: 'active',
      } as any;

      const mockProgressEntry = {
        id: 'progress-123',
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: new Date('2025-08-03T21:00:00.000Z'),
        value: null,
        notes: 'Just a note',
        dataSource: DataSource.MANUAL,
        metadata: {},
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGoalModel.findById.mockResolvedValue(mockGoal);
      mockProgressEntryModel.create.mockResolvedValue(mockProgressEntry);

      const progressData = {
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: '2025-08-03T21:00:00.000Z',
        notes: 'Just a note',
      };

      const result = await ProgressEntryService.createProgressEntry(progressData);

      expect(mockGoalModel.update).not.toHaveBeenCalled();
      expect(result).toEqual(mockProgressEntry);
    });
  });

  describe('getProgressEntries', () => {
    it('should return progress entries for a goal', async() => {
      const mockGoal = {
        id: 'goal-123',
        userId: 'user-123',
        title: 'Test Goal',
        goalType: 'numeric',
        currentValue: 5,
        targetValue: 100,
        status: 'active',
      } as any;

      const mockProgressEntries = [
        {
          id: 'progress-1',
          goalId: 'goal-123',
          userId: 'user-123',
          entryDate: new Date('2025-08-03T21:00:00.000Z'),
          value: 5,
          notes: 'First entry',
          dataSource: DataSource.MANUAL,
          metadata: {},
          attachments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'progress-2',
          goalId: 'goal-123',
          userId: 'user-123',
          entryDate: new Date('2025-08-04T21:00:00.000Z'),
          value: 10,
          notes: 'Second entry',
          dataSource: DataSource.APPLE_HEALTH,
          metadata: {},
          attachments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGoalModel.findById.mockResolvedValue(mockGoal);
      mockProgressEntryModel.findByGoalId.mockResolvedValue(mockProgressEntries);

      const result = await ProgressEntryService.getProgressEntries('goal-123', 'user-123');

      expect(mockGoalModel.findById).toHaveBeenCalledWith('goal-123');
      expect(mockProgressEntryModel.findByGoalId).toHaveBeenCalledWith('goal-123');
      expect(result).toEqual(mockProgressEntries);
    });

    it('should throw error if goal not found', async() => {
      mockGoalModel.findById.mockResolvedValue(null);

      await expect(ProgressEntryService.getProgressEntries('nonexistent', 'user-123')).rejects.toThrow(
        'Goal not found',
      );

      expect(mockGoalModel.findById).toHaveBeenCalledWith('nonexistent');
      expect(mockProgressEntryModel.findByGoalId).not.toHaveBeenCalled();
    });

    it('should throw error if user does not own the goal', async() => {
      const mockGoal = {
        id: 'goal-123',
        userId: 'different-user',
        title: 'Test Goal',
        goalType: 'numeric',
        currentValue: 5,
        targetValue: 100,
        status: 'active',
      } as any;

      mockGoalModel.findById.mockResolvedValue(mockGoal);

      await expect(ProgressEntryService.getProgressEntries('goal-123', 'user-123')).rejects.toThrow(
        'Unauthorized to access this goal',
      );

      expect(mockGoalModel.findById).toHaveBeenCalledWith('goal-123');
      expect(mockProgressEntryModel.findByGoalId).not.toHaveBeenCalled();
    });
  });

  describe('updateProgressEntry', () => {
    it('should update a progress entry', async() => {
      const mockGoal = {
        id: 'goal-123',
        userId: 'user-123',
        title: 'Test Goal',
        goalType: 'numeric',
        currentValue: 5,
        targetValue: 100,
        status: 'active',
      } as any;

      const mockProgressEntry = {
        id: 'progress-123',
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: new Date('2025-08-03T21:00:00.000Z'),
        value: 15,
        notes: 'Updated notes',
        dataSource: DataSource.MANUAL,
        metadata: {},
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProgressEntryModel.findById.mockResolvedValue(mockProgressEntry);
      mockGoalModel.findById.mockResolvedValue(mockGoal);
      mockProgressEntryModel.update.mockResolvedValue(mockProgressEntry);

      const updates = {
        value: 15,
        notes: 'Updated notes',
      };

      const result = await ProgressEntryService.updateProgressEntry('progress-123', 'user-123', updates);

      expect(mockProgressEntryModel.findById).toHaveBeenCalledWith('progress-123');
      expect(mockGoalModel.findById).toHaveBeenCalledWith('goal-123');
      expect(mockProgressEntryModel.update).toHaveBeenCalledWith('progress-123', updates);
      expect(result).toEqual(mockProgressEntry);
    });

    it('should throw error if progress entry not found', async() => {
      mockProgressEntryModel.findById.mockResolvedValue(null);

      const updates = { value: 15 };

      await expect(ProgressEntryService.updateProgressEntry('nonexistent', 'user-123', updates)).rejects.toThrow(
        'Progress entry not found',
      );

      expect(mockProgressEntryModel.findById).toHaveBeenCalledWith('nonexistent');
      expect(mockProgressEntryModel.update).not.toHaveBeenCalled();
    });

    it('should throw error if user does not own the goal', async() => {
      const mockProgressEntry = {
        id: 'progress-123',
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: new Date('2025-08-03T21:00:00.000Z'),
        value: 5,
        notes: 'Test entry',
        dataSource: DataSource.MANUAL,
        metadata: {},
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockGoal = {
        id: 'goal-123',
        userId: 'different-user',
        title: 'Test Goal',
        goalType: 'numeric',
        currentValue: 5,
        targetValue: 100,
        status: 'active',
      } as any;

      mockProgressEntryModel.findById.mockResolvedValue(mockProgressEntry);
      mockGoalModel.findById.mockResolvedValue(mockGoal);

      const updates = { value: 15 };

      await expect(ProgressEntryService.updateProgressEntry('progress-123', 'user-123', updates)).rejects.toThrow(
        'Unauthorized to update this progress entry',
      );

      expect(mockProgressEntryModel.findById).toHaveBeenCalledWith('progress-123');
      expect(mockGoalModel.findById).toHaveBeenCalledWith('goal-123');
      expect(mockProgressEntryModel.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteProgressEntry', () => {
    it('should delete a progress entry', async() => {
      const mockGoal = {
        id: 'goal-123',
        userId: 'user-123',
        title: 'Test Goal',
        goalType: 'numeric',
        currentValue: 5,
        targetValue: 100,
        status: 'active',
      } as any;

      const mockProgressEntry = {
        id: 'progress-123',
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: new Date('2025-08-03T21:00:00.000Z'),
        value: 5,
        notes: 'Test entry',
        dataSource: DataSource.MANUAL,
        metadata: {},
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProgressEntryModel.findById.mockResolvedValue(mockProgressEntry);
      mockGoalModel.findById.mockResolvedValue(mockGoal);
      mockProgressEntryModel.delete.mockResolvedValue(true);

      const result = await ProgressEntryService.deleteProgressEntry('progress-123', 'user-123');

      expect(mockProgressEntryModel.findById).toHaveBeenCalledWith('progress-123');
      expect(mockGoalModel.findById).toHaveBeenCalledWith('goal-123');
      expect(mockProgressEntryModel.delete).toHaveBeenCalledWith('progress-123');
      expect(result).toBe(true);
    });

    it('should throw error if progress entry not found', async() => {
      mockProgressEntryModel.findById.mockResolvedValue(null);

      await expect(ProgressEntryService.deleteProgressEntry('nonexistent', 'user-123')).rejects.toThrow(
        'Progress entry not found',
      );

      expect(mockProgressEntryModel.findById).toHaveBeenCalledWith('nonexistent');
      expect(mockProgressEntryModel.delete).not.toHaveBeenCalled();
    });

    it('should throw error if user does not own the goal', async() => {
      const mockProgressEntry = {
        id: 'progress-123',
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: new Date('2025-08-03T21:00:00.000Z'),
        value: 5,
        notes: 'Test entry',
        dataSource: DataSource.MANUAL,
        metadata: {},
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockGoal = {
        id: 'goal-123',
        userId: 'different-user',
        title: 'Test Goal',
        goalType: 'numeric',
        currentValue: 5,
        targetValue: 100,
        status: 'active',
      } as any;

      mockProgressEntryModel.findById.mockResolvedValue(mockProgressEntry);
      mockGoalModel.findById.mockResolvedValue(mockGoal);

      await expect(ProgressEntryService.deleteProgressEntry('progress-123', 'user-123')).rejects.toThrow(
        'Unauthorized to delete this progress entry',
      );

      expect(mockProgressEntryModel.findById).toHaveBeenCalledWith('progress-123');
      expect(mockGoalModel.findById).toHaveBeenCalledWith('goal-123');
      expect(mockProgressEntryModel.delete).not.toHaveBeenCalled();
    });
  });
});
