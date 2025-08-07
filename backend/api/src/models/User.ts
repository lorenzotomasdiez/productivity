// User Model with TypeScript and Database Integration
import { query } from '../config/database.js';
import { User, CreateUserRequest, UserSession } from '../types/auth.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export class UserModel {
  static async create(userData: CreateUserRequest): Promise<User> {
    const userId = uuidv4();
    const now = new Date();

    const queryText = `
      INSERT INTO users (id, email, apple_id, name, profile_data, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      userId,
      userData.email,
      userData.appleId || null,
      userData.name || null,
      userData.profileData ? JSON.stringify(userData.profileData) : null,
      now,
      now,
    ];

    const result = await query(queryText, values);
    const row = result.rows[0];

    return {
      id: row.id,
      email: row.email,
      appleId: row.apple_id,
      name: row.name,
      profileData: row.profile_data ? JSON.parse(row.profile_data) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  static async findByEmail(email: string): Promise<User | null> {
    const queryText = 'SELECT * FROM users WHERE email = $1';
    const result = await query(queryText, [email]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      appleId: row.apple_id,
      name: row.name,
      profileData: row.profile_data ? JSON.parse(row.profile_data) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  static async findById(id: string): Promise<User | null> {
    const queryText = 'SELECT * FROM users WHERE id = $1';
    const result = await query(queryText, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      appleId: row.apple_id,
      name: row.name,
      profileData: row.profile_data ? JSON.parse(row.profile_data) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  static async findByAppleId(appleId: string): Promise<User | null> {
    const queryText = 'SELECT * FROM users WHERE apple_id = $1';
    const result = await query(queryText, [appleId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      appleId: row.apple_id,
      name: row.name,
      profileData: row.profile_data ? JSON.parse(row.profile_data) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  static async update(id: string, updates: Partial<CreateUserRequest>): Promise<User | null> {
    const now = new Date();
    const setClause: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    if (updates.email !== undefined) {
      setClause.push(`email = $${valueIndex++}`);
      values.push(updates.email);
    }

    if (updates.appleId !== undefined) {
      setClause.push(`apple_id = $${valueIndex++}`);
      values.push(updates.appleId);
    }

    if (updates.name !== undefined) {
      setClause.push(`name = $${valueIndex++}`);
      values.push(updates.name);
    }

    if (updates.profileData !== undefined) {
      setClause.push(`profile_data = $${valueIndex++}`);
      values.push(updates.profileData ? JSON.stringify(updates.profileData) : null);
    }

    if (setClause.length === 0) {
      return this.findById(id);
    }

    setClause.push(`updated_at = $${valueIndex++}`);
    values.push(now);
    values.push(id);

    const queryText = `
      UPDATE users 
      SET ${setClause.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    const result = await query(queryText, values);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      appleId: row.apple_id,
      name: row.name,
      profileData: row.profile_data ? JSON.parse(row.profile_data) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  static async delete(id: string): Promise<boolean> {
    const queryText = 'DELETE FROM users WHERE id = $1';
    const result = await query(queryText, [id]);
    return (result.rowCount || 0) > 0;
  }
}

export class UserSessionModel {
  static async create(userId: string, refreshToken: string, deviceId?: string): Promise<UserSession> {
    const sessionId = uuidv4();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const queryText = `
      INSERT INTO user_sessions (id, user_id, device_id, refresh_token_hash, expires_at, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [sessionId, userId, deviceId || null, refreshTokenHash, expiresAt, now];
    const result = await query(queryText, values);
    const row = result.rows[0];

    return {
      id: row.id,
      userId: row.user_id,
      deviceId: row.device_id,
      refreshTokenHash: row.refresh_token_hash,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
    };
  }

  static async findValidSession(refreshToken: string): Promise<UserSession | null> {
    // Deprecated path kept for backward-compat tests; prefer findById + compare
    const queryText = `
      SELECT * FROM user_sessions 
      WHERE expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await query(queryText);
    const row = result.rows[0];
    if (!row) return null;
    const isValid = await bcrypt.compare(refreshToken, row.refresh_token_hash);
    return isValid
      ? {
        id: row.id,
        userId: row.user_id,
        deviceId: row.device_id,
        refreshTokenHash: row.refresh_token_hash,
        expiresAt: new Date(row.expires_at),
        createdAt: new Date(row.created_at),
      }
      : null;
  }

  static async findById(sessionId: string): Promise<UserSession | null> {
    const result = await query('SELECT * FROM user_sessions WHERE id = $1 AND expires_at > NOW()', [sessionId]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      deviceId: row.device_id,
      refreshTokenHash: row.refresh_token_hash,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
    };
  }

  static async deleteSession(sessionId: string): Promise<boolean> {
    const queryText = 'DELETE FROM user_sessions WHERE id = $1';
    const result = await query(queryText, [sessionId]);
    return (result.rowCount || 0) > 0;
  }

  static async deleteUserSessions(userId: string): Promise<number> {
    const queryText = 'DELETE FROM user_sessions WHERE user_id = $1';
    const result = await query(queryText, [userId]);
    return result.rowCount || 0;
  }

  static async cleanupExpiredSessions(): Promise<number> {
    const queryText = 'DELETE FROM user_sessions WHERE expires_at <= NOW()';
    const result = await query(queryText);
    return result.rowCount || 0;
  }
}