// Tests to enforce O(1) refresh token verification and rotation semantics
import { AuthService } from '../../src/services/AuthService';

jest.mock('../../src/config/index.js', () => ({
  config: {
    jwt: { secret: 'test-jwt', refreshSecret: 'test-refresh' },
  },
}));

jest.mock('../../src/models/User.js', () => ({
  UserModel: {
    findById: jest.fn(),
  },
  UserSessionModel: {
    create: jest.fn(),
    deleteSession: jest.fn(),
    // We will assert that findValidSession is NOT used for O(1) design
    findValidSession: jest.fn(),
    findById: jest.fn(),
  },
}));

describe('AuthService.refreshTokens O(1) verification/rotation', () => {
  const jwt = require('jsonwebtoken');
  const { UserModel, UserSessionModel } = require('../../src/models/User.js');

  const user = { id: 'u1', email: 'u1@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('decodes refresh -> extracts sessionId -> looks up by PK -> bcrypt compare once -> rotates', async () => {
    const session = { id: 's1', userId: 'u1', deviceId: 'd1' };
    // Build a refresh token embedding the sessionId and userId
    const refreshToken = jwt.sign({ sessionId: session.id, userId: user.id }, 'test-refresh', { expiresIn: '30d' });

    // Spy: force AuthService.verifyRefreshToken to exercise code path
    // We expect implementation to: decode token -> find session by ID (PK) -> bcrypt compare -> rotate
    UserModel.findById.mockResolvedValue(user);
    // We cannot really bcrypt-compare here; we will expect the method under test to call
    // UserSessionModel.deleteSession and UserSessionModel.create once each as evidence of rotation.

    // Mock store lookups
    UserSessionModel.findById.mockResolvedValue({
      id: session.id,
      userId: session.userId,
      deviceId: session.deviceId,
      refreshTokenHash: '$2a$12$fakehash',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      createdAt: new Date(),
    });
    UserModel.findById.mockResolvedValue(user);

    // Stub bcrypt.compare to succeed
    jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true as any);

    // Execute
    const result = await AuthService.refreshTokens(refreshToken);

    // Expectations
    expect(result?.tokens.accessToken).toBeDefined();
    expect(result?.tokens.refreshToken).toBeDefined();

    // Ensure no full-table scan helper is used
    expect(UserSessionModel.findValidSession).not.toHaveBeenCalled();

    // Ensure rotation occurred
    expect(UserSessionModel.deleteSession).toHaveBeenCalledTimes(1);
    expect(UserSessionModel.create).toHaveBeenCalledTimes(1);
  });
});


