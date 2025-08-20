// Life Areas API Integration Tests
import request from 'supertest';
import express from 'express';
import { LifeAreaType } from '../../src/types/lifeAreas.js';

// Mock config first
jest.mock('../../src/config/index.js', () => ({
  config: {
    logging: { level: 'info' },
    jwt: { secret: 'test-secret', refreshSecret: 'test-refresh' },
    database: { url: 'test-db' },
    cors: { origin: '*' },
    rateLimit: { windowMs: 900000, maxRequests: 100 },
  },
}));

// Mock the database and services for integration testing
jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(),
  getDatabase: jest.fn(),
}));

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

// Create test app with life areas routes
const createTestApp = (): express.Application => {
  const app = express();
  app.use(express.json());
  
  // Import and use life areas routes
  const { lifeAreasRouter } = require('../../src/routes/lifeAreas.js');
  app.use('/api/v1/life-areas', lifeAreasRouter);
  
  // Import our actual error handler
  const { errorHandler } = require('../../src/middleware/errorHandler.js');
  app.use(errorHandler);

  return app;
};

import { LifeAreaModel } from '../../src/models/LifeArea.js';

const mockLifeAreaModel = LifeAreaModel as jest.Mocked<typeof LifeAreaModel>;

// Create the test app
const app = createTestApp();

// Helper function to create JWT tokens for testing
const createTestToken = (userId: string = 'test-user-123') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, email: 'test@example.com', sessionId: 'session_123' },
    'test-secret',
    { expiresIn: '15m' }
  );
};

describe('Life Areas API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/life-areas', () => {
    test('should return user life areas', async() => {
      // Given
      const mockLifeAreas = [
        {
          id: '550e8400-e29b-41d4-a716-446655440020',
          userId: 'test-user-123',
          name: 'Health',
          type: LifeAreaType.HEALTH,
          isActive: true,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440021',
          userId: 'test-user-123',
          name: 'Finance',
          type: LifeAreaType.FINANCE,
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockLifeAreaModel.findByUserId.mockResolvedValue(mockLifeAreas);

      // When
      const response = await request(app)
        .get('/api/v1/life-areas')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('Health');
      expect(response.body.data[1].name).toBe('Finance');
      expect(mockLifeAreaModel.findByUserId).toHaveBeenCalledWith('test-user-123', {});
    });

    test('should filter by active status', async() => {
      // Given
      const mockActiveAreas = [
        {
          id: '550e8400-e29b-41d4-a716-446655440022',
          userId: 'test-user-123',
          name: 'Health',
          type: LifeAreaType.HEALTH,
          isActive: true,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockLifeAreaModel.findByUserId.mockResolvedValue(mockActiveAreas);

      // When
      const response = await request(app)
        .get('/api/v1/life-areas?isActive=true')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      // The controller should parse the query parameter and pass the correct filter
      expect(mockLifeAreaModel.findByUserId).toHaveBeenCalledWith('test-user-123', { isActive: true });
    });
  });

  describe('POST /api/v1/life-areas', () => {
    test('should create new life area', async() => {
      // Given
      const newLifeAreaData = {
        name: 'Learning & Development',
        type: LifeAreaType.LEARNING,
        description: 'Personal skill development',
        icon: 'book.fill',
        color: '#007AFF',
      };

      const mockCreatedArea = {
        id: '550e8400-e29b-41d4-a716-446655440023',
        userId: 'test-user-123',
        ...newLifeAreaData,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLifeAreaModel.findByUserId.mockResolvedValue([]);
      mockLifeAreaModel.create.mockResolvedValue(mockCreatedArea);

      // When
      const response = await request(app)
        .post('/api/v1/life-areas')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send(newLifeAreaData)
        .expect(201);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Learning & Development');
      expect(response.body.data.type).toBe(LifeAreaType.LEARNING);
      expect(mockLifeAreaModel.create).toHaveBeenCalledWith('test-user-123', newLifeAreaData);
    });

    test('should return 400 for missing required fields', async() => {
      // Given
      const invalidData = {
        // Missing name and type
        description: 'Invalid data',
      };

      // When
      const response = await request(app)
        .post('/api/v1/life-areas')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send(invalidData)
        .expect(422);

      // Then
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      // The validation middleware catches this before it reaches our controller
      expect(response.body.error.message).toBe('Request validation failed');
    });

    test('should return 409 for duplicate names', async() => {
      // Given
      const duplicateData = {
        name: 'Health',
        type: LifeAreaType.HEALTH,
      };

      mockLifeAreaModel.findByUserId.mockResolvedValue([
        {
          id: '550e8400-e29b-41d4-a716-446655440024',
          userId: 'test-user-123',
          name: 'health', // Same name, different case
          type: LifeAreaType.HEALTH,
          isActive: true,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // When
      const response = await request(app)
        .post('/api/v1/life-areas')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send(duplicateData)
        .expect(409);

      // Then
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('GET /api/v1/life-areas/:id', () => {
    test('should return specific life area', async() => {
      // Given
      const mockLifeArea = {
        id: '550e8400-e29b-41d4-a716-446655440025',
        userId: 'test-user-123',
        name: 'Health & Fitness',
        type: LifeAreaType.HEALTH,
        description: 'Physical wellbeing',
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLifeAreaModel.findById.mockResolvedValue(mockLifeArea);

      // When
      const response = await request(app)
        .get('/api/v1/life-areas/550e8400-e29b-41d4-a716-446655440025')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('550e8400-e29b-41d4-a716-446655440025');
      expect(response.body.data.name).toBe('Health & Fitness');
    });

    test('should return 404 for non-existent life area', async() => {
      // Given
      mockLifeAreaModel.findById.mockResolvedValue(null);

      // When
      const response = await request(app)
        .get('/api/v1/life-areas/550e8400-e29b-41d4-a716-446655440026')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(404);

      // Then
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/life-areas/:id', () => {
    test('should update life area successfully', async() => {
      // Given
      const existingArea = {
        id: '550e8400-e29b-41d4-a716-446655440027',
        userId: 'test-user-123',
        name: 'Original Name',
        type: LifeAreaType.HEALTH,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedArea = {
        ...existingArea,
        name: 'Updated Name',
        description: 'Updated description',
      };

      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      mockLifeAreaModel.findById.mockResolvedValue(existingArea);
      mockLifeAreaModel.update.mockResolvedValue(updatedArea);

      // When
      const response = await request(app)
        .put('/api/v1/life-areas/550e8400-e29b-41d4-a716-446655440027')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(mockLifeAreaModel.update).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440027', updateData);
    });
  });

  describe('DELETE /api/v1/life-areas/:id', () => {
    test('should delete life area successfully', async() => {
      // Given
      const existingArea = {
        id: '550e8400-e29b-41d4-a716-446655440028',
        userId: 'test-user-123',
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
      const response = await request(app)
        .delete('/api/v1/life-areas/550e8400-e29b-41d4-a716-446655440028')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Life area deleted successfully');
      expect(mockLifeAreaModel.delete).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440028');
    });
  });
});