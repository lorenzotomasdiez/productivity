// TDD Tests for AuthService
import { AuthService } from '../../src/services/AuthService';
import { User, AppleSignInRequest } from '../../src/types/auth';
import jwt from 'jsonwebtoken';

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

describe('AuthService - TDD', () => {
  const mockUser: User = {
    id: 'user_123',
    email: 'test@example.com',
    appleId: 'apple_123',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    test('should generate valid JWT tokens', () => {
      const sessionId = 'session_123';
      const tokens = AuthService.generateTokens(mockUser, sessionId);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBe(15 * 60); // 15 minutes

      // Verify access token payload
      const decoded = jwt.decode(tokens.accessToken) as any;
      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.sessionId).toBe(sessionId);
    });

    test('should generate tokens with correct expiration', () => {
      const tokens = AuthService.generateTokens(mockUser, 'session_123');
      
      const accessDecoded = jwt.decode(tokens.accessToken) as any;
      const refreshDecoded = jwt.decode(tokens.refreshToken) as any;

      expect(accessDecoded.exp - accessDecoded.iat).toBe(15 * 60); // 15 minutes
      expect(refreshDecoded.exp - refreshDecoded.iat).toBe(30 * 24 * 60 * 60); // 30 days
    });
  });

  describe('verifyAccessToken', () => {
    test('should verify valid access token', async() => {
      const tokens = AuthService.generateTokens(mockUser, 'session_123');
      const payload = await AuthService.verifyAccessToken(tokens.accessToken);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(mockUser.id);
      expect(payload?.email).toBe(mockUser.email);
    });

    test('should return null for invalid token', async() => {
      const payload = await AuthService.verifyAccessToken('invalid_token');
      expect(payload).toBeNull();
    });

    test('should return null for expired token', async() => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: mockUser.id, exp: Math.floor(Date.now() / 1000) - 3600 },
        'test-jwt-secret',
      );

      const payload = await AuthService.verifyAccessToken(expiredToken);
      expect(payload).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    test('should verify valid refresh token', async() => {
      const refreshToken = jwt.sign(
        { sessionId: 'session_123', userId: 'user_123' },
        'test-refresh-secret',
        { expiresIn: '30d' },
      );

      const result = await AuthService.verifyRefreshToken(refreshToken);

      expect(result).toBeDefined();
      expect(result?.sessionId).toBe('session_123');
      expect(result?.userId).toBe('user_123');
    });

    test('should return null for invalid refresh token', async() => {
      const result = await AuthService.verifyRefreshToken('invalid_token');
      expect(result).toBeNull();
    });
  });

  describe('appleSignIn', () => {
    test('should create new user on first Apple Sign In', async() => {
      const appleData: AppleSignInRequest = {
        identityToken: 'mock_identity_token',
        authorizationCode: 'mock_auth_code',
        user: {
          name: { firstName: 'John', lastName: 'Doe' },
          email: 'john@example.com',
        },
      };

      const { UserModel, UserSessionModel } = require('../../src/models/User.js');
      UserModel.findByEmail.mockResolvedValue(null); // User doesn't exist
      UserModel.create.mockResolvedValue(mockUser);
      UserSessionModel.create.mockResolvedValue({
        id: 'session_123',
        userId: mockUser.id,
        deviceId: 'device_123',
        refreshTokenHash: 'hashed_token',
        expiresAt: new Date(),
        createdAt: new Date(),
      });
      UserSessionModel.deleteSession.mockResolvedValue(true);

      const result = await AuthService.appleSignIn(appleData, 'device_123');

      expect(result).toBeDefined();
      expect(result?.user.email).toBe(mockUser.email);
      expect(result?.tokens.accessToken).toBeDefined();
      expect(result?.tokens.refreshToken).toBeDefined();

      expect(UserModel.create).toHaveBeenCalledWith({
        email: 'john@example.com',
        appleId: expect.any(String),
        name: 'John Doe',
      });
    });

    test('should sign in existing user', async() => {
      const appleData: AppleSignInRequest = {
        identityToken: 'mock_identity_token',
        authorizationCode: 'mock_auth_code',
        user: {
          email: 'existing@example.com',
        },
      };

      const { UserModel, UserSessionModel } = require('../../src/models/User.js');
      UserModel.findByEmail.mockResolvedValue(mockUser); // User exists
      UserSessionModel.create.mockResolvedValue({
        id: 'session_456',
        userId: mockUser.id,
        deviceId: null,
        refreshTokenHash: 'hashed_token',
        expiresAt: new Date(),
        createdAt: new Date(),
      });
      UserSessionModel.deleteSession.mockResolvedValue(true);

      const result = await AuthService.appleSignIn(appleData);

      expect(result).toBeDefined();
      expect(result?.user).toEqual(mockUser);
      expect(UserModel.create).not.toHaveBeenCalled(); // Should not create new user
    });

    test('should return null for invalid Apple data', async() => {
      const invalidAppleData: AppleSignInRequest = {
        identityToken: 'mock_identity_token',
        authorizationCode: 'mock_auth_code',
        // Missing user email
      };

      const result = await AuthService.appleSignIn(invalidAppleData);
      expect(result).toBeNull();
    });
  });

  describe('refreshTokens', () => {
    test('should refresh tokens with valid refresh token', async() => {
      const refreshToken = 'valid_refresh_token';
      const mockSession = {
        id: 'session_123',
        userId: mockUser.id,
        deviceId: 'device_123',
        refreshTokenHash: 'hashed_token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      const { UserModel, UserSessionModel } = require('../../src/models/User.js');
      
      // Mock AuthService methods
      jest.spyOn(AuthService, 'verifyRefreshToken').mockResolvedValue({
        sessionId: 'session_123',
        userId: mockUser.id,
      });

      UserSessionModel.findValidSession.mockResolvedValue(mockSession);
      UserModel.findById.mockResolvedValue(mockUser);
      UserSessionModel.deleteSession.mockResolvedValue(true);
      UserSessionModel.create.mockResolvedValue(mockSession);

      const result = await AuthService.refreshTokens(refreshToken);

      expect(result).toBeDefined();
      expect(result?.user).toEqual(mockUser);
      expect(result?.tokens.accessToken).toBeDefined();
      expect(result?.tokens.refreshToken).toBeDefined();
    });

    test('should return null for invalid refresh token', async() => {
      jest.spyOn(AuthService, 'verifyRefreshToken').mockResolvedValue(null);

      const result = await AuthService.refreshTokens('invalid_token');
      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    test('should logout user session', async() => {
      const { UserSessionModel } = require('../../src/models/User.js');
      UserSessionModel.deleteSession.mockResolvedValue(true);

      const result = await AuthService.logout('session_123');

      expect(result).toBe(true);
      expect(UserSessionModel.deleteSession).toHaveBeenCalledWith('session_123');
    });
  });

  describe('utility methods', () => {
    test('should hash password', async() => {
      const password = 'test_password';
      const hash = await AuthService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    test('should verify password', async() => {
      const password = 'test_password';
      const hash = await AuthService.hashPassword(password);

      const isValid = await AuthService.verifyPassword(password, hash);
      const isInvalid = await AuthService.verifyPassword('wrong_password', hash);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    test('should generate secure token', () => {
      const token = AuthService.generateSecureToken();
      const customLength = AuthService.generateSecureToken(16);

      expect(token).toBeDefined();
      expect(token.length).toBe(32);
      expect(customLength.length).toBe(16);
    });
  });
});