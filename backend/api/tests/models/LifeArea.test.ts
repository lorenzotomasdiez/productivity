// LifeArea Model Tests - TDD Implementation

// Mock all config dependencies before importing
jest.mock('../../src/config/index.js', () => ({
  config: {
    logging: { level: 'info' },
    jwt: { secret: 'test-secret', refreshSecret: 'test-refresh' },
    database: { url: 'test-db' },
  },
}));

jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(),
  getDatabase: jest.fn(),
}));

import { LifeAreaModel } from '../../src/models/LifeArea.js';
import { LifeAreaType } from '../../src/types/lifeAreas.js';
import { v4 as uuidv4 } from 'uuid';

describe('LifeArea Model', () => {
  const testUserId = uuidv4();
  const mockQuery = require('../../src/config/database.js').query;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create a new life area with required fields', async() => {
      // Given
      const lifeAreaData = {
        name: 'Health & Fitness',
        type: LifeAreaType.HEALTH,
        description: 'Physical and mental wellbeing',
      };

      const mockLifeArea = {
        id: 'life_area_123',
        user_id: testUserId,
        name: lifeAreaData.name,
        type: lifeAreaData.type,
        description: lifeAreaData.description,
        icon: null,
        color: null,
        configuration: '{}',
        is_active: true,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery.mockResolvedValue({ rows: [mockLifeArea], rowCount: 1 });

      // When
      const lifeArea = await LifeAreaModel.create(testUserId, lifeAreaData);

      // Then
      expect(lifeArea).toBeDefined();
      expect(lifeArea.id).toBe('life_area_123');
      expect(lifeArea.userId).toBe(testUserId);
      expect(lifeArea.name).toBe('Health & Fitness');
      expect(lifeArea.type).toBe(LifeAreaType.HEALTH);
      expect(lifeArea.description).toBe('Physical and mental wellbeing');
      expect(lifeArea.isActive).toBe(true);
      expect(lifeArea.sortOrder).toBe(0);
      expect(lifeArea.createdAt).toBeInstanceOf(Date);
      expect(lifeArea.updatedAt).toBeInstanceOf(Date);
    });

    test('should create life area with optional fields', async() => {
      // Given
      const lifeAreaData = {
        name: 'Learning',
        type: LifeAreaType.LEARNING,
        icon: 'book.fill',
        color: '#007AFF',
        sortOrder: 5,
      };

      const mockLifeArea = {
        id: 'life_area_456',
        user_id: testUserId,
        name: lifeAreaData.name,
        type: lifeAreaData.type,
        description: null,
        icon: lifeAreaData.icon,
        color: lifeAreaData.color,
        configuration: '{}',
        is_active: true,
        sort_order: lifeAreaData.sortOrder,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery.mockResolvedValue({ rows: [mockLifeArea], rowCount: 1 });

      // When
      const lifeArea = await LifeAreaModel.create(testUserId, lifeAreaData);

      // Then
      expect(lifeArea.icon).toBe('book.fill');
      expect(lifeArea.color).toBe('#007AFF');
      expect(lifeArea.sortOrder).toBe(5);
    });

    test('should throw error with invalid data', async() => {
      // Given
      const invalidData = {
        name: '',
        type: 'invalid_type' as any,
      };

      // When & Then
      await expect(LifeAreaModel.create(testUserId, invalidData))
        .rejects.toThrow();
    });
  });

  describe('findByUserId', () => {
    test('should return all life areas for user', async() => {
      // Given - Mock query to return 2 life areas
      const mockLifeAreas = [
        {
          id: 'area_1',
          user_id: testUserId,
          name: 'Health',
          type: 'health',
          description: null,
          icon: null,
          color: null,
          configuration: '{}',
          is_active: true,
          sort_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'area_2',
          user_id: testUserId,
          name: 'Finance',
          type: 'finance',
          description: null,
          icon: null,
          color: null,
          configuration: '{}',
          is_active: true,
          sort_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockQuery.mockResolvedValue({ rows: mockLifeAreas, rowCount: 2 });

      // When
      const lifeAreas = await LifeAreaModel.findByUserId(testUserId);

      // Then
      expect(lifeAreas).toHaveLength(2);
      expect(lifeAreas[0]?.userId).toBe(testUserId);
      expect(lifeAreas[1]?.userId).toBe(testUserId);
    });

    test('should filter by active status', async() => {
      // Given - Mock query to return only active areas
      const mockActiveAreas = [
        {
          id: 'area_active',
          user_id: testUserId,
          name: 'Active Area',
          type: 'work',
          description: null,
          icon: null,
          color: null,
          configuration: '{}',
          is_active: true,
          sort_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockQuery.mockResolvedValue({ rows: mockActiveAreas, rowCount: 1 });

      // When
      const activeAreas = await LifeAreaModel.findByUserId(testUserId, { isActive: true });

      // Then
      expect(activeAreas).toHaveLength(1);
      expect(activeAreas[0]?.name).toBe('Active Area');
    });
  });

  describe('findById', () => {
    test('should return life area by id', async() => {
      // Given - Mock query to return specific life area
      const mockLifeArea = {
        id: 'test_area_123',
        user_id: testUserId,
        name: 'Test Area',
        type: 'productivity',
        description: null,
        icon: null,
        color: null,
        configuration: '{}',
        is_active: true,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery.mockResolvedValue({ rows: [mockLifeArea], rowCount: 1 });

      // When
      const found = await LifeAreaModel.findById('test_area_123');

      // Then
      expect(found).toBeDefined();
      expect(found?.id).toBe('test_area_123');
      expect(found?.name).toBe('Test Area');
    });

    test('should return null for non-existent id', async() => {
      // Given - Mock query to return empty result
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      // When
      const result = await LifeAreaModel.findById('nonexistent');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    test('should update life area successfully', async() => {
      // Given - Mock query to return updated life area
      const mockUpdatedArea = {
        id: 'update_area_123',
        user_id: testUserId,
        name: 'Updated Name',
        type: 'learning',
        description: 'New description',
        icon: 'star.fill',
        color: null,
        configuration: '{}',
        is_active: true,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery.mockResolvedValue({ rows: [mockUpdatedArea], rowCount: 1 });

      // When
      const updated = await LifeAreaModel.update('update_area_123', {
        name: 'Updated Name',
        description: 'New description',
        icon: 'star.fill',
      });

      // Then
      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.description).toBe('New description');
      expect(updated?.icon).toBe('star.fill');
    });
  });

  describe('delete', () => {
    test('should delete life area successfully', async() => {
      // Given - Mock query to return successful deletion
      mockQuery.mockResolvedValue({ rowCount: 1 });

      // When
      const deleted = await LifeAreaModel.delete('delete_area_123');

      // Then
      expect(deleted).toBe(true);
    });
  });
});