// AuthController Unit Tests - TDD Approach
import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../src/controllers/AuthController';
import { AuthService } from '../../src/services/AuthService';
import { ValidationError, UnauthorizedError } from '../../src/middleware/errorHandler';
import { AppleSignInRequest, RefreshTokenRequest } from '../../src/types/auth';

// Mock dependencies
jest.mock('../../src/services/AuthService');
jest.mock('../../src/models/User');

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockUserModel = {
  findById: jest.fn(),
};

// Mock the dynamic import
jest.doMock('../../src/models/User.js', () => ({
  UserModel: mockUserModel,
}));

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let responseObject: any;

  beforeEach(() => {
    responseObject = {};
    mockRequest = {
      body: {},
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      }),
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('appleSignIn', () => {
    describe('Validation Tests', () => {
      it('should call next with ValidationError when identityToken is missing', async () => {
        // Given
        mockRequest.body = {
          authorizationCode: 'auth-code-123',
          user: { email: 'test@example.com' }
        } as AppleSignInRequest;

        // When
        await AuthController.appleSignIn(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Identity token and authorization code are required'
          })
        );
      });

      it('should call next with ValidationError when authorizationCode is missing', async () => {
        // Given
        mockRequest.body = {
          identityToken: 'identity-token-123',
          user: { email: 'test@example.com' }
        } as AppleSignInRequest;

        // When
        await AuthController.appleSignIn(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Identity token and authorization code are required'
          })
        );
      });

      it('should call next with ValidationError when both identityToken and authorizationCode are missing', async () => {
        // Given
        mockRequest.body = {
          user: { email: 'test@example.com' }
        } as AppleSignInRequest;

        // When
        await AuthController.appleSignIn(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Identity token and authorization code are required'
          })
        );
      });

      it('should call next with ValidationError when user email is missing', async () => {
        // Given
        mockRequest.body = {
          identityToken: 'identity-token-123',
          authorizationCode: 'auth-code-123',
          user: {}
        } as AppleSignInRequest;

        // When
        await AuthController.appleSignIn(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Email is required for Apple Sign In'
          })
        );
      });

      it('should call next with ValidationError when user is missing', async () => {
        // Given
        mockRequest.body = {
          identityToken: 'identity-token-123',
          authorizationCode: 'auth-code-123'
        } as AppleSignInRequest;

        // When
        await AuthController.appleSignIn(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Email is required for Apple Sign In'
          })
        );
      });

      it('should call next with ValidationError when user email is empty string', async () => {
        // Given
        mockRequest.body = {
          identityToken: 'identity-token-123',
          authorizationCode: 'auth-code-123',
          user: { email: '' }
        } as AppleSignInRequest;

        // When
        await AuthController.appleSignIn(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Email is required for Apple Sign In'
          })
        );
      });
    });

    describe('Device ID Extraction', () => {
      beforeEach(() => {
        mockRequest.body = {
          identityToken: 'identity-token-123',
          authorizationCode: 'auth-code-123',
          user: { email: 'test@example.com' }
        } as AppleSignInRequest;
      });

      it('should extract deviceId from x-device-id header', async () => {
        // Given
        mockRequest.headers = { 'x-device-id': 'header-device-123' };
        const mockResult = {
          user: { id: 'user-123', email: 'test@example.com' },
          tokens: { accessToken: 'access-123', refreshToken: 'refresh-123' }
        };
        mockAuthService.appleSignIn.mockResolvedValue(mockResult as any);

        // When
        await AuthController.appleSignIn(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockAuthService.appleSignIn).toHaveBeenCalledWith(mockRequest.body, 'header-device-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject.success).toBe(true);
      });

      it('should extract deviceId from body when header is not present', async () => {
        // Given
        mockRequest.body.deviceId = 'body-device-123';
        const mockResult = {
          user: { id: 'user-123', email: 'test@example.com' },
          tokens: { accessToken: 'access-123', refreshToken: 'refresh-123' }
        };
        mockAuthService.appleSignIn.mockResolvedValue(mockResult as any);

        // When
        await AuthController.appleSignIn(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockAuthService.appleSignIn).toHaveBeenCalledWith(mockRequest.body, 'body-device-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      it('should prefer header deviceId over body deviceId', async () => {
        // Given
        mockRequest.headers = { 'x-device-id': 'header-device-123' };
        mockRequest.body.deviceId = 'body-device-123';
        const mockResult = {
          user: { id: 'user-123', email: 'test@example.com' },
          tokens: { accessToken: 'access-123', refreshToken: 'refresh-123' }
        };
        mockAuthService.appleSignIn.mockResolvedValue(mockResult as any);

        // When
        await AuthController.appleSignIn(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockAuthService.appleSignIn).toHaveBeenCalledWith(mockRequest.body, 'header-device-123');
      });

      it('should pass undefined deviceId when neither header nor body contain it', async () => {
        // Given
        const mockResult = {
          user: { id: 'user-123', email: 'test@example.com' },
          tokens: { accessToken: 'access-123', refreshToken: 'refresh-123' }
        };
        mockAuthService.appleSignIn.mockResolvedValue(mockResult as any);

        // When
        await AuthController.appleSignIn(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockAuthService.appleSignIn).toHaveBeenCalledWith(mockRequest.body, undefined);
      });
    });

    describe('Service Response Handling', () => {
      beforeEach(() => {
        mockRequest.body = {
          identityToken: 'identity-token-123',
          authorizationCode: 'auth-code-123',
          user: { email: 'test@example.com' }
        } as AppleSignInRequest;
      });

      it('should call next with UnauthorizedError when AuthService returns null', async () => {
        // Given
        mockAuthService.appleSignIn.mockResolvedValue(null);

        // When
        await AuthController.appleSignIn(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Apple Sign In failed'
          })
        );
      });

      it('should return 200 with user and tokens when AuthService succeeds', async () => {
        // Given
        const mockResult = {
          user: { 
            id: 'user-123', 
            email: 'test@example.com',
            name: 'Test User',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          tokens: { 
            accessToken: 'access-token-123', 
            refreshToken: 'refresh-token-123',
            expiresIn: 900
          }
        };
        mockAuthService.appleSignIn.mockResolvedValue(mockResult as any);

        // When
        await AuthController.appleSignIn(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject).toEqual({
          success: true,
          data: {
            user: mockResult.user,
            tokens: mockResult.tokens,
          },
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockRequest.body = {
          identityToken: 'identity-token-123',
          authorizationCode: 'auth-code-123',
          user: { email: 'test@example.com' }
        } as AppleSignInRequest;
      });

      it('should call next with error when AuthService throws error', async () => {
        // Given
        const serviceError = new Error('Apple verification failed');
        mockAuthService.appleSignIn.mockRejectedValue(serviceError);

        // When
        await AuthController.appleSignIn(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(serviceError);
      });
    });
  });

  describe('refreshToken', () => {
    describe('Validation Tests', () => {
      it('should call next with ValidationError when refreshToken is missing', async () => {
        // Given
        mockRequest.body = {} as RefreshTokenRequest;

        // When
        await AuthController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Refresh token is required'
          })
        );
      });

      it('should call next with ValidationError when refreshToken is empty string', async () => {
        // Given
        mockRequest.body = { refreshToken: '' } as RefreshTokenRequest;

        // When
        await AuthController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Refresh token is required'
          })
        );
      });

      it('should call next with ValidationError when refreshToken is null', async () => {
        // Given
        mockRequest.body = { refreshToken: null } as any;

        // When
        await AuthController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Refresh token is required'
          })
        );
      });
    });

    describe('Service Response Handling', () => {
      beforeEach(() => {
        mockRequest.body = { refreshToken: 'valid-refresh-token-123' };
      });

      it('should call next with UnauthorizedError when AuthService returns null', async () => {
        // Given
        mockAuthService.refreshTokens.mockResolvedValue(null);

        // When
        await AuthController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Invalid or expired refresh token'
          })
        );
      });

      it('should return 200 with new tokens when AuthService succeeds', async () => {
        // Given
        const mockResult = {
          tokens: { 
            accessToken: 'new-access-token-123', 
            refreshToken: 'new-refresh-token-123',
            expiresIn: 900
          }
        };
        mockAuthService.refreshTokens.mockResolvedValue(mockResult as any);

        // When
        await AuthController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockAuthService.refreshTokens).toHaveBeenCalledWith('valid-refresh-token-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject).toEqual({
          success: true,
          data: {
            tokens: mockResult.tokens,
          },
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockRequest.body = { refreshToken: 'valid-refresh-token-123' };
      });

      it('should call next with error when AuthService throws error', async () => {
        // Given
        const serviceError = new Error('Token refresh failed');
        mockAuthService.refreshTokens.mockRejectedValue(serviceError);

        // When
        await AuthController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(serviceError);
      });
    });
  });

  describe('logout', () => {
    describe('Authorization Token Validation', () => {
      it('should call next with UnauthorizedError when authorization header is missing', async () => {
        // Given
        mockRequest.headers = {};

        // When
        await AuthController.logout(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Authorization token required'
          })
        );
      });

      it('should call next with UnauthorizedError when authorization header is empty', async () => {
        // Given
        mockRequest.headers = { authorization: '' };

        // When
        await AuthController.logout(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Authorization token required'
          })
        );
      });

      it('should call next with UnauthorizedError when authorization header does not contain Bearer token', async () => {
        // Given
        mockRequest.headers = { authorization: 'invalid-format' };
        mockAuthService.verifyAccessToken.mockResolvedValue(null);

        // When
        await AuthController.logout(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Invalid authorization token'
          })
        );
      });

      it('should extract token correctly from Bearer authorization header', async () => {
        // Given
        const token = 'valid-jwt-token-123';
        mockRequest.headers = { authorization: `Bearer ${token}` };
        const mockPayload = { sessionId: 'session-123', userId: 'user-123' };
        mockAuthService.verifyAccessToken.mockResolvedValue(mockPayload as any);
        mockAuthService.logout.mockResolvedValue(true);

        // When
        await AuthController.logout(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith(token);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Token Verification', () => {
      beforeEach(() => {
        mockRequest.headers = { authorization: 'Bearer valid-jwt-token-123' };
      });

      it('should call next with UnauthorizedError when token verification returns null', async () => {
        // Given
        mockAuthService.verifyAccessToken.mockResolvedValue(null);

        // When
        await AuthController.logout(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Invalid authorization token'
          })
        );
      });

      it('should proceed with logout when token verification succeeds', async () => {
        // Given
        const mockPayload = { sessionId: 'session-123', userId: 'user-123' };
        mockAuthService.verifyAccessToken.mockResolvedValue(mockPayload as any);
        mockAuthService.logout.mockResolvedValue(true);

        // When
        await AuthController.logout(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockAuthService.logout).toHaveBeenCalledWith('session-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Logout Service Response', () => {
      beforeEach(() => {
        mockRequest.headers = { authorization: 'Bearer valid-jwt-token-123' };
        const mockPayload = { sessionId: 'session-123', userId: 'user-123' };
        mockAuthService.verifyAccessToken.mockResolvedValue(mockPayload as any);
      });

      it('should call next with Error when logout service returns false', async () => {
        // Given
        mockAuthService.logout.mockResolvedValue(false);

        // When
        await AuthController.logout(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Failed to logout session'
          })
        );
      });

      it('should return 200 with success message when logout succeeds', async () => {
        // Given
        mockAuthService.logout.mockResolvedValue(true);

        // When
        await AuthController.logout(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject).toEqual({
          success: true,
          data: {
            message: 'Successfully logged out',
          },
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockRequest.headers = { authorization: 'Bearer valid-jwt-token-123' };
      });

      it('should call next with error when verifyAccessToken throws error', async () => {
        // Given
        const serviceError = new Error('Token verification failed');
        mockAuthService.verifyAccessToken.mockRejectedValue(serviceError);

        // When
        await AuthController.logout(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(serviceError);
      });

      it('should call next with error when logout service throws error', async () => {
        // Given
        const mockPayload = { sessionId: 'session-123', userId: 'user-123' };
        mockAuthService.verifyAccessToken.mockResolvedValue(mockPayload as any);
        const serviceError = new Error('Database error during logout');
        mockAuthService.logout.mockRejectedValue(serviceError);

        // When
        await AuthController.logout(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(serviceError);
      });
    });
  });

  describe('logoutAllDevices', () => {
    describe('Authorization Token Validation', () => {
      it('should call next with UnauthorizedError when authorization header is missing', async () => {
        // Given
        mockRequest.headers = {};

        // When
        await AuthController.logoutAllDevices(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Authorization token required'
          })
        );
      });

      it('should extract token correctly from Bearer authorization header', async () => {
        // Given
        const token = 'valid-jwt-token-123';
        mockRequest.headers = { authorization: `Bearer ${token}` };
        const mockPayload = { sessionId: 'session-123', userId: 'user-123' };
        mockAuthService.verifyAccessToken.mockResolvedValue(mockPayload as any);
        mockAuthService.logoutAllDevices.mockResolvedValue(3);

        // When
        await AuthController.logoutAllDevices(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith(token);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Token Verification', () => {
      beforeEach(() => {
        mockRequest.headers = { authorization: 'Bearer valid-jwt-token-123' };
      });

      it('should call next with UnauthorizedError when token verification returns null', async () => {
        // Given
        mockAuthService.verifyAccessToken.mockResolvedValue(null);

        // When
        await AuthController.logoutAllDevices(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Invalid authorization token'
          })
        );
      });

      it('should proceed with logout all devices when token verification succeeds', async () => {
        // Given
        const mockPayload = { sessionId: 'session-123', userId: 'user-123' };
        mockAuthService.verifyAccessToken.mockResolvedValue(mockPayload as any);
        mockAuthService.logoutAllDevices.mockResolvedValue(5);

        // When
        await AuthController.logoutAllDevices(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockAuthService.logoutAllDevices).toHaveBeenCalledWith('user-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject).toEqual({
          success: true,
          data: {
            message: 'Successfully logged out from 5 devices',
            devicesLoggedOut: 5,
          },
        });
      });

      it('should handle zero devices logged out', async () => {
        // Given
        const mockPayload = { sessionId: 'session-123', userId: 'user-123' };
        mockAuthService.verifyAccessToken.mockResolvedValue(mockPayload as any);
        mockAuthService.logoutAllDevices.mockResolvedValue(0);

        // When
        await AuthController.logoutAllDevices(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject).toEqual({
          success: true,
          data: {
            message: 'Successfully logged out from 0 devices',
            devicesLoggedOut: 0,
          },
        });
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockRequest.headers = { authorization: 'Bearer valid-jwt-token-123' };
      });

      it('should call next with error when verifyAccessToken throws error', async () => {
        // Given
        const serviceError = new Error('Token verification failed');
        mockAuthService.verifyAccessToken.mockRejectedValue(serviceError);

        // When
        await AuthController.logoutAllDevices(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(serviceError);
      });

      it('should call next with error when logoutAllDevices service throws error', async () => {
        // Given
        const mockPayload = { sessionId: 'session-123', userId: 'user-123' };
        mockAuthService.verifyAccessToken.mockResolvedValue(mockPayload as any);
        const serviceError = new Error('Database error during logout all');
        mockAuthService.logoutAllDevices.mockRejectedValue(serviceError);

        // When
        await AuthController.logoutAllDevices(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(serviceError);
      });
    });
  });

  describe('getProfile', () => {
    describe('Authorization Token Validation', () => {
      it('should call next with UnauthorizedError when authorization header is missing', async () => {
        // Given
        mockRequest.headers = {};

        // When
        await AuthController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Authorization token required'
          })
        );
      });

      it('should extract token correctly from Bearer authorization header', async () => {
        // Given
        const token = 'valid-jwt-token-123';
        mockRequest.headers = { authorization: `Bearer ${token}` };
        const mockPayload = { sessionId: 'session-123', userId: 'user-123' };
        const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
        mockAuthService.verifyAccessToken.mockResolvedValue(mockPayload as any);
        mockUserModel.findById.mockResolvedValue(mockUser);

        // When
        await AuthController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith(token);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Token Verification', () => {
      beforeEach(() => {
        mockRequest.headers = { authorization: 'Bearer valid-jwt-token-123' };
      });

      it('should call next with UnauthorizedError when token verification returns null', async () => {
        // Given
        mockAuthService.verifyAccessToken.mockResolvedValue(null);

        // When
        await AuthController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Invalid authorization token'
          })
        );
      });

      it('should proceed with user lookup when token verification succeeds', async () => {
        // Given
        const mockPayload = { sessionId: 'session-123', userId: 'user-123' };
        const mockUser = { 
          id: 'user-123', 
          email: 'test@example.com', 
          name: 'Test User',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockAuthService.verifyAccessToken.mockResolvedValue(mockPayload as any);
        mockUserModel.findById.mockResolvedValue(mockUser);

        // When
        await AuthController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockUserModel.findById).toHaveBeenCalledWith('user-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject).toEqual({
          success: true,
          data: {
            user: mockUser,
          },
        });
      });
    });

    describe('User Lookup', () => {
      beforeEach(() => {
        mockRequest.headers = { authorization: 'Bearer valid-jwt-token-123' };
        const mockPayload = { sessionId: 'session-123', userId: 'user-123' };
        mockAuthService.verifyAccessToken.mockResolvedValue(mockPayload as any);
      });

      it('should call next with Error when user is not found', async () => {
        // Given
        mockUserModel.findById.mockResolvedValue(null);

        // When
        await AuthController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'User not found'
          })
        );
      });

      it('should return 200 with user data when user is found', async () => {
        // Given
        const mockUser = { 
          id: 'user-123', 
          email: 'test@example.com', 
          name: 'Test User',
          profileData: { theme: 'dark' },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockUserModel.findById.mockResolvedValue(mockUser);

        // When
        await AuthController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject).toEqual({
          success: true,
          data: {
            user: mockUser,
          },
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockRequest.headers = { authorization: 'Bearer valid-jwt-token-123' };
      });

      it('should call next with error when verifyAccessToken throws error', async () => {
        // Given
        const serviceError = new Error('Token verification failed');
        mockAuthService.verifyAccessToken.mockRejectedValue(serviceError);

        // When
        await AuthController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(serviceError);
      });

      it('should call next with error when UserModel.findById throws error', async () => {
        // Given
        const mockPayload = { sessionId: 'session-123', userId: 'user-123' };
        mockAuthService.verifyAccessToken.mockResolvedValue(mockPayload as any);
        const serviceError = new Error('Database error during user lookup');
        mockUserModel.findById.mockRejectedValue(serviceError);

        // When
        await AuthController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

        // Then
        expect(mockNext).toHaveBeenCalledWith(serviceError);
      });
    });
  });
});