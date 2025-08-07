// JWT Authentication Service with TypeScript
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { UserModel, UserSessionModel } from '../models/User.js';
import { 
  User, 
  AuthTokens, 
  JWTPayload, 
  AppleSignInRequest, 
  CreateUserRequest, 
} from '../types/auth.js';
import { config } from '../config/index.js';

export class AuthService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '30d';

  static generateTokens(user: User, sessionId: string): AuthTokens {
    const payload = {
      userId: user.id,
      email: user.email,
      sessionId,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign(
      { sessionId, userId: user.id },
      config.jwt.refreshSecret,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  static async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as unknown as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  static async verifyRefreshToken(token: string): Promise<{ sessionId: string; userId: string } | null> {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as any;
      return {
        sessionId: decoded.sessionId,
        userId: decoded.userId,
      };
    } catch (error) {
      return null;
    }
  }

  static async refreshTokens(refreshToken: string): Promise<{ user: User; tokens: AuthTokens } | null> {
    const tokenData = await this.verifyRefreshToken(refreshToken);
    if (!tokenData) {
      return null;
    }

    // O(1): Lookup session by primary key from token
    const session = await UserSessionModel.findById(tokenData.sessionId);
    if (!session) {
      return null;
    }

    // Single bcrypt compare
    const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (!isMatch) {
      return null;
    }

    // Load user
    const user = await UserModel.findById(tokenData.userId);
    if (!user) {
      return null;
    }

    // Rotate session: delete old, create new with newly issued refresh token
    const tokens = this.generateTokens(user, session.id);
    await UserSessionModel.deleteSession(session.id);
    await UserSessionModel.create(user.id, tokens.refreshToken, session.deviceId);

    return { user, tokens };
  }

  static async appleSignIn(appleData: AppleSignInRequest, deviceId?: string): Promise<{ user: User; tokens: AuthTokens } | null> {
    try {
      // In real implementation, verify Apple identity token
      // For now, we'll extract email from the request
      const email = appleData.user?.email;
      if (!email) {
        throw new Error('Email required for Apple Sign In');
      }

      // Check if user exists
      let user = await UserModel.findByEmail(email);

      if (!user) {
        // Create new user
        const fullName = appleData.user?.name 
          ? `${appleData.user.name.firstName || ''} ${appleData.user.name.lastName || ''}`.trim()
          : undefined;

        const userData: CreateUserRequest = {
          email,
          appleId: this.extractAppleIdFromToken(appleData.identityToken),
          name: fullName || undefined,
        };

        user = await UserModel.create(userData);
      }

      // Create session
      const tempRefreshToken = uuidv4();
      const session = await UserSessionModel.create(user.id, tempRefreshToken, deviceId);

      // Generate tokens
      const tokens = this.generateTokens(user, session.id);

      // Update session with actual refresh token
      await UserSessionModel.deleteSession(session.id);
      await UserSessionModel.create(user.id, tokens.refreshToken, deviceId);

      return { user, tokens };
    } catch (error) {
      // Log error to proper logging system instead of console
      return null;
    }
  }

  static async logout(sessionId: string): Promise<boolean> {
    return await UserSessionModel.deleteSession(sessionId);
  }

  static async logoutAllDevices(userId: string): Promise<number> {
    return await UserSessionModel.deleteUserSessions(userId);
  }

  private static extractAppleIdFromToken(identityToken: string): string {
    try {
      // In real implementation, decode and verify Apple JWT
      // For now, return a mock Apple ID
      const decoded = jwt.decode(identityToken) as any;
      return decoded?.sub || `apple_${Date.now()}`;
    } catch (error) {
      return `apple_${Date.now()}`;
    }
  }

  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  static generateSecureToken(length: number = 32): string {
    return uuidv4().replace(/-/g, '').substring(0, length);
  }
}