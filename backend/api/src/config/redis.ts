import { createClient, RedisClientType } from 'redis';
import { config } from './index.js';
import { logger } from './logger.js';

let client: RedisClientType | null = null;

export async function connectRedis() {
  try {
    client = createClient({
      url: config.redis.url,
      socket: {
        connectTimeout: 5000,
      },
    });

    // Handle Redis events
    client.on('error', (err: Error) => {
      logger.error('Redis connection error', { error: err.message });
    });

    client.on('connect', () => {
      logger.info('Redis client connected');
    });

    client.on('ready', () => {
      logger.info('Redis client ready');
    });

    client.on('end', () => {
      logger.info('Redis client connection ended');
    });

    // Connect to Redis
    await client.connect();
    
    // Test the connection
    const pong = await client.ping();
    if (pong !== 'PONG') {
      throw new Error('Redis ping failed');
    }

    logger.info('Redis connected successfully');
    return client;
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to connect to Redis', { 
      error: err.message,
      stack: err.stack, 
    });
    throw error;
  }
}

export function getRedis(): RedisClientType {
  if (!client) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    logger.info('Redis connection closed');
    client = null;
  }
}

// Cache helpers
export async function setCache(key: string, value: any, expiration: number = 3600): Promise<void> {
  if (!client) {
    throw new Error('Redis not connected');
  }
  
  try {
    const serializedValue = JSON.stringify(value);
    await client.setEx(key, expiration, serializedValue);
    logger.debug('Cache set', { key, expiration });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to set cache', { key, error: err.message });
    throw error;
  }
}

export async function getCache(key: string): Promise<any> {
  if (!client) {
    throw new Error('Redis not connected');
  }
  
  try {
    const value = await client.get(key);
    if (value) {
      logger.debug('Cache hit', { key });
      return JSON.parse(value);
    }
    logger.debug('Cache miss', { key });
    return null;
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to get cache', { key, error: err.message });
    return null; // Don't throw, return null on cache errors
  }
}

export async function deleteCache(key: string): Promise<void> {
  if (!client) {
    throw new Error('Redis not connected');
  }
  
  try {
    await client.del(key);
    logger.debug('Cache deleted', { key });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to delete cache', { key, error: err.message });
    // Don't throw, cache deletion failures are not critical
  }
}

export async function clearCachePattern(pattern: string): Promise<void> {
  if (!client) {
    throw new Error('Redis not connected');
  }
  
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      logger.debug('Cache pattern cleared', { pattern, keysDeleted: keys.length });
    }
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to clear cache pattern', { pattern, error: err.message });
    // Don't throw, cache deletion failures are not critical
  }
}