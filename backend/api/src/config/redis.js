import { createClient } from 'redis';
import { config } from './index.js';
import { logger } from './logger.js';

let client = null;

export async function connectRedis() {
  try {
    client = createClient({
      url: config.redis.url,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
      },
    });

    // Handle Redis events
    client.on('error', (err) => {
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
    logger.error('Failed to connect to Redis', { 
      error: error.message,
      stack: error.stack 
    });
    throw error;
  }
}

export function getRedis() {
  if (!client) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return client;
}

export async function closeRedis() {
  if (client) {
    await client.quit();
    logger.info('Redis connection closed');
    client = null;
  }
}

// Cache helpers
export async function setCache(key, value, expiration = 3600) {
  try {
    const serializedValue = JSON.stringify(value);
    await client.setEx(key, expiration, serializedValue);
    logger.debug('Cache set', { key, expiration });
  } catch (error) {
    logger.error('Failed to set cache', { key, error: error.message });
    throw error;
  }
}

export async function getCache(key) {
  try {
    const value = await client.get(key);
    if (value) {
      logger.debug('Cache hit', { key });
      return JSON.parse(value);
    }
    logger.debug('Cache miss', { key });
    return null;
  } catch (error) {
    logger.error('Failed to get cache', { key, error: error.message });
    return null; // Don't throw, return null on cache errors
  }
}

export async function deleteCache(key) {
  try {
    await client.del(key);
    logger.debug('Cache deleted', { key });
  } catch (error) {
    logger.error('Failed to delete cache', { key, error: error.message });
    // Don't throw, cache deletion failures are not critical
  }
}

export async function clearCachePattern(pattern) {
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      logger.debug('Cache pattern cleared', { pattern, keysDeleted: keys.length });
    }
  } catch (error) {
    logger.error('Failed to clear cache pattern', { pattern, error: error.message });
    // Don't throw, cache deletion failures are not critical
  }
}