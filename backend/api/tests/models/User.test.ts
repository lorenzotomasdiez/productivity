// TDD Tests for User Model

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

import { UserModel, UserSessionModel } from '../../src/models/User';
import { CreateUserRequest } from '../../src/types/auth';

describe('User Model - TDD', () => {
  // Mock database queries for testing

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UserModel.create', () => {
    test('should create user with required fields', async() => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        appleId: 'apple_123',
        name: 'Test User',
      };

      // Mock database response
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        apple_id: 'apple_123',
        name: 'Test User',
        profile_data: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = require('../../src/config/database.js').query;
      mockQuery.mockResolvedValue({ rows: [mockUser], rowCount: 1 });

      const result = await UserModel.create(userData);

      expect(result.email).toBe('test@example.com');
      expect(result.appleId).toBe('apple_123');
      expect(result.name).toBe('Test User');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['test@example.com', 'apple_123', 'Test User']),
      );
    });

    test('should create user with minimal data', async() => {
      const userData: CreateUserRequest = {
        email: 'minimal@example.com',
      };

      const mockUser = {
        id: 'user_456',
        email: 'minimal@example.com',
        apple_id: null,
        name: null,
        profile_data: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = require('../../src/config/database.js').query;
      mockQuery.mockResolvedValue({ rows: [mockUser], rowCount: 1 });

      const result = await UserModel.create(userData);

      expect(result.email).toBe('minimal@example.com');
      expect(result.appleId).toBeNull();
      expect(result.name).toBeNull();
    });
  });

  describe('UserModel.findByEmail', () => {
    test('should find user by email', async() => {
      const mockUser = {
        id: 'user_123',
        email: 'existing@example.com',
        apple_id: 'apple_123',
        name: 'Existing User',
        profile_data: '{"theme": "dark"}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = require('../../src/config/database.js').query;
      mockQuery.mockResolvedValue({ rows: [mockUser], rowCount: 1 });

      const result = await UserModel.findByEmail('existing@example.com');

      expect(result).toBeDefined();
      expect(result?.email).toBe('existing@example.com');
      expect(result?.profileData).toEqual({ theme: 'dark' });
    });

    test('should return null for non-existent email', async() => {
      const mockQuery = require('../../src/config/database.js').query;
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await UserModel.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('UserModel.findById', () => {
    test('should find user by ID', async() => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        apple_id: 'apple_123',
        name: 'Test User',
        profile_data: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = require('../../src/config/database.js').query;
      mockQuery.mockResolvedValue({ rows: [mockUser], rowCount: 1 });

      const result = await UserModel.findById('user_123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('user_123');
      expect(result?.email).toBe('test@example.com');
    });
  });

  describe('UserModel.update', () => {
    test('should update user fields', async() => {
      const updates: Partial<CreateUserRequest> = {
        name: 'Updated Name',
        profileData: { theme: 'light' },
      };

      const mockUpdatedUser = {
        id: 'user_123',
        email: 'test@example.com',
        apple_id: 'apple_123',
        name: 'Updated Name',
        profile_data: '{"theme": "light"}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = require('../../src/config/database.js').query;
      mockQuery.mockResolvedValue({ rows: [mockUpdatedUser], rowCount: 1 });

      const result = await UserModel.update('user_123', updates);

      expect(result?.name).toBe('Updated Name');
      expect(result?.profileData).toEqual({ theme: 'light' });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining(['Updated Name']),
      );
    });
  });

  describe('UserSessionModel', () => {
    test('should create session with hashed refresh token', async() => {
      const mockSession = {
        id: 'session_123',
        user_id: 'user_123',
        device_id: 'device_123',
        refresh_token_hash: 'hashed_token',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const mockQuery = require('../../src/config/database.js').query;
      mockQuery.mockResolvedValue({ rows: [mockSession], rowCount: 1 });

      const result = await UserSessionModel.create('user_123', 'refresh_token', 'device_123');

      expect(result.userId).toBe('user_123');
      expect(result.deviceId).toBe('device_123');
      expect(result.refreshTokenHash).toBeDefined();
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_sessions'),
        expect.arrayContaining(['user_123', 'device_123']),
      );
    });
  });
});