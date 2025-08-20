// ProgressController Unit Tests - TDD Approach to increase coverage
import { Request, Response } from 'express';
import { ProgressController } from '../../src/controllers/ProgressController';
import { ProgressEntryService } from '../../src/services/ProgressEntryService';
import { GoalService } from '../../src/services/GoalService';
import { DataSource, GoalType } from '../../src/types/goals';
import { User } from '../../src/types/auth';
import { logger } from '../../src/config/logger';

// Mock dependencies
jest.mock('../../src/services/ProgressEntryService');
jest.mock('../../src/services/GoalService');
jest.mock('../../src/config/logger');

const mockProgressEntryService = ProgressEntryService as jest.Mocked<typeof ProgressEntryService>;
const mockGoalService = GoalService as jest.Mocked<typeof GoalService>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('ProgressController Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    responseObject = {};
    mockRequest = {
      user: { 
        id: 'test-user-123', 
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      } as User,
      params: {},
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      }),
    };

    jest.clearAllMocks();
  });

  describe('createProgressEntry', () => {
    describe('Parameter Validation', () => {
      it('should return 400 when goalId is missing', async () => {
        // Given
        mockRequest.params = {};

        // When
        await ProgressController.createProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Goal ID is required',
          },
        });
      });

      it('should return 400 when goalId is empty string', async () => {
        // Given
        mockRequest.params = { goalId: '' };

        // When
        await ProgressController.createProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Goal ID is required',
          },
        });
      });
    });

    describe('Authentication Validation', () => {
      it('should return 401 when user is not authenticated', async () => {
        // Given
        delete mockRequest.user;
        mockRequest.params = { goalId: 'goal-123' };

        // When
        await ProgressController.createProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
      });

      it('should return 401 when user id is missing', async () => {
        // Given
        mockRequest.user = { 
          id: undefined as any,
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date()
        } as User;
        mockRequest.params = { goalId: 'goal-123' };

        // When
        await ProgressController.createProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
      });
    });

    describe('Request Body Validation', () => {
      beforeEach(() => {
        mockRequest.params = { goalId: 'goal-123' };
      });

      it('should return 400 when entryDate is missing', async () => {
        // Given
        mockRequest.body = { value: 10 };

        // When
        await ProgressController.createProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Entry date is required',
          },
        });
      });

      it('should return 400 when entryDate is empty string', async () => {
        // Given
        mockRequest.body = { entryDate: '', value: 10 };

        // When
        await ProgressController.createProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Entry date is required',
          },
        });
      });

      it('should return 400 when entryDate format is invalid', async () => {
        // Given
        mockRequest.body = { entryDate: '2025-1-1', value: 10 };

        // When
        await ProgressController.createProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Entry date must be in YYYY-MM-DD format',
          },
        });
      });

      it('should return 400 when entryDate format is incorrect (wrong format)', async () => {
        // Given
        mockRequest.body = { entryDate: '12/25/2025', value: 10 };

        // When
        await ProgressController.createProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Entry date must be in YYYY-MM-DD format',
          },
        });
      });

      it('should return 400 when value is not a number', async () => {
        // Given
        mockRequest.body = { entryDate: '2025-01-01', value: 'not-a-number' };

        // When
        await ProgressController.createProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Value must be a valid number',
          },
        });
      });

      it('should return 400 when value is NaN', async () => {
        // Given
        mockRequest.body = { entryDate: '2025-01-01', value: NaN };

        // When
        await ProgressController.createProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Value must be a valid number',
          },
        });
      });

      it('should accept null value', async () => {
        // Given
        mockRequest.body = { entryDate: '2025-01-01', value: null };
        const createdEntry = { id: 'entry-123', goalId: 'goal-123', value: null };
        mockProgressEntryService.createProgressEntry.mockResolvedValue(createdEntry as any);

        // When
        await ProgressController.createProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(responseObject.success).toBe(true);
      });

      it('should accept undefined value', async () => {
        // Given
        mockRequest.body = { entryDate: '2025-01-01', value: undefined };
        const createdEntry = { id: 'entry-123', goalId: 'goal-123', value: null };
        mockProgressEntryService.createProgressEntry.mockResolvedValue(createdEntry as any);

        // When
        await ProgressController.createProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(responseObject.success).toBe(true);
      });

      it('should accept valid numeric value', async () => {
        // Given
        mockRequest.body = { entryDate: '2025-01-01', value: 10.5 };
        const createdEntry = { id: 'entry-123', goalId: 'goal-123', value: 10.5 };
        mockProgressEntryService.createProgressEntry.mockResolvedValue(createdEntry as any);

        // When
        await ProgressController.createProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(responseObject.success).toBe(true);
      });
    });

    describe('Service Error Handling', () => {
      beforeEach(() => {
        mockRequest.params = { goalId: 'goal-123' };
        mockRequest.body = { entryDate: '2025-01-01', value: 10 };
      });

      it('should return 404 for goal not found error', async () => {
        // Given
        const goalNotFoundError = new Error('Goal not found');
        mockProgressEntryService.createProgressEntry.mockRejectedValue(goalNotFoundError);

        // When
        await ProgressController.createProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLogger.error).toHaveBeenCalledWith('Error creating progress entry:', goalNotFoundError);
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'GOAL_NOT_FOUND',
            message: 'Goal not found',
          },
        });
      });

      it('should return 403 for unauthorized error', async () => {
        // Given
        const unauthorizedError = new Error('Unauthorized to add progress to this goal');
        mockProgressEntryService.createProgressEntry.mockRejectedValue(unauthorizedError);

        // When
        await ProgressController.createProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to add progress to this goal',
          },
        });
      });

      it('should return 500 for unexpected errors', async () => {
        // Given
        const unexpectedError = new Error('Database connection failed');
        mockProgressEntryService.createProgressEntry.mockRejectedValue(unexpectedError);

        // When
        await ProgressController.createProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create progress entry',
          },
        });
      });
    });

    describe('Successful Creation', () => {
      it('should create progress entry with all fields', async () => {
        // Given
        mockRequest.params = { goalId: 'goal-123' };
        mockRequest.body = {
          entryDate: '2025-01-01',
          value: 10,
          notes: 'Good progress',
          dataSource: DataSource.MANUAL,
          metadata: { source: 'app' },
          attachments: [{ type: 'image', url: 'example.jpg' }]
        };
        const createdEntry = { id: 'entry-123', ...mockRequest.body };
        mockProgressEntryService.createProgressEntry.mockResolvedValue(createdEntry as any);

        // When
        await ProgressController.createProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockProgressEntryService.createProgressEntry).toHaveBeenCalledWith({
          goalId: 'goal-123',
          userId: 'test-user-123',
          entryDate: '2025-01-01',
          value: 10,
          notes: 'Good progress',
          dataSource: DataSource.MANUAL,
          metadata: { source: 'app' },
          attachments: [{ type: 'image', url: 'example.jpg' }]
        });
        expect(mockLogger.info).toHaveBeenCalledWith('Progress entry created for goal goal-123 by user test-user-123');
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(responseObject).toEqual({
          success: true,
          data: createdEntry,
        });
      });
    });
  });

  describe('getProgressEntries', () => {
    describe('Parameter Validation', () => {
      it('should return 400 when goalId is missing', async () => {
        // Given
        mockRequest.params = {};

        // When
        await ProgressController.getProgressEntries(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Goal ID is required',
          },
        });
      });

      it('should return 400 when goalId is empty string', async () => {
        // Given
        mockRequest.params = { goalId: '' };

        // When
        await ProgressController.getProgressEntries(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Goal ID is required',
          },
        });
      });
    });

    describe('Authentication Validation', () => {
      it('should return 401 when user is not authenticated', async () => {
        // Given
        delete mockRequest.user;
        mockRequest.params = { goalId: 'goal-123' };

        // When
        await ProgressController.getProgressEntries(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
      });

      it('should return 401 when user id is missing', async () => {
        // Given
        mockRequest.user = { 
          id: undefined as any,
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date()
        } as User;
        mockRequest.params = { goalId: 'goal-123' };

        // When
        await ProgressController.getProgressEntries(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
      });
    });

    describe('Goal Access Validation', () => {
      beforeEach(() => {
        mockRequest.params = { goalId: 'goal-123' };
      });

      it('should return 404 when goal does not exist', async () => {
        // Given
        mockGoalService.getGoalById.mockResolvedValue(null);

        // When
        await ProgressController.getProgressEntries(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.getGoalById).toHaveBeenCalledWith('goal-123', 'test-user-123');
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'GOAL_NOT_FOUND',
            message: 'Goal not found',
          },
        });
      });
    });

    describe('Statistics Calculation', () => {
      beforeEach(() => {
        mockRequest.params = { goalId: 'goal-123' };
      });

      it('should calculate statistics for numeric goal with progress entries', async () => {
        // Given
        const mockGoal = {
          id: 'goal-123',
          goalType: GoalType.NUMERIC,
          targetValue: 100,
          currentValue: 50
        };
        const mockProgressEntries = [
          { id: 'entry-1', value: 10, entryDate: '2025-01-01' },
          { id: 'entry-2', value: 20, entryDate: '2025-01-02' },
          { id: 'entry-3', value: null, entryDate: '2025-01-03' }
        ];

        mockGoalService.getGoalById.mockResolvedValue(mockGoal as any);
        mockProgressEntryService.getProgressEntries.mockResolvedValue(mockProgressEntries as any);

        // When
        await ProgressController.getProgressEntries(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLogger.info).toHaveBeenCalledWith('Progress entries retrieved for goal goal-123 by user test-user-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject.success).toBe(true);
        expect(responseObject.data.statistics).toEqual({
          totalEntries: 3,
          averageValue: 15, // (10 + 20) / 2
          streak: expect.any(Number),
          completionPercentage: 15 // (15 / 100) * 100
        });
      });

      it('should handle empty progress entries', async () => {
        // Given
        const mockGoal = {
          id: 'goal-123',
          goalType: GoalType.HABIT,
          targetValue: null,
          currentValue: 0
        };
        const mockProgressEntries: any[] = [];

        mockGoalService.getGoalById.mockResolvedValue(mockGoal as any);
        mockProgressEntryService.getProgressEntries.mockResolvedValue(mockProgressEntries);

        // When
        await ProgressController.getProgressEntries(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject.data.statistics).toEqual({
          totalEntries: 0,
          averageValue: 0,
          streak: 0,
          completionPercentage: 0
        });
      });

      it('should handle progress entries with only null values', async () => {
        // Given
        const mockGoal = {
          id: 'goal-123',
          goalType: GoalType.BINARY,
          targetValue: null,
          currentValue: 0
        };
        const mockProgressEntries = [
          { id: 'entry-1', value: null, entryDate: '2025-01-01' },
          { id: 'entry-2', value: null, entryDate: '2025-01-02' }
        ];

        mockGoalService.getGoalById.mockResolvedValue(mockGoal as any);
        mockProgressEntryService.getProgressEntries.mockResolvedValue(mockProgressEntries as any);

        // When
        await ProgressController.getProgressEntries(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject.data.statistics).toEqual({
          totalEntries: 2,
          averageValue: 0,
          streak: expect.any(Number),
          completionPercentage: 0
        });
      });

      it('should not calculate completion percentage for non-numeric goals', async () => {
        // Given
        const mockGoal = {
          id: 'goal-123',
          goalType: GoalType.HABIT,
          targetValue: null,
          currentValue: 0
        };
        const mockProgressEntries = [
          { id: 'entry-1', value: 5, entryDate: '2025-01-01' }
        ];

        mockGoalService.getGoalById.mockResolvedValue(mockGoal as any);
        mockProgressEntryService.getProgressEntries.mockResolvedValue(mockProgressEntries as any);

        // When
        await ProgressController.getProgressEntries(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject.data.statistics.completionPercentage).toBe(0);
      });

      it('should not calculate completion percentage for numeric goal without target value', async () => {
        // Given
        const mockGoal = {
          id: 'goal-123',
          goalType: GoalType.NUMERIC,
          targetValue: null,
          currentValue: 0
        };
        const mockProgressEntries = [
          { id: 'entry-1', value: 10, entryDate: '2025-01-01' }
        ];

        mockGoalService.getGoalById.mockResolvedValue(mockGoal as any);
        mockProgressEntryService.getProgressEntries.mockResolvedValue(mockProgressEntries as any);

        // When
        await ProgressController.getProgressEntries(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject.data.statistics.completionPercentage).toBe(0);
      });
    });

    describe('Service Error Handling', () => {
      beforeEach(() => {
        mockRequest.params = { goalId: 'goal-123' };
      });

      it('should return 404 for goal not found from service error', async () => {
        // Given
        const goalNotFoundError = new Error('Goal not found');
        mockGoalService.getGoalById.mockRejectedValue(goalNotFoundError);

        // When
        await ProgressController.getProgressEntries(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLogger.error).toHaveBeenCalledWith('Error retrieving progress entries:', goalNotFoundError);
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'GOAL_NOT_FOUND',
            message: 'Goal not found',
          },
        });
      });

      it('should return 403 for unauthorized access from service error', async () => {
        // Given
        const unauthorizedError = new Error('Unauthorized to access this goal');
        mockGoalService.getGoalById.mockRejectedValue(unauthorizedError);

        // When
        await ProgressController.getProgressEntries(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to access this goal',
          },
        });
      });

      it('should return 500 for unexpected service errors', async () => {
        // Given
        const unexpectedError = new Error('Database connection failed');
        mockGoalService.getGoalById.mockRejectedValue(unexpectedError);

        // When
        await ProgressController.getProgressEntries(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to retrieve progress entries',
          },
        });
      });
    });
  });

  describe('updateProgressEntry', () => {
    describe('Parameter Validation', () => {
      it('should return 400 when progress entry id is missing', async () => {
        // Given
        mockRequest.params = {};

        // When
        await ProgressController.updateProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Progress entry ID is required',
          },
        });
      });

      it('should return 400 when progress entry id is empty string', async () => {
        // Given
        mockRequest.params = { id: '' };

        // When
        await ProgressController.updateProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Progress entry ID is required',
          },
        });
      });
    });

    describe('Authentication Validation', () => {
      it('should return 401 when user is not authenticated', async () => {
        // Given
        delete mockRequest.user;
        mockRequest.params = { id: 'entry-123' };

        // When
        await ProgressController.updateProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
      });

      it('should return 401 when user id is missing', async () => {
        // Given
        mockRequest.user = { 
          id: undefined as any,
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date()
        } as User;
        mockRequest.params = { id: 'entry-123' };

        // When
        await ProgressController.updateProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
      });
    });

    describe('Value Validation', () => {
      beforeEach(() => {
        mockRequest.params = { id: 'entry-123' };
      });

      it('should return 400 when value is not a number', async () => {
        // Given
        mockRequest.body = { value: 'not-a-number' };

        // When
        await ProgressController.updateProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Value must be a valid number',
          },
        });
      });

      it('should return 400 when value is NaN', async () => {
        // Given
        mockRequest.body = { value: NaN };

        // When
        await ProgressController.updateProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Value must be a valid number',
          },
        });
      });

      it('should accept null value', async () => {
        // Given
        mockRequest.body = { value: null };
        const updatedEntry = { id: 'entry-123', value: null };
        mockProgressEntryService.updateProgressEntry.mockResolvedValue(updatedEntry as any);

        // When
        await ProgressController.updateProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject.success).toBe(true);
      });

      it('should accept undefined value', async () => {
        // Given
        mockRequest.body = { value: undefined };
        const updatedEntry = { id: 'entry-123', value: undefined };
        mockProgressEntryService.updateProgressEntry.mockResolvedValue(updatedEntry as any);

        // When
        await ProgressController.updateProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject.success).toBe(true);
      });
    });

    describe('Service Error Handling', () => {
      beforeEach(() => {
        mockRequest.params = { id: 'entry-123' };
        mockRequest.body = { value: 15 };
      });

      it('should return 404 for progress entry not found error', async () => {
        // Given
        const notFoundError = new Error('Progress entry not found');
        mockProgressEntryService.updateProgressEntry.mockRejectedValue(notFoundError);

        // When
        await ProgressController.updateProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLogger.error).toHaveBeenCalledWith('Error updating progress entry:', notFoundError);
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'PROGRESS_ENTRY_NOT_FOUND',
            message: 'Progress entry not found',
          },
        });
      });

      it('should return 403 for unauthorized error', async () => {
        // Given
        const unauthorizedError = new Error('Unauthorized to update this progress entry');
        mockProgressEntryService.updateProgressEntry.mockRejectedValue(unauthorizedError);

        // When
        await ProgressController.updateProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to update this progress entry',
          },
        });
      });

      it('should return 500 for unexpected errors', async () => {
        // Given
        const unexpectedError = new Error('Database update failed');
        mockProgressEntryService.updateProgressEntry.mockRejectedValue(unexpectedError);

        // When
        await ProgressController.updateProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update progress entry',
          },
        });
      });
    });

    describe('Successful Update', () => {
      it('should update progress entry with all fields', async () => {
        // Given
        mockRequest.params = { id: 'entry-123' };
        mockRequest.body = {
          value: 20,
          notes: 'Updated notes',
          dataSource: DataSource.APPLE_HEALTH,
          metadata: { updated: true },
          attachments: [{ type: 'video', url: 'example.mp4' }]
        };
        const updatedEntry = { id: 'entry-123', ...mockRequest.body };
        mockProgressEntryService.updateProgressEntry.mockResolvedValue(updatedEntry as any);

        // When
        await ProgressController.updateProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockProgressEntryService.updateProgressEntry).toHaveBeenCalledWith('entry-123', 'test-user-123', {
          value: 20,
          notes: 'Updated notes',
          dataSource: DataSource.APPLE_HEALTH,
          metadata: { updated: true },
          attachments: [{ type: 'video', url: 'example.mp4' }]
        });
        expect(mockLogger.info).toHaveBeenCalledWith('Progress entry entry-123 updated by user test-user-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject).toEqual({
          success: true,
          data: updatedEntry,
        });
      });
    });
  });

  describe('deleteProgressEntry', () => {
    describe('Parameter Validation', () => {
      it('should return 400 when progress entry id is missing', async () => {
        // Given
        mockRequest.params = {};

        // When
        await ProgressController.deleteProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Progress entry ID is required',
          },
        });
      });

      it('should return 400 when progress entry id is empty string', async () => {
        // Given
        mockRequest.params = { id: '' };

        // When
        await ProgressController.deleteProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Progress entry ID is required',
          },
        });
      });
    });

    describe('Authentication Validation', () => {
      it('should return 401 when user is not authenticated', async () => {
        // Given
        delete mockRequest.user;
        mockRequest.params = { id: 'entry-123' };

        // When
        await ProgressController.deleteProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
      });

      it('should return 401 when user id is missing', async () => {
        // Given
        mockRequest.user = { 
          id: undefined as any,
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date()
        } as User;
        mockRequest.params = { id: 'entry-123' };

        // When
        await ProgressController.deleteProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
      });
    });

    describe('Service Error Handling', () => {
      beforeEach(() => {
        mockRequest.params = { id: 'entry-123' };
      });

      it('should return 404 for progress entry not found error', async () => {
        // Given
        const notFoundError = new Error('Progress entry not found');
        mockProgressEntryService.deleteProgressEntry.mockRejectedValue(notFoundError);

        // When
        await ProgressController.deleteProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLogger.error).toHaveBeenCalledWith('Error deleting progress entry:', notFoundError);
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'PROGRESS_ENTRY_NOT_FOUND',
            message: 'Progress entry not found',
          },
        });
      });

      it('should return 403 for unauthorized error', async () => {
        // Given
        const unauthorizedError = new Error('Unauthorized to delete this progress entry');
        mockProgressEntryService.deleteProgressEntry.mockRejectedValue(unauthorizedError);

        // When
        await ProgressController.deleteProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to delete this progress entry',
          },
        });
      });

      it('should return 500 for unexpected errors', async () => {
        // Given
        const unexpectedError = new Error('Database deletion failed');
        mockProgressEntryService.deleteProgressEntry.mockRejectedValue(unexpectedError);

        // When
        await ProgressController.deleteProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject).toEqual({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete progress entry',
          },
        });
      });
    });

    describe('Successful Deletion', () => {
      it('should delete progress entry successfully', async () => {
        // Given
        mockRequest.params = { id: 'entry-123' };
        mockProgressEntryService.deleteProgressEntry.mockResolvedValue(true);

        // When
        await ProgressController.deleteProgressEntry(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockProgressEntryService.deleteProgressEntry).toHaveBeenCalledWith('entry-123', 'test-user-123');
        expect(mockLogger.info).toHaveBeenCalledWith('Progress entry entry-123 deleted by user test-user-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject).toEqual({
          success: true,
          message: 'Progress entry deleted successfully',
        });
      });
    });
  });
});