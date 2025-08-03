// ProgressEntry Model Tests
import { ProgressEntryModel } from '../../src/models/ProgressEntry';
import { DataSource } from '../../src/types/goals';

// Mock the database query function
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

const mockQuery = require('../../src/config/database').query;

describe('ProgressEntryModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new progress entry with valid data', async() => {
      const mockRow = {
        id: 'progress-123',
        goal_id: 'goal-123',
        user_id: 'user-123',
        entry_date: '2025-08-03T21:00:00.000Z',
        value: 5,
        notes: 'Made good progress today',
        data_source: DataSource.MANUAL,
        metadata: '{"mood": "good", "location": "gym"}',
        attachments: '[{"type": "image", "url": "progress.jpg"}]',
        created_at: '2025-08-03T21:00:00.000Z',
        updated_at: '2025-08-03T21:00:00.000Z',
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const progressData = {
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: '2025-08-03T21:00:00.000Z',
        value: 5,
        notes: 'Made good progress today',
        dataSource: DataSource.MANUAL,
        metadata: { mood: 'good', location: 'gym' },
        attachments: [{ type: 'image', url: 'progress.jpg' }],
      };

      const result = await ProgressEntryModel.create(progressData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO progress_entries'),
        expect.arrayContaining([
          expect.any(String), // id
          'goal-123',
          'user-123',
          expect.any(Date), // entry_date
          5,
          'Made good progress today',
          DataSource.MANUAL,
          '{"mood":"good","location":"gym"}',
          '[{"type":"image","url":"progress.jpg"}]',
          expect.any(Date), // created_at
          expect.any(Date), // updated_at
        ]),
      );

      expect(result).toEqual({
        id: 'progress-123',
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: new Date('2025-08-03T21:00:00.000Z'),
        value: 5,
        notes: 'Made good progress today',
        dataSource: DataSource.MANUAL,
        metadata: { mood: 'good', location: 'gym' },
        attachments: [{ type: 'image', url: 'progress.jpg' }],
        createdAt: new Date('2025-08-03T21:00:00.000Z'),
        updatedAt: new Date('2025-08-03T21:00:00.000Z'),
      });
    });

    it('should create progress entry with minimal required data', async() => {
      const mockRow = {
        id: 'progress-123',
        goal_id: 'goal-123',
        user_id: 'user-123',
        entry_date: '2025-08-03T21:00:00.000Z',
        value: null,
        notes: null,
        data_source: DataSource.MANUAL,
        metadata: '{}',
        attachments: '[]',
        created_at: '2025-08-03T21:00:00.000Z',
        updated_at: '2025-08-03T21:00:00.000Z',
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const progressData = {
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: '2025-08-03T21:00:00.000Z',
      };

      const result = await ProgressEntryModel.create(progressData);

      expect(result).toEqual({
        id: 'progress-123',
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: new Date('2025-08-03T21:00:00.000Z'),
        value: null,
        notes: null,
        dataSource: DataSource.MANUAL,
        metadata: {},
        attachments: [],
        createdAt: new Date('2025-08-03T21:00:00.000Z'),
        updatedAt: new Date('2025-08-03T21:00:00.000Z'),
      });
    });

    it('should throw error if goalId is missing', async() => {
      const progressData = {
        userId: 'user-123',
        entryDate: '2025-08-03T21:00:00.000Z',
      } as any;

      await expect(ProgressEntryModel.create(progressData)).rejects.toThrow(
        'Goal ID is required',
      );
    });

    it('should throw error if userId is missing', async() => {
      const progressData = {
        goalId: 'goal-123',
        entryDate: '2025-08-03T21:00:00.000Z',
      } as any;

      await expect(ProgressEntryModel.create(progressData)).rejects.toThrow(
        'User ID is required',
      );
    });

    it('should throw error if entryDate is missing', async() => {
      const progressData = {
        goalId: 'goal-123',
        userId: 'user-123',
      } as any;

      await expect(ProgressEntryModel.create(progressData)).rejects.toThrow(
        'Entry date is required',
      );
    });
  });

  describe('findByGoalId', () => {
    it('should return progress entries for a goal', async() => {
      const mockRows = [
        {
          id: 'progress-1',
          goal_id: 'goal-123',
          user_id: 'user-123',
          entry_date: '2025-08-03T21:00:00.000Z',
          value: 5,
          notes: 'First entry',
          data_source: DataSource.MANUAL,
          metadata: '{}',
          attachments: '[]',
          created_at: '2025-08-03T21:00:00.000Z',
          updated_at: '2025-08-03T21:00:00.000Z',
        },
        {
          id: 'progress-2',
          goal_id: 'goal-123',
          user_id: 'user-123',
          entry_date: '2025-08-04T21:00:00.000Z',
          value: 10,
          notes: 'Second entry',
          data_source: DataSource.APPLE_HEALTH,
          metadata: '{"source": "healthkit"}',
          attachments: '[]',
          created_at: '2025-08-04T21:00:00.000Z',
          updated_at: '2025-08-04T21:00:00.000Z',
        },
      ];

      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await ProgressEntryModel.findByGoalId('goal-123');

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM progress_entries WHERE goal_id = $1 ORDER BY entry_date DESC',
        ['goal-123'],
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'progress-1',
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: new Date('2025-08-03T21:00:00.000Z'),
        value: 5,
        notes: 'First entry',
        dataSource: DataSource.MANUAL,
        metadata: {},
        attachments: [],
        createdAt: new Date('2025-08-03T21:00:00.000Z'),
        updatedAt: new Date('2025-08-03T21:00:00.000Z'),
      });
    });

    it('should return empty array when no entries found', async() => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await ProgressEntryModel.findByGoalId('goal-123');

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a specific progress entry', async() => {
      const mockRow = {
        id: 'progress-123',
        goal_id: 'goal-123',
        user_id: 'user-123',
        entry_date: '2025-08-03T21:00:00.000Z',
        value: 5,
        notes: 'Test entry',
        data_source: DataSource.MANUAL,
        metadata: '{}',
        attachments: '[]',
        created_at: '2025-08-03T21:00:00.000Z',
        updated_at: '2025-08-03T21:00:00.000Z',
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await ProgressEntryModel.findById('progress-123');

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM progress_entries WHERE id = $1',
        ['progress-123'],
      );

      expect(result).toEqual({
        id: 'progress-123',
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: new Date('2025-08-03T21:00:00.000Z'),
        value: 5,
        notes: 'Test entry',
        dataSource: DataSource.MANUAL,
        metadata: {},
        attachments: [],
        createdAt: new Date('2025-08-03T21:00:00.000Z'),
        updatedAt: new Date('2025-08-03T21:00:00.000Z'),
      });
    });

    it('should return null when entry not found', async() => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await ProgressEntryModel.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a progress entry', async() => {
      const mockRow = {
        id: 'progress-123',
        goal_id: 'goal-123',
        user_id: 'user-123',
        entry_date: '2025-08-03T21:00:00.000Z',
        value: 10,
        notes: 'Updated notes',
        data_source: DataSource.MANUAL,
        metadata: '{"updated": true}',
        attachments: '[{"type": "image", "url": "updated.jpg"}]',
        created_at: '2025-08-03T21:00:00.000Z',
        updated_at: '2025-08-04T21:00:00.000Z',
      };

      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const updates = {
        value: 10,
        notes: 'Updated notes',
        metadata: { updated: true },
        attachments: [{ type: 'image', url: 'updated.jpg' }],
      };

      const result = await ProgressEntryModel.update('progress-123', updates);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE progress_entries'),
        expect.arrayContaining([
          10,
          'Updated notes',
          '{"updated":true}',
          '[{"type":"image","url":"updated.jpg"}]',
          expect.any(Date), // updated_at
          'progress-123',
        ]),
      );

      expect(result).toEqual({
        id: 'progress-123',
        goalId: 'goal-123',
        userId: 'user-123',
        entryDate: new Date('2025-08-03T21:00:00.000Z'),
        value: 10,
        notes: 'Updated notes',
        dataSource: DataSource.MANUAL,
        metadata: { updated: true },
        attachments: [{ type: 'image', url: 'updated.jpg' }],
        createdAt: new Date('2025-08-03T21:00:00.000Z'),
        updatedAt: new Date('2025-08-04T21:00:00.000Z'),
      });
    });

    it('should return null when entry not found for update', async() => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await ProgressEntryModel.update('nonexistent', { value: 10 });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a progress entry', async() => {
      mockQuery.mockResolvedValue({ rowCount: 1 });

      const result = await ProgressEntryModel.delete('progress-123');

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM progress_entries WHERE id = $1',
        ['progress-123'],
      );

      expect(result).toBe(true);
    });

    it('should return false when entry not found for deletion', async() => {
      mockQuery.mockResolvedValue({ rowCount: 0 });

      const result = await ProgressEntryModel.delete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('findByUserId', () => {
    it('should return all progress entries for a user', async() => {
      const mockRows = [
        {
          id: 'progress-1',
          goal_id: 'goal-123',
          user_id: 'user-123',
          entry_date: '2025-08-03T21:00:00.000Z',
          value: 5,
          notes: 'Entry 1',
          data_source: DataSource.MANUAL,
          metadata: '{}',
          attachments: '[]',
          created_at: '2025-08-03T21:00:00.000Z',
          updated_at: '2025-08-03T21:00:00.000Z',
        },
        {
          id: 'progress-2',
          goal_id: 'goal-456',
          user_id: 'user-123',
          entry_date: '2025-08-04T21:00:00.000Z',
          value: 10,
          notes: 'Entry 2',
          data_source: DataSource.APPLE_HEALTH,
          metadata: '{}',
          attachments: '[]',
          created_at: '2025-08-04T21:00:00.000Z',
          updated_at: '2025-08-04T21:00:00.000Z',
        },
      ];

      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await ProgressEntryModel.findByUserId('user-123');

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM progress_entries WHERE user_id = $1 ORDER BY entry_date DESC',
        ['user-123'],
      );

      expect(result).toHaveLength(2);
      expect(result[0]?.userId).toBe('user-123');
      expect(result[1]?.userId).toBe('user-123');
    });
  });
});
