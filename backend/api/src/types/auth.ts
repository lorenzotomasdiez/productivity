// Authentication TypeScript interfaces and types

export interface User {
  id: string;
  email: string;
  appleId?: string;
  name?: string;
  profileData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  appleId?: string | undefined;
  name?: string | undefined;
  profileData?: Record<string, any> | undefined;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceId?: string;
  refreshTokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AppleSignInRequest {
  identityToken: string;
  authorizationCode: string;
  user?: {
    name?: {
      firstName?: string;
      lastName?: string;
    };
    email?: string;
  };
}

export interface AppleSignInResponse {
  success: true;
  data: {
    user: User;
    tokens: AuthTokens;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: true;
  data: {
    tokens: AuthTokens;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export interface AuthError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId?: string;
  };
}