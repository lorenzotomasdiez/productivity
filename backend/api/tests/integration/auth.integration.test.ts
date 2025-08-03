// Integration Tests for Authentication API Endpoints
import request from 'supertest';
import express from 'express';
import { AppleSignInRequest } from '../../src/types/auth';

// Mock dependencies
jest.mock('../../src/config/index.js', () => ({
  config: {
    jwt: {
      secret: 'test-jwt-secret',
      refreshSecret: 'test-refresh-secret',
    },
  },
}));

jest.mock('../../src/models/User.js', () => ({
  UserModel: {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
  },
  UserSessionModel: {
    create: jest.fn(),
    findValidSession: jest.fn(),
    deleteSession: jest.fn(),
    deleteUserSessions: jest.fn(),
  },
}));

jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(),
  getDatabase: jest.fn(),
}));

// Create test app with auth routes
const createTestApp = (): express.Application => {
  const app = express();
  app.use(express.json());
  
  // Import and use auth routes
  const authRoutes = require('../../src/routes/auth.ts').default;
  app.use('/api/v1/auth', authRoutes);
  
  // Import our actual error handler
  const { errorHandler } = require('../../src/middleware/errorHandler.ts');
  app.use(errorHandler);

  return app;
};

describe('Authentication API Integration Tests', () => {
  const app = createTestApp();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GREEN: POST /api/v1/auth/apple-signin', () => {
    test('should successfully sign in with Apple', async() => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        appleId: 'apple_123',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSession = {
        id: 'session_123',
        userId: 'user_123',
        deviceId: 'device_123',
        refreshTokenHash: 'hashed_token',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      const { UserModel, UserSessionModel } = require('../../src/models/User.js');
      UserModel.findByEmail.mockResolvedValue(null); // New user
      UserModel.create.mockResolvedValue(mockUser);
      UserSessionModel.create.mockResolvedValue(mockSession);
      UserSessionModel.deleteSession.mockResolvedValue(true);

      const appleSignInData: AppleSignInRequest = {
        identityToken: 'mock_identity_token',
        authorizationCode: 'mock_auth_code',
        user: {
          name: { firstName: 'Test', lastName: 'User' },
          email: 'test@example.com',
        },
      };

      const response = await request(app)
        .post('/api/v1/auth/apple-signin')
        .send(appleSignInData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.tokens).toBeDefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    test('should return 400 for missing required fields', async() => {
      const invalidData = {
        identityToken: 'mock_token',
        // Missing authorizationCode and user email
      };

      const response = await request(app)
        .post('/api/v1/auth/apple-signin')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GREEN: POST /api/v1/auth/refresh', () => {
    test('should refresh tokens with valid refresh token', async() => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSession = {
        id: 'session_123',
        userId: 'user_123',
        deviceId: 'device_123',
        refreshTokenHash: 'hashed_token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      const { UserModel, UserSessionModel } = require('../../src/models/User.js');
      
      // Create a real refresh token for testing
      const jwt = require('jsonwebtoken');
      const refreshToken = jwt.sign(
        { sessionId: 'session_123', userId: 'user_123' },
        'test-refresh-secret',
        { expiresIn: '30d' },
      );

      UserSessionModel.findValidSession.mockResolvedValue(mockSession);
      UserModel.findById.mockResolvedValue(mockUser);
      UserSessionModel.deleteSession.mockResolvedValue(true);
      UserSessionModel.create.mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens).toBeDefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    test('should return 400 for missing refresh token', async() => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GREEN: POST /api/v1/auth/logout', () => {
    test('should logout user with valid token', async() => {
      const { UserSessionModel } = require('../../src/models/User.js');
      UserSessionModel.deleteSession.mockResolvedValue(true);

      // Create a valid access token
      const jwt = require('jsonwebtoken');
      const accessToken = jwt.sign(
        { userId: 'user_123', email: 'test@example.com', sessionId: 'session_123' },
        'test-jwt-secret',
        { expiresIn: '15m' },
      );

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Successfully logged out');
    });

    test('should return 401 for missing token', async() => {
      const response = await request(app)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});