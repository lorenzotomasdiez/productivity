import { jest } from '@jest/globals';
import { createClient, RedisClientType } from 'redis';
import { connectRedis, getRedis, closeRedis, setCache, getCache, deleteCache, clearCachePattern } from '../../src/config/redis.js';
import { logger } from '../../src/config/logger.js';

// Mock redis module
jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

// Mock logger
jest.mock('../../src/config/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock config
jest.mock('../../src/config/index.js', () => ({
  config: {
    redis: {
      url: 'redis://localhost:6379',
    },
  },
}));

describe('Redis Configuration', () => {
  let mockRedisClient: any;
  let mockConnect: any;
  let mockQuit: any;
  let mockPing: any;
  let mockSetEx: any;
  let mockGet: any;
  let mockDel: any;
  let mockKeys: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock Redis client
    mockConnect = jest.fn();
    mockQuit = jest.fn();
    mockPing = jest.fn();
    mockSetEx = jest.fn();
    mockGet = jest.fn();
    mockDel = jest.fn();
    mockKeys = jest.fn();

    mockRedisClient = {
      connect: mockConnect,
      quit: mockQuit,
      ping: mockPing,
      setEx: mockSetEx,
      get: mockGet,
      del: mockDel,
      keys: mockKeys,
      on: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockRedisClient);
  });

  describe('connectRedis', () => {
    it('should connect to Redis successfully', async () => {
      mockConnect.mockResolvedValue(undefined);
      mockPing.mockResolvedValue('PONG');

      const result = await connectRedis();

      expect(createClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
        },
      });
      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(mockConnect).toHaveBeenCalled();
      expect(mockPing).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Redis connected successfully');
      expect(result).toBe(mockRedisClient);
    });

    it('should handle Redis ping failure', async () => {
      mockConnect.mockResolvedValue(undefined);
      mockPing.mockResolvedValue('FAIL');

      await expect(connectRedis()).rejects.toThrow('Redis ping failed');
      expect(logger.error).toHaveBeenCalledWith('Failed to connect to Redis', expect.any(Object));
    });

    it('should handle connection errors', async () => {
      const connectionError = new Error('Connection failed');
      mockConnect.mockRejectedValue(connectionError);

      await expect(connectRedis()).rejects.toThrow('Connection failed');
      expect(logger.error).toHaveBeenCalledWith('Failed to connect to Redis', {
        error: 'Connection failed',
        stack: connectionError.stack,
      });
    });

    it('should handle Redis client events', async () => {
      mockConnect.mockResolvedValue(undefined);
      mockPing.mockResolvedValue('PONG');

      await connectRedis();

      // Get the event handlers
      const errorHandler = mockRedisClient.on.mock.calls.find((call: any) => call[0] === 'error')?.[1];
      const connectHandler = mockRedisClient.on.mock.calls.find((call: any) => call[0] === 'connect')?.[1];
      const readyHandler = mockRedisClient.on.mock.calls.find((call: any) => call[0] === 'ready')?.[1];
      const endHandler = mockRedisClient.on.mock.calls.find((call: any) => call[0] === 'end')?.[1];

      // Test error handler
      if (errorHandler) {
        const error = new Error('Redis error');
        errorHandler(error);
        expect(logger.error).toHaveBeenCalledWith('Redis connection error', { error: 'Redis error' });
      }

      // Test connect handler
      if (connectHandler) {
        connectHandler();
        expect(logger.info).toHaveBeenCalledWith('Redis client connected');
      }

      // Test ready handler
      if (readyHandler) {
        readyHandler();
        expect(logger.info).toHaveBeenCalledWith('Redis client ready');
      }

      // Test end handler
      if (endHandler) {
        endHandler();
        expect(logger.info).toHaveBeenCalledWith('Redis client connection ended');
      }
    });
  });

  describe('getRedis', () => {
    it('should return Redis client when connected', async () => {
      mockConnect.mockResolvedValue(undefined);
      mockPing.mockResolvedValue('PONG');
      await connectRedis();

      const client = getRedis();
      expect(client).toBe(mockRedisClient);
    });

    it('should throw error when Redis not connected', async () => {
      // Reset modules to get a clean state where client is null
      jest.resetModules();
      const { getRedis: getRedisFresh } = await import('../../src/config/redis.js');
      
      expect(() => getRedisFresh()).toThrow('Redis not connected. Call connectRedis() first.');
    });
  });

  describe('closeRedis', () => {
    it('should close Redis connection successfully', async () => {
      mockConnect.mockResolvedValue(undefined);
      mockPing.mockResolvedValue('PONG');
      mockQuit.mockResolvedValue(undefined);
      await connectRedis();

      await closeRedis();

      expect(mockQuit).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Redis connection closed');
    });

    it('should handle close when not connected', async () => {
      await closeRedis();
      expect(mockQuit).not.toHaveBeenCalled();
    });
  });

  describe('Cache Operations', () => {
    beforeEach(async () => {
      mockConnect.mockResolvedValue(undefined);
      mockPing.mockResolvedValue('PONG');
      await connectRedis();
    });

    describe('setCache', () => {
      it('should set cache successfully', async () => {
        mockSetEx.mockResolvedValue('OK');
        const testData = { test: 'data' };

        await setCache('test-key', testData, 7200);

        expect(mockSetEx).toHaveBeenCalledWith('test-key', 7200, JSON.stringify(testData));
        expect(logger.debug).toHaveBeenCalledWith('Cache set', { key: 'test-key', expiration: 7200 });
      });

      it('should use default expiration when not provided', async () => {
        mockSetEx.mockResolvedValue('OK');
        const testData = { test: 'data' };

        await setCache('test-key', testData);

        expect(mockSetEx).toHaveBeenCalledWith('test-key', 3600, JSON.stringify(testData));
      });

      it('should handle Redis errors gracefully', async () => {
        const redisError = new Error('Redis set failed');
        mockSetEx.mockRejectedValue(redisError);

        await expect(setCache('test-key', 'test-value')).rejects.toThrow('Redis set failed');
        expect(logger.error).toHaveBeenCalledWith('Failed to set cache', { 
          key: 'test-key', 
          error: 'Redis set failed' 
        });
      });

      it('should throw error when Redis not connected', async () => {
        // Reset the client to simulate disconnected state
        jest.resetModules();
        const { setCache: setCacheDisconnected } = await import('../../src/config/redis.js');

        await expect(setCacheDisconnected('test-key', 'test-value')).rejects.toThrow('Redis not connected');
      });
    });

    describe('getCache', () => {
      it('should get cache successfully', async () => {
        const cachedValue = JSON.stringify({ test: 'data' });
        mockGet.mockResolvedValue(cachedValue);

        const result = await getCache('test-key');

        expect(mockGet).toHaveBeenCalledWith('test-key');
        expect(result).toEqual({ test: 'data' });
        expect(logger.debug).toHaveBeenCalledWith('Cache hit', { key: 'test-key' });
      });

      it('should return null for cache miss', async () => {
        mockGet.mockResolvedValue(null);

        const result = await getCache('test-key');

        expect(result).toBeNull();
        expect(logger.debug).toHaveBeenCalledWith('Cache miss', { key: 'test-key' });
      });

      it('should handle Redis errors gracefully', async () => {
        const redisError = new Error('Redis get failed');
        mockGet.mockRejectedValue(redisError);

        const result = await getCache('test-key');

        expect(result).toBeNull();
        expect(logger.error).toHaveBeenCalledWith('Failed to get cache', { 
          key: 'test-key', 
          error: 'Redis get failed' 
        });
      });

      it('should handle invalid JSON gracefully', async () => {
        mockGet.mockResolvedValue('invalid-json');

        const result = await getCache('test-key');

        expect(result).toBeNull();
        expect(logger.error).toHaveBeenCalledWith('Failed to get cache', expect.any(Object));
      });
    });

    describe('deleteCache', () => {
      it('should delete cache successfully', async () => {
        mockDel.mockResolvedValue(1);

        await deleteCache('test-key');

        expect(mockDel).toHaveBeenCalledWith('test-key');
        expect(logger.debug).toHaveBeenCalledWith('Cache deleted', { key: 'test-key' });
      });

      it('should handle Redis errors gracefully', async () => {
        const redisError = new Error('Redis delete failed');
        mockDel.mockRejectedValue(redisError);

        // Should not throw
        await expect(deleteCache('test-key')).resolves.toBeUndefined();
        expect(logger.error).toHaveBeenCalledWith('Failed to delete cache', { 
          key: 'test-key', 
          error: 'Redis delete failed' 
        });
      });
    });

    describe('clearCachePattern', () => {
      it('should clear cache pattern successfully', async () => {
        const keys = ['user:1', 'user:2', 'user:3'];
        mockKeys.mockResolvedValue(keys);
        mockDel.mockResolvedValue(3);

        await clearCachePattern('user:*');

        expect(mockKeys).toHaveBeenCalledWith('user:*');
        expect(mockDel).toHaveBeenCalledWith(keys);
        expect(logger.debug).toHaveBeenCalledWith('Cache pattern cleared', { 
          pattern: 'user:*', 
          keysDeleted: 3 
        });
      });

      it('should handle empty pattern result', async () => {
        mockKeys.mockResolvedValue([]);

        await clearCachePattern('nonexistent:*');

        expect(mockKeys).toHaveBeenCalledWith('nonexistent:*');
        expect(mockDel).not.toHaveBeenCalled();
      });

      it('should handle Redis errors gracefully', async () => {
        const redisError = new Error('Redis keys failed');
        mockKeys.mockRejectedValue(redisError);

        // Should not throw
        await expect(clearCachePattern('user:*')).resolves.toBeUndefined();
        expect(logger.error).toHaveBeenCalledWith('Failed to clear cache pattern', { 
          pattern: 'user:*', 
          error: 'Redis keys failed' 
        });
      });
    });
  });
});
