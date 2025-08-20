// LifeAreaController Unit Tests - TDD Approach
import { Request, Response } from 'express';
import { LifeAreaController } from '../../src/controllers/LifeAreaController';
import { LifeAreaService } from '../../src/services/LifeAreaService';
import { LifeAreaType } from '../../src/types/lifeAreas';
import { User } from '../../src/types/auth';
import { logger } from '../../src/config/logger';

// Mock dependencies
jest.mock('../../src/services/LifeAreaService');
jest.mock('../../src/config/logger');

const mockLifeAreaService = LifeAreaService as jest.Mocked<typeof LifeAreaService>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('LifeAreaController', () => {
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

  describe('getLifeAreas', () => {
    describe('Authentication Validation', () => {
      it('should return 401 when user is not authenticated', async () => {
        // Given
        delete mockRequest.user;

        // When
        await LifeAreaController.getLifeAreas(mockRequest as Request, mockResponse as Response);

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
        await LifeAreaController.getLifeAreas(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
      });
    });

    describe('Query Filters', () => {
      it('should parse is_active filter correctly', async () => {
        // Given
        mockRequest.query = { is_active: 'true' };
        const mockLifeAreas = [{ id: 'area1', name: 'Health', isActive: true }];
        mockLifeAreaService.getUserLifeAreas.mockResolvedValue(mockLifeAreas as any);

        // When
        await LifeAreaController.getLifeAreas(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLifeAreaService.getUserLifeAreas).toHaveBeenCalledWith('test-user-123', { isActive: true });
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject.success).toBe(true);
        expect(responseObject.data).toEqual(mockLifeAreas);
      });

      it('should parse is_active filter as false', async () => {
        // Given
        mockRequest.query = { is_active: 'false' };
        const mockLifeAreas: any[] = [];
        mockLifeAreaService.getUserLifeAreas.mockResolvedValue(mockLifeAreas);

        // When
        await LifeAreaController.getLifeAreas(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLifeAreaService.getUserLifeAreas).toHaveBeenCalledWith('test-user-123', { isActive: false });
      });

      it('should parse valid type filter', async () => {
        // Given
        mockRequest.query = { type: LifeAreaType.HEALTH };
        const mockLifeAreas: any[] = [];
        mockLifeAreaService.getUserLifeAreas.mockResolvedValue(mockLifeAreas);

        // When
        await LifeAreaController.getLifeAreas(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLifeAreaService.getUserLifeAreas).toHaveBeenCalledWith('test-user-123', { type: LifeAreaType.HEALTH });
      });

      it('should ignore invalid type filter', async () => {
        // Given
        mockRequest.query = { type: 'INVALID_TYPE' };
        const mockLifeAreas: any[] = [];
        mockLifeAreaService.getUserLifeAreas.mockResolvedValue(mockLifeAreas);

        // When
        await LifeAreaController.getLifeAreas(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLifeAreaService.getUserLifeAreas).toHaveBeenCalledWith('test-user-123', {});
      });

      it('should handle multiple filters', async () => {
        // Given
        mockRequest.query = { is_active: 'true', type: LifeAreaType.FINANCE };
        const mockLifeAreas: any[] = [];
        mockLifeAreaService.getUserLifeAreas.mockResolvedValue(mockLifeAreas);

        // When
        await LifeAreaController.getLifeAreas(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLifeAreaService.getUserLifeAreas).toHaveBeenCalledWith('test-user-123', { 
          isActive: true, 
          type: LifeAreaType.FINANCE 
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        // Given
        const databaseError = new Error('Database connection failed');
        mockLifeAreaService.getUserLifeAreas.mockRejectedValue(databaseError);

        // When
        await LifeAreaController.getLifeAreas(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLogger.error).toHaveBeenCalledWith('Error fetching life areas', {
          error: databaseError,
          userId: 'test-user-123',
        });
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch life areas' },
        });
      });

      it('should handle service timeout errors', async () => {
        // Given
        const timeoutError = new Error('Service timeout');
        mockLifeAreaService.getUserLifeAreas.mockRejectedValue(timeoutError);

        // When
        await LifeAreaController.getLifeAreas(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject.error.code).toBe('INTERNAL_SERVER_ERROR');
      });
    });
  });

  describe('createLifeArea', () => {
    describe('Authentication Validation', () => {
      it('should return 401 when user is not authenticated', async () => {
        // Given
        delete mockRequest.user;

        // When
        await LifeAreaController.createLifeArea(mockRequest as Request, mockResponse as Response);

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
      it('should return 409 for duplicate life area names', async () => {
        // Given
        mockRequest.body = { name: 'Health', type: LifeAreaType.HEALTH };
        const duplicateError = new Error('A life area with this name already exists');
        mockLifeAreaService.createLifeArea.mockRejectedValue(duplicateError);

        // When
        await LifeAreaController.createLifeArea(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLogger.error).toHaveBeenCalledWith('Error creating life area', {
          error: duplicateError,
          userId: 'test-user-123',
          body: mockRequest.body,
        });
        expect(mockResponse.status).toHaveBeenCalledWith(409);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'CONFLICT', message: 'A life area with this name already exists' },
        });
      });

      it('should return 422 for validation errors from service', async () => {
        // Given
        mockRequest.body = { name: 'Invalid Color', type: LifeAreaType.HEALTH, color: 'invalid' };
        const validationError = new Error('Color must be a valid hex color code');
        mockLifeAreaService.createLifeArea.mockRejectedValue(validationError);

        // When
        await LifeAreaController.createLifeArea(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(422);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Color must be a valid hex color code' },
        });
      });

      it('should return 422 for required field errors from service', async () => {
        // Given
        mockRequest.body = { name: 'Test', type: LifeAreaType.HEALTH };
        const requiredError = new Error('Life area name is required');
        mockLifeAreaService.createLifeArea.mockRejectedValue(requiredError);

        // When
        await LifeAreaController.createLifeArea(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(422);
        expect(responseObject.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 422 for Invalid errors from service', async () => {
        // Given
        mockRequest.body = { name: 'Test', type: 'INVALID_TYPE' };
        const invalidError = new Error('Invalid life area type');
        mockLifeAreaService.createLifeArea.mockRejectedValue(invalidError);

        // When
        await LifeAreaController.createLifeArea(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(422);
        expect(responseObject.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 500 for unexpected database errors', async () => {
        // Given
        mockRequest.body = { name: 'Health', type: LifeAreaType.HEALTH };
        const databaseError = new Error('Database connection lost');
        mockLifeAreaService.createLifeArea.mockRejectedValue(databaseError);

        // When
        await LifeAreaController.createLifeArea(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create life area' },
        });
      });
    });

    describe('Successful Creation', () => {
      it('should create life area successfully', async () => {
        // Given
        const requestData = { name: 'Health', type: LifeAreaType.HEALTH };
        const createdLifeArea = { id: 'area-123', userId: 'test-user-123', ...requestData };
        mockRequest.body = requestData;
        mockLifeAreaService.createLifeArea.mockResolvedValue(createdLifeArea as any);

        // When
        await LifeAreaController.createLifeArea(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLifeAreaService.createLifeArea).toHaveBeenCalledWith('test-user-123', requestData);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(responseObject).toEqual({
          success: true,
          data: createdLifeArea,
        });
      });
    });
  });

  describe('getLifeAreaById', () => {
    describe('Authentication Validation', () => {
      it('should return 401 when user is not authenticated', async () => {
        // Given
        delete mockRequest.user;
        mockRequest.params = { id: 'area-123' };

        // When
        await LifeAreaController.getLifeAreaById(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
      });
    });

    describe('Authorization', () => {
      it('should return 403 when life area belongs to different user', async () => {
        // Given
        mockRequest.params = { id: 'area-123' };
        const otherUserLifeArea = { id: 'area-123', userId: 'other-user', name: 'Health' };
        mockLifeAreaService.getLifeAreaById.mockResolvedValue(otherUserLifeArea as any);

        // When
        await LifeAreaController.getLifeAreaById(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied to this life area' },
        });
      });
    });

    describe('Not Found Handling', () => {
      it('should return 404 when life area does not exist', async () => {
        // Given
        mockRequest.params = { id: 'nonexistent' };
        mockLifeAreaService.getLifeAreaById.mockResolvedValue(null);

        // When
        await LifeAreaController.getLifeAreaById(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Life area not found' },
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        // Given
        mockRequest.params = { id: 'area-123' };
        const databaseError = new Error('Database query failed');
        mockLifeAreaService.getLifeAreaById.mockRejectedValue(databaseError);

        // When
        await LifeAreaController.getLifeAreaById(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLogger.error).toHaveBeenCalledWith('Error fetching life area', {
          error: databaseError,
          lifeAreaId: 'area-123',
          userId: 'test-user-123',
        });
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch life area' },
        });
      });
    });

    describe('Successful Retrieval', () => {
      it('should return life area when user owns it', async () => {
        // Given
        mockRequest.params = { id: 'area-123' };
        const userLifeArea = { id: 'area-123', userId: 'test-user-123', name: 'Health' };
        mockLifeAreaService.getLifeAreaById.mockResolvedValue(userLifeArea as any);

        // When
        await LifeAreaController.getLifeAreaById(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLifeAreaService.getLifeAreaById).toHaveBeenCalledWith('area-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject).toEqual({
          success: true,
          data: userLifeArea,
        });
      });
    });
  });

  describe('updateLifeArea', () => {
    describe('Authentication Validation', () => {
      it('should return 401 when user is not authenticated', async () => {
        // Given
        delete mockRequest.user;
        mockRequest.params = { id: 'area-123' };
        mockRequest.body = { name: 'Updated Name' };

        // When
        await LifeAreaController.updateLifeArea(mockRequest as Request, mockResponse as Response);

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
        mockRequest.body = { name: 'Updated Name' };
        const notFoundError = new Error('Life area not found');
        mockLifeAreaService.updateLifeArea.mockRejectedValue(notFoundError);

        // When
        await LifeAreaController.updateLifeArea(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Life area not found' },
        });
      });

      it('should return 403 for unauthorized errors', async () => {
        // Given
        mockRequest.params = { id: 'area-123' };
        mockRequest.body = { name: 'Updated Name' };
        const unauthorizedError = new Error('Unauthorized to update this life area');
        mockLifeAreaService.updateLifeArea.mockRejectedValue(unauthorizedError);

        // When
        await LifeAreaController.updateLifeArea(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Unauthorized to update this life area' },
        });
      });

      it('should return 409 for duplicate name conflicts', async () => {
        // Given
        mockRequest.params = { id: 'area-123' };
        mockRequest.body = { name: 'Existing Name' };
        const conflictError = new Error('A life area with this name already exists');
        mockLifeAreaService.updateLifeArea.mockRejectedValue(conflictError);

        // When
        await LifeAreaController.updateLifeArea(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(409);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'CONFLICT', message: 'A life area with this name already exists' },
        });
      });

      it('should return 422 for validation errors', async () => {
        // Given
        mockRequest.params = { id: 'area-123' };
        mockRequest.body = { color: 'invalid-color' };
        const validationError = new Error('Color must be a valid hex color code');
        mockLifeAreaService.updateLifeArea.mockRejectedValue(validationError);

        // When
        await LifeAreaController.updateLifeArea(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(422);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Color must be a valid hex color code' },
        });
      });

      it('should return 500 for unexpected errors', async () => {
        // Given
        mockRequest.params = { id: 'area-123' };
        mockRequest.body = { name: 'Updated Name' };
        const unexpectedError = new Error('Database connection failed');
        mockLifeAreaService.updateLifeArea.mockRejectedValue(unexpectedError);

        // When
        await LifeAreaController.updateLifeArea(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLogger.error).toHaveBeenCalledWith('Error updating life area', {
          error: unexpectedError,
          lifeAreaId: 'area-123',
          userId: 'test-user-123',
        });
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update life area' },
        });
      });
    });

    describe('Successful Update', () => {
      it('should update life area successfully', async () => {
        // Given
        mockRequest.params = { id: 'area-123' };
        mockRequest.body = { name: 'Updated Name', description: 'Updated description' };
        const updatedLifeArea = { id: 'area-123', userId: 'test-user-123', ...mockRequest.body };
        mockLifeAreaService.updateLifeArea.mockResolvedValue(updatedLifeArea as any);

        // When
        await LifeAreaController.updateLifeArea(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLifeAreaService.updateLifeArea).toHaveBeenCalledWith('area-123', 'test-user-123', mockRequest.body);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject).toEqual({
          success: true,
          data: updatedLifeArea,
        });
      });
    });
  });

  describe('deleteLifeArea', () => {
    describe('Authentication Validation', () => {
      it('should return 401 when user is not authenticated', async () => {
        // Given
        delete mockRequest.user;
        mockRequest.params = { id: 'area-123' };

        // When
        await LifeAreaController.deleteLifeArea(mockRequest as Request, mockResponse as Response);

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
        const notFoundError = new Error('Life area not found');
        mockLifeAreaService.deleteLifeArea.mockRejectedValue(notFoundError);

        // When
        await LifeAreaController.deleteLifeArea(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Life area not found' },
        });
      });

      it('should return 403 for unauthorized errors', async () => {
        // Given
        mockRequest.params = { id: 'area-123' };
        const unauthorizedError = new Error('Unauthorized to delete this life area');
        mockLifeAreaService.deleteLifeArea.mockRejectedValue(unauthorizedError);

        // When
        await LifeAreaController.deleteLifeArea(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Unauthorized to delete this life area' },
        });
      });

      it('should return 500 for unexpected errors', async () => {
        // Given
        mockRequest.params = { id: 'area-123' };
        const unexpectedError = new Error('Database deletion failed');
        mockLifeAreaService.deleteLifeArea.mockRejectedValue(unexpectedError);

        // When
        await LifeAreaController.deleteLifeArea(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLogger.error).toHaveBeenCalledWith('Error deleting life area', {
          error: unexpectedError,
          lifeAreaId: 'area-123',
          userId: 'test-user-123',
        });
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete life area' },
        });
      });
    });

    describe('Successful Deletion', () => {
      it('should delete life area successfully', async () => {
        // Given
        mockRequest.params = { id: 'area-123' };
        mockLifeAreaService.deleteLifeArea.mockResolvedValue(true);

        // When
        await LifeAreaController.deleteLifeArea(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLifeAreaService.deleteLifeArea).toHaveBeenCalledWith('area-123', 'test-user-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject).toEqual({
          success: true,
          message: 'Life area deleted successfully',
        });
      });
    });
  });

  describe('reorderLifeAreas', () => {
    describe('Authentication Validation', () => {
      it('should return 401 when user is not authenticated', async () => {
        // Given
        delete mockRequest.user;
        mockRequest.body = { life_area_ids: ['area-1', 'area-2'] };

        // When
        await LifeAreaController.reorderLifeAreas(mockRequest as Request, mockResponse as Response);

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

    describe('Authorization Errors', () => {
      it('should return 403 when life areas do not belong to user', async () => {
        // Given
        mockRequest.body = { life_area_ids: ['area-1', 'area-2'] };
        const authError = new Error('Some life areas do not belong to the user');
        mockLifeAreaService.reorderLifeAreas.mockRejectedValue(authError);

        // When
        await LifeAreaController.reorderLifeAreas(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Some life areas do not belong to the user' },
        });
      });
    });

    describe('Error Handling', () => {
      it('should return 500 for unexpected errors', async () => {
        // Given
        mockRequest.body = { life_area_ids: ['area-1', 'area-2'] };
        const unexpectedError = new Error('Database transaction failed');
        mockLifeAreaService.reorderLifeAreas.mockRejectedValue(unexpectedError);

        // When
        await LifeAreaController.reorderLifeAreas(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLogger.error).toHaveBeenCalledWith('Error reordering life areas', {
          error: unexpectedError,
          userId: 'test-user-123',
        });
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject).toEqual({
          success: false,
          error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to reorder life areas' },
        });
      });
    });

    describe('Successful Reordering', () => {
      it('should reorder life areas successfully', async () => {
        // Given
        const lifeAreaIds = ['area-1', 'area-2', 'area-3'];
        mockRequest.body = { life_area_ids: lifeAreaIds };
        const reorderedAreas = [
          { id: 'area-1', sortOrder: 0 },
          { id: 'area-2', sortOrder: 1 },
          { id: 'area-3', sortOrder: 2 },
        ];
        mockLifeAreaService.reorderLifeAreas.mockResolvedValue(reorderedAreas as any);

        // When
        await LifeAreaController.reorderLifeAreas(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLifeAreaService.reorderLifeAreas).toHaveBeenCalledWith('test-user-123', lifeAreaIds);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject).toEqual({
          success: true,
          data: reorderedAreas,
        });
      });

      it('should handle empty array successfully', async () => {
        // Given
        mockRequest.body = { life_area_ids: [] };
        mockLifeAreaService.reorderLifeAreas.mockResolvedValue([]);

        // When
        await LifeAreaController.reorderLifeAreas(mockRequest as Request, mockResponse as Response);

        // Then
        expect(mockLifeAreaService.reorderLifeAreas).toHaveBeenCalledWith('test-user-123', []);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject).toEqual({
          success: true,
          data: [],
        });
      });
    });
  });
});