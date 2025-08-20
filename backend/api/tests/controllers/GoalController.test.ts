// GoalController Unit Tests - TDD Approach
import { Request, Response } from 'express';
import { GoalController } from '../../src/controllers/GoalController';
import { GoalService } from '../../src/services/GoalService';
import { GoalType, GoalStatus } from '../../src/types/goals';
import { User } from '../../src/types/auth';
import { logger } from '../../src/config/logger';

// Mock dependencies
jest.mock('../../src/services/GoalService');
jest.mock('../../src/config/logger');

const mockGoalService = GoalService as jest.Mocked<typeof GoalService>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('GoalController', () => {
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
      query: {},
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

  describe('getGoals', () => {
    describe('Authentication Validation', () => {
      it('should return 401 when user is not authenticated', async () => {
        // Given
        delete mockRequest.user;

        // When
        await GoalController.getGoals(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
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

        // When
        await GoalController.getGoals(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
      });
    });

    describe('Query Filters', () => {
      it('should parse life_area_id filter correctly', async () => {
        // Given
        mockRequest.query = { life_area_id: 'area-123' };
        const mockGoals = [{ id: 'goal1', title: 'Test Goal' }];
        mockGoalService.getUserGoals.mockResolvedValue(mockGoals as any);

        // When
        await GoalController.getGoals(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.getUserGoals).toHaveBeenCalledWith('test-user-123', { lifeAreaId: 'area-123' });
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject.success).toBe(true);
        expect(responseObject.data).toEqual(mockGoals);
      });

      it('should parse valid status filter', async () => {
        // Given
        mockRequest.query = { status: GoalStatus.ACTIVE };
        const mockGoals: any[] = [];
        mockGoalService.getUserGoals.mockResolvedValue(mockGoals);

        // When
        await GoalController.getGoals(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.getUserGoals).toHaveBeenCalledWith('test-user-123', { status: GoalStatus.ACTIVE });
      });

      it('should ignore invalid status filter', async () => {
        // Given
        mockRequest.query = { status: 'INVALID_STATUS' };
        const mockGoals: any[] = [];
        mockGoalService.getUserGoals.mockResolvedValue(mockGoals);

        // When
        await GoalController.getGoals(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.getUserGoals).toHaveBeenCalledWith('test-user-123', {});
      });

      it('should parse valid goalType filter', async () => {
        // Given
        mockRequest.query = { goalType: GoalType.NUMERIC };
        const mockGoals: any[] = [];
        mockGoalService.getUserGoals.mockResolvedValue(mockGoals);

        // When
        await GoalController.getGoals(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.getUserGoals).toHaveBeenCalledWith('test-user-123', { goalType: GoalType.NUMERIC });
      });

      it('should ignore invalid goalType filter', async () => {
        // Given
        mockRequest.query = { goalType: 'INVALID_TYPE' };
        const mockGoals: any[] = [];
        mockGoalService.getUserGoals.mockResolvedValue(mockGoals);

        // When
        await GoalController.getGoals(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.getUserGoals).toHaveBeenCalledWith('test-user-123', {});
      });

      it('should parse parent_goal_id filter for null value', async () => {
        // Given
        mockRequest.query = { parent_goal_id: 'null' };
        const mockGoals: any[] = [];
        mockGoalService.getUserGoals.mockResolvedValue(mockGoals);

        // When
        await GoalController.getGoals(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.getUserGoals).toHaveBeenCalledWith('test-user-123', { parentGoalId: null });
      });

      it('should parse parent_goal_id filter for specific value', async () => {
        // Given
        mockRequest.query = { parent_goal_id: 'parent-goal-123' };
        const mockGoals: any[] = [];
        mockGoalService.getUserGoals.mockResolvedValue(mockGoals);

        // When
        await GoalController.getGoals(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.getUserGoals).toHaveBeenCalledWith('test-user-123', { parentGoalId: 'parent-goal-123' });
      });

      it('should parse has_deadline filter as true', async () => {
        // Given
        mockRequest.query = { has_deadline: 'true' };
        const mockGoals: any[] = [];
        mockGoalService.getUserGoals.mockResolvedValue(mockGoals);

        // When
        await GoalController.getGoals(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.getUserGoals).toHaveBeenCalledWith('test-user-123', { hasDeadline: true });
      });

      it('should parse has_deadline filter as false', async () => {
        // Given
        mockRequest.query = { has_deadline: 'false' };
        const mockGoals: any[] = [];
        mockGoalService.getUserGoals.mockResolvedValue(mockGoals);

        // When
        await GoalController.getGoals(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.getUserGoals).toHaveBeenCalledWith('test-user-123', { hasDeadline: false });
      });

      it('should handle multiple filters', async () => {
        // Given
        mockRequest.query = { 
          life_area_id: 'area-123',
          status: GoalStatus.ACTIVE,
          goalType: GoalType.HABIT,
          has_deadline: 'true'
        };
        const mockGoals: any[] = [];
        mockGoalService.getUserGoals.mockResolvedValue(mockGoals);

        // When
        await GoalController.getGoals(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.getUserGoals).toHaveBeenCalledWith('test-user-123', { 
          lifeAreaId: 'area-123',
          status: GoalStatus.ACTIVE,
          goalType: GoalType.HABIT,
          hasDeadline: true
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        // Given
        const databaseError = new Error('Database connection failed');
        mockGoalService.getUserGoals.mockRejectedValue(databaseError);

        // When
        await GoalController.getGoals(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLogger.error).toHaveBeenCalledWith('Error fetching goals', {
          error: databaseError,
          userId: 'test-user-123',
        });
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch goals' },
        });
      });

      it('should handle service timeout errors', async () => {
        // Given
        const timeoutError = new Error('Service timeout');
        mockGoalService.getUserGoals.mockRejectedValue(timeoutError);

        // When
        await GoalController.getGoals(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject.error.code).toBe('INTERNAL_SERVER_ERROR');
      });
    });
  });

  describe('createGoal', () => {
    describe('Authentication Validation', () => {
      it('should return 401 when user is not authenticated', async () => {
        // Given
        delete mockRequest.user;

        // When
        await GoalController.createGoal(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
      });
    });

    // Note: Input validation is now handled by middleware, not controllers
    // Validation tests are covered in integration tests

    describe('Business Logic Error Handling', () => {
      it('should return 404 for life area not found errors', async () => {
        // Given
        mockRequest.body = { title: 'Test Goal', lifeAreaId: 'nonexistent', goalType: GoalType.NUMERIC };
        const notFoundError = new Error('Life area not found');
        mockGoalService.createGoal.mockRejectedValue(notFoundError);

        // When
        await GoalController.createGoal(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLogger.error).toHaveBeenCalledWith('Error creating goal', {
          error: notFoundError,
          userId: 'test-user-123',
          body: mockRequest.body,
        });
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Life area not found' },
        });
      });

      it('should return 403 for unauthorized access to life area', async () => {
        // Given
        mockRequest.body = { title: 'Test Goal', lifeAreaId: 'area-123', goalType: GoalType.NUMERIC };
        const unauthorizedError = new Error('Unauthorized to access this life area');
        mockGoalService.createGoal.mockRejectedValue(unauthorizedError);

        // When
        await GoalController.createGoal(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Unauthorized to access this life area' },
        });
      });

      it('should return 422 for validation errors from service (must have)', async () => {
        // Given
        mockRequest.body = { title: 'Test Goal', lifeAreaId: 'area-123', goalType: GoalType.NUMERIC };
        const validationError = new Error('Numeric goals must have a target value');
        mockGoalService.createGoal.mockRejectedValue(validationError);

        // When
        await GoalController.createGoal(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(422);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Numeric goals must have a target value' },
        });
      });

      it('should return 422 for validation errors from service (required)', async () => {
        // Given
        mockRequest.body = { title: 'Test Goal', lifeAreaId: 'area-123', goalType: GoalType.NUMERIC };
        const validationError = new Error('Target unit is required for numeric goals');
        mockGoalService.createGoal.mockRejectedValue(validationError);

        // When
        await GoalController.createGoal(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(422);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Target unit is required for numeric goals' },
        });
      });

      it('should return 422 for validation errors from service (Invalid)', async () => {
        // Given
        mockRequest.body = { title: 'Test Goal', lifeAreaId: 'area-123', goalType: 'invalid_type' };
        const validationError = new Error('Invalid goal type specified');
        mockGoalService.createGoal.mockRejectedValue(validationError);

        // When
        await GoalController.createGoal(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(422);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid goal type specified' },
        });
      });

      it('should return 500 for unexpected database errors', async () => {
        // Given
        mockRequest.body = { title: 'Test Goal', lifeAreaId: 'area-123', goalType: GoalType.NUMERIC };
        const databaseError = new Error('Database connection lost');
        mockGoalService.createGoal.mockRejectedValue(databaseError);

        // When
        await GoalController.createGoal(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create goal' },
        });
      });
    });

    describe('Goal Type Specific Validation Tests', () => {
      it('should create numeric goal successfully', async () => {
        // Given
        const requestData = { 
          title: 'Lose Weight', 
          lifeAreaId: 'area-123', 
          goalType: GoalType.NUMERIC,
          targetValue: 10,
          targetUnit: 'kg'
        };
        const createdGoal = { id: 'goal-123', userId: 'test-user-123', ...requestData };
        mockRequest.body = requestData;
        mockGoalService.createGoal.mockResolvedValue(createdGoal as any);

        // When
        await GoalController.createGoal(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.createGoal).toHaveBeenCalledWith('test-user-123', requestData);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(responseObject).toEqual({
          success: true,
          data: createdGoal,
        });
      });

      it('should create habit goal successfully', async () => {
        // Given
        const requestData = { 
          title: 'Exercise Daily', 
          lifeAreaId: 'area-123', 
          goalType: GoalType.HABIT
        };
        const createdGoal = { id: 'goal-123', userId: 'test-user-123', ...requestData };
        mockRequest.body = requestData;
        mockGoalService.createGoal.mockResolvedValue(createdGoal as any);

        // When
        await GoalController.createGoal(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.createGoal).toHaveBeenCalledWith('test-user-123', requestData);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(responseObject).toEqual({
          success: true,
          data: createdGoal,
        });
      });

      it('should create milestone goal successfully', async () => {
        // Given
        const requestData = { 
          title: 'Get Promotion', 
          lifeAreaId: 'area-123', 
          goalType: GoalType.MILESTONE,
          deadline: '2025-12-31'
        };
        const createdGoal = { id: 'goal-123', userId: 'test-user-123', ...requestData };
        mockRequest.body = requestData;
        mockGoalService.createGoal.mockResolvedValue(createdGoal as any);

        // When
        await GoalController.createGoal(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.createGoal).toHaveBeenCalledWith('test-user-123', requestData);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(responseObject).toEqual({
          success: true,
          data: createdGoal,
        });
      });

      it('should create binary goal successfully', async () => {
        // Given
        const requestData = { 
          title: 'Learn Guitar', 
          lifeAreaId: 'area-123', 
          goalType: GoalType.BINARY
        };
        const createdGoal = { id: 'goal-123', userId: 'test-user-123', ...requestData };
        mockRequest.body = requestData;
        mockGoalService.createGoal.mockResolvedValue(createdGoal as any);

        // When
        await GoalController.createGoal(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.createGoal).toHaveBeenCalledWith('test-user-123', requestData);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(responseObject).toEqual({
          success: true,
          data: createdGoal,
        });
      });
    });
  });

  describe('getGoalById', () => {
    describe('Authentication Validation', () => {
      it('should return 401 when user is not authenticated', async () => {
        // Given
        delete mockRequest.user;
        mockRequest.params = { id: 'goal-123' };

        // When
        await GoalController.getGoalById(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
      });
    });

    describe('Not Found Handling', () => {
      it('should return 404 when goal does not exist', async () => {
        // Given
        mockRequest.params = { id: 'nonexistent' };
        mockGoalService.getGoalById.mockResolvedValue(null);

        // When
        await GoalController.getGoalById(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.getGoalById).toHaveBeenCalledWith('nonexistent', 'test-user-123');
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Goal not found' },
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        // Given
        mockRequest.params = { id: 'goal-123' };
        const databaseError = new Error('Database query failed');
        mockGoalService.getGoalById.mockRejectedValue(databaseError);

        // When
        await GoalController.getGoalById(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLogger.error).toHaveBeenCalledWith('Error fetching goal', {
          error: databaseError,
          goalId: 'goal-123',
          userId: 'test-user-123',
        });
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch goal' },
        });
      });
    });

    describe('Successful Retrieval', () => {
      it('should return goal when it exists and user owns it', async () => {
        // Given
        mockRequest.params = { id: 'goal-123' };
        const userGoal = { id: 'goal-123', userId: 'test-user-123', title: 'Test Goal' };
        mockGoalService.getGoalById.mockResolvedValue(userGoal as any);

        // When
        await GoalController.getGoalById(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.getGoalById).toHaveBeenCalledWith('goal-123', 'test-user-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject).toEqual({
          success: true,
          data: userGoal,
        });
      });
    });
  });

  describe('updateGoalProgress (deprecated)', () => {
    it('should always return 410 (deprecated endpoint)', async () => {
      // Given
      mockRequest.params = { id: 'goal-123' };
      mockRequest.body = { currentValue: 5 };

      // When
      await GoalController.updateGoalProgress(mockRequest as Request, mockResponse as Response);

      // Then
      expect(mockResponse.status).toHaveBeenCalledWith(410);
      expect(responseObject).toEqual({
        success: false,
        error: { code: 'GONE', message: 'Deprecated. Create a progress entry instead.' },
      });
    });

    it('should return 410 even with no authentication', async () => {
      // Given
      delete mockRequest.user;
      mockRequest.params = { id: 'goal-123' };
      mockRequest.body = { currentValue: 5 };

      // When
      await GoalController.updateGoalProgress(mockRequest as Request, mockResponse as Response);

      // Then
      expect(mockResponse.status).toHaveBeenCalledWith(410);
      expect(responseObject).toEqual({
        success: false,
        error: { code: 'GONE', message: 'Deprecated. Create a progress entry instead.' },
      });
    });

    it('should return 410 for any goal id', async () => {
      // Given
      mockRequest.params = { id: 'any-goal-id' };
      mockRequest.body = { currentValue: 10 };

      // When
      await GoalController.updateGoalProgress(mockRequest as Request, mockResponse as Response);

      // Then
      expect(mockResponse.status).toHaveBeenCalledWith(410);
      expect(responseObject.error.code).toBe('GONE');
    });
  });

  describe('deleteGoal', () => {
    describe('Authentication Validation', () => {
      it('should return 401 when user is not authenticated', async () => {
        // Given
        delete mockRequest.user;
        mockRequest.params = { id: 'goal-123' };

        // When
        await GoalController.deleteGoal(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
      });
    });

    describe('Error Handling from Service', () => {
      it('should return 404 for not found errors', async () => {
        // Given
        mockRequest.params = { id: 'nonexistent' };
        const notFoundError = new Error('Goal not found');
        mockGoalService.deleteGoal.mockRejectedValue(notFoundError);

        // When
        await GoalController.deleteGoal(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Goal not found' },
        });
      });

      it('should return 403 for unauthorized errors', async () => {
        // Given
        mockRequest.params = { id: 'goal-123' };
        const unauthorizedError = new Error('Unauthorized to delete this goal');
        mockGoalService.deleteGoal.mockRejectedValue(unauthorizedError);

        // When
        await GoalController.deleteGoal(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Unauthorized to delete this goal' },
        });
      });

      it('should return 500 for unexpected errors', async () => {
        // Given
        mockRequest.params = { id: 'goal-123' };
        const unexpectedError = new Error('Database deletion failed');
        mockGoalService.deleteGoal.mockRejectedValue(unexpectedError);

        // When
        await GoalController.deleteGoal(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLogger.error).toHaveBeenCalledWith('Error deleting goal', {
          error: unexpectedError,
          goalId: 'goal-123',
          userId: 'test-user-123',
        });
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete goal' },
        });
      });
    });

    describe('Successful Deletion', () => {
      it('should delete goal successfully', async () => {
        // Given
        mockRequest.params = { id: 'goal-123' };
        mockGoalService.deleteGoal.mockResolvedValue(true);

        // When
        await GoalController.deleteGoal(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockGoalService.deleteGoal).toHaveBeenCalledWith('goal-123', 'test-user-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject).toEqual({
          success: true,
          message: 'Goal deleted successfully',
        });
      });
    });
  });
});