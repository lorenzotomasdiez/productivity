// Authentication Controller with TypeScript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService.js';
import { 
  AppleSignInRequest, 
  AppleSignInResponse, 
  RefreshTokenRequest, 
  RefreshTokenResponse,
} from '../types/auth.js';
import { ValidationError, UnauthorizedError } from '../middleware/errorHandler.js';

export class AuthController {
  static async appleSignIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appleData: AppleSignInRequest = req.body;
      
      // Validate required fields
      if (!appleData.identityToken || !appleData.authorizationCode) {
        throw new ValidationError('Identity token and authorization code are required');
      }

      if (!appleData.user?.email) {
        throw new ValidationError('Email is required for Apple Sign In');
      }

      // Extract device ID from headers or body
      const deviceId = req.headers['x-device-id'] as string || req.body.deviceId;

      // Perform Apple Sign In
      const result = await AuthService.appleSignIn(appleData, deviceId);

      if (!result) {
        throw new UnauthorizedError('Apple Sign In failed');
      }

      const response: AppleSignInResponse = {
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken }: RefreshTokenRequest = req.body;

      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      const result = await AuthService.refreshTokens(refreshToken);

      if (!result) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      const response: RefreshTokenResponse = {
        success: true,
        data: {
          tokens: result.tokens,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get session ID from JWT token
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        throw new UnauthorizedError('Authorization token required');
      }

      const payload = await AuthService.verifyAccessToken(token);
      
      if (!payload) {
        throw new UnauthorizedError('Invalid authorization token');
      }

      // Logout the session
      const success = await AuthService.logout(payload.sessionId);

      if (!success) {
        throw new Error('Failed to logout session');
      }

      res.status(200).json({
        success: true,
        data: {
          message: 'Successfully logged out',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logoutAllDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get user ID from JWT token
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        throw new UnauthorizedError('Authorization token required');
      }

      const payload = await AuthService.verifyAccessToken(token);
      
      if (!payload) {
        throw new UnauthorizedError('Invalid authorization token');
      }

      // Logout all user sessions
      const loggedOutCount = await AuthService.logoutAllDevices(payload.userId);

      res.status(200).json({
        success: true,
        data: {
          message: `Successfully logged out from ${loggedOutCount} devices`,
          devicesLoggedOut: loggedOutCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get user ID from JWT token
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        throw new UnauthorizedError('Authorization token required');
      }

      const payload = await AuthService.verifyAccessToken(token);
      
      if (!payload) {
        throw new UnauthorizedError('Invalid authorization token');
      }

      // Get user from database
      const { UserModel } = await import('../models/User.js');
      const user = await UserModel.findById(payload.userId);

      if (!user) {
        throw new Error('User not found');
      }

      res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}