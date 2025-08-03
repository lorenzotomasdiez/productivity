// LifeAreaService Tests - TDD Implementation

// Mock dependencies
jest.mock('../../src/models/LifeArea.js', () => ({
  LifeAreaModel: {
    create: jest.fn(),
    findByUserId: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    reorder: jest.fn(),
  },
}));

import { LifeAreaService } from '../../src/services/LifeAreaService.js';
import { LifeAreaModel } from '../../src/models/LifeArea.js';
import { LifeAreaType } from '../../src/types/lifeAreas.js';
import { v4 as uuidv4 } from 'uuid';

const mockLifeAreaModel = LifeAreaModel as jest.Mocked<typeof LifeAreaModel>;

describe('LifeAreaService', () => {
  const testUserId = uuidv4();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLifeArea', () => {
    test('should create life area successfully', async() => {
      // Given
      const lifeAreaData = {
        name: 'Health & Fitness',
        type: LifeAreaType.HEALTH,
        description: 'Physical wellbeing',
      };

      const mockCreatedArea = {
        id: 'area_123',
        userId: testUserId,
        name: 'Health & Fitness',
        type: LifeAreaType.HEALTH,
        description: 'Physical wellbeing',
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLifeAreaModel.findByUserId.mockResolvedValue([]);
      mockLifeAreaModel.create.mockResolvedValue(mockCreatedArea);

      // When
      const result = await LifeAreaService.createLifeArea(testUserId, lifeAreaData);

      // Then
      expect(mockLifeAreaModel.findByUserId).toHaveBeenCalledWith(testUserId);
      expect(mockLifeAreaModel.create).toHaveBeenCalledWith(testUserId, lifeAreaData);
      expect(result).toEqual(mockCreatedArea);
    });

    test('should throw error for duplicate names', async() => {
      // Given
      const lifeAreaData = {
        name: 'Health',
        type: LifeAreaType.HEALTH,
      };

      const existingArea = {
        id: 'existing_123',
        userId: testUserId,
        name: 'health',
        type: LifeAreaType.HEALTH,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLifeAreaModel.findByUserId.mockResolvedValue([existingArea]);

      // When & Then
      await expect(LifeAreaService.createLifeArea(testUserId, lifeAreaData))
        .rejects.toThrow('A life area with this name already exists');
    });

    test('should validate required fields', async() => {
      // Given
      const invalidData = {
        name: '',
        type: LifeAreaType.HEALTH,
      };

      // When & Then
      await expect(LifeAreaService.createLifeArea(testUserId, invalidData))
        .rejects.toThrow('Life area name is required');
    });

    test('should validate color format', async() => {
      // Given
      const invalidData = {
        name: 'Test',
        type: LifeAreaType.HEALTH,
        color: 'invalid-color',
      };

      // When & Then
      await expect(LifeAreaService.createLifeArea(testUserId, invalidData))
        .rejects.toThrow('Color must be a valid hex color code');
    });
  });

  describe('updateLifeArea', () => {
    test('should update life area successfully', async() => {
      // Given
      const areaId = 'area_123';
      const updates = { name: 'Updated Name' };

      const existingArea = {
        id: areaId,
        userId: testUserId,
        name: 'Original Name',
        type: LifeAreaType.HEALTH,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedArea = { ...existingArea, name: 'Updated Name' };

      mockLifeAreaModel.findById.mockResolvedValue(existingArea);
      mockLifeAreaModel.findByUserId.mockResolvedValue([existingArea]);
      mockLifeAreaModel.update.mockResolvedValue(updatedArea);

      // When
      const result = await LifeAreaService.updateLifeArea(areaId, testUserId, updates);

      // Then
      expect(mockLifeAreaModel.findById).toHaveBeenCalledWith(areaId);
      expect(mockLifeAreaModel.update).toHaveBeenCalledWith(areaId, updates);
      expect(result).toEqual(updatedArea);
    });

    test('should throw error if life area not found', async() => {
      // Given
      const areaId = 'nonexistent';
      const updates = { name: 'Updated' };

      mockLifeAreaModel.findById.mockResolvedValue(null);

      // When & Then
      await expect(LifeAreaService.updateLifeArea(areaId, testUserId, updates))
        .rejects.toThrow('Life area not found');
    });

    test('should throw error if user unauthorized', async() => {
      // Given
      const areaId = 'area_123';
      const wrongUserId = 'different_user';
      const updates = { name: 'Updated' };

      const existingArea = {
        id: areaId,
        userId: testUserId, // Different from wrongUserId
        name: 'Original',
        type: LifeAreaType.HEALTH,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLifeAreaModel.findById.mockResolvedValue(existingArea);

      // When & Then
      await expect(LifeAreaService.updateLifeArea(areaId, wrongUserId, updates))
        .rejects.toThrow('Unauthorized to update this life area');
    });
  });

  describe('deleteLifeArea', () => {
    test('should delete life area successfully', async() => {
      // Given
      const areaId = 'area_123';

      const existingArea = {
        id: areaId,
        userId: testUserId,
        name: 'To Delete',
        type: LifeAreaType.CUSTOM,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLifeAreaModel.findById.mockResolvedValue(existingArea);
      mockLifeAreaModel.delete.mockResolvedValue(true);

      // When
      const result = await LifeAreaService.deleteLifeArea(areaId, testUserId);

      // Then
      expect(mockLifeAreaModel.findById).toHaveBeenCalledWith(areaId);
      expect(mockLifeAreaModel.delete).toHaveBeenCalledWith(areaId);
      expect(result).toBe(true);
    });

    test('should throw error if unauthorized', async() => {
      // Given
      const areaId = 'area_123';
      const wrongUserId = 'different_user';

      const existingArea = {
        id: areaId,
        userId: testUserId, // Different from wrongUserId
        name: 'Protected',
        type: LifeAreaType.HEALTH,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLifeAreaModel.findById.mockResolvedValue(existingArea);

      // When & Then
      await expect(LifeAreaService.deleteLifeArea(areaId, wrongUserId))
        .rejects.toThrow('Unauthorized to delete this life area');
    });
  });
});