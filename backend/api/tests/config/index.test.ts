import { config } from '../../src/config/index.js';

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    
    // Set test environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Environment Variables', () => {
    test('should use development as default environment', () => {
      delete process.env.NODE_ENV;
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.env).toBe('development');
    });

    test('should use custom environment', () => {
      process.env.NODE_ENV = 'staging';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.env).toBe('staging');
    });
  });

  describe('Port Configuration', () => {
    test('should use default port when not specified', () => {
      delete process.env.PORT;
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.port).toBe(3000);
    });

    test('should use custom port from environment', () => {
      process.env.PORT = '8080';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.port).toBe(8080);
    });

    test('should handle invalid port gracefully', () => {
      process.env.PORT = 'invalid';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.port).toBe(3000); // Should fall back to default
    });
  });

  describe('Database Configuration', () => {
    test('should use test database URL in test environment', () => {
      process.env.TEST_DATABASE_URL = 'postgresql://test:test@localhost:5432/test_test';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.database.testUrl).toBe('postgresql://test:test@localhost:5432/test_test');
    });

    test('should use default pool configuration', () => {
      delete process.env.DB_POOL_MIN;
      delete process.env.DB_POOL_MAX;
      delete process.env.DB_POOL_IDLE;
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.database.pool.min).toBe(2);
      expect(freshConfig.database.pool.max).toBe(20);
      expect(freshConfig.database.pool.idle).toBe(10000);
    });

    test('should use custom pool configuration', () => {
      process.env.DB_POOL_MIN = '5';
      process.env.DB_POOL_MAX = '50';
      process.env.DB_POOL_IDLE = '30000';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.database.pool.min).toBe(5);
      expect(freshConfig.database.pool.max).toBe(50);
      expect(freshConfig.database.pool.idle).toBe(30000);
    });

    test('should handle invalid pool configuration gracefully', () => {
      process.env.DB_POOL_MIN = 'invalid';
      process.env.DB_POOL_MAX = 'invalid';
      process.env.DB_POOL_IDLE = 'invalid';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.database.pool.min).toBe(2);
      expect(freshConfig.database.pool.max).toBe(20);
      expect(freshConfig.database.pool.idle).toBe(10000);
    });
  });

  describe('Redis Configuration', () => {
    test('should use default Redis URL when not specified', () => {
      delete process.env.REDIS_URL;
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.redis.url).toBe('redis://localhost:6379');
    });

    test('should use custom Redis URL', () => {
      process.env.REDIS_URL = 'redis://redis.example.com:6380';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.redis.url).toBe('redis://redis.example.com:6380');
    });
  });

  describe('JWT Configuration', () => {
    test('should use default JWT expiry times', () => {
      delete process.env.JWT_EXPIRY;
      delete process.env.JWT_REFRESH_EXPIRY;
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.jwt.expiry).toBe('15m');
      expect(freshConfig.jwt.refreshExpiry).toBe('30d');
    });

    test('should use custom JWT expiry times', () => {
      process.env.JWT_EXPIRY = '1h';
      process.env.JWT_REFRESH_EXPIRY = '7d';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.jwt.expiry).toBe('1h');
      expect(freshConfig.jwt.refreshExpiry).toBe('7d');
    });
  });

  describe('Apple Sign In Configuration', () => {
    test('should include Apple configuration when environment variables are set', () => {
      process.env.APPLE_TEAM_ID = 'TEAM123';
      process.env.APPLE_KEY_ID = 'KEY456';
      process.env.APPLE_PRIVATE_KEY_PATH = '/path/to/key.p8';
      process.env.APPLE_CLIENT_ID = 'com.example.app';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.apple.teamId).toBe('TEAM123');
      expect(freshConfig.apple.keyId).toBe('KEY456');
      expect(freshConfig.apple.privateKeyPath).toBe('/path/to/key.p8');
      expect(freshConfig.apple.clientId).toBe('com.example.app');
    });

    test('should handle missing Apple configuration', () => {
      delete process.env.APPLE_TEAM_ID;
      delete process.env.APPLE_KEY_ID;
      delete process.env.APPLE_PRIVATE_KEY_PATH;
      delete process.env.APPLE_CLIENT_ID;
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.apple.teamId).toBeUndefined();
      expect(freshConfig.apple.keyId).toBeUndefined();
      expect(freshConfig.apple.privateKeyPath).toBeUndefined();
      expect(freshConfig.apple.clientId).toBeUndefined();
    });
  });

  describe('AI Service Configuration', () => {
    test('should use default AI service URL when not specified', () => {
      delete process.env.AI_SERVICE_URL;
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.ai.serviceUrl).toBe('http://localhost:8000');
    });

    test('should use custom AI service URL', () => {
      process.env.AI_SERVICE_URL = 'https://ai.example.com';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.ai.serviceUrl).toBe('https://ai.example.com');
    });

    test('should include API keys when set', () => {
      process.env.OPENAI_API_KEY = 'sk-openai-key';
      process.env.ANTHROPIC_API_KEY = 'sk-anthropic-key';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.ai.openaiApiKey).toBe('sk-openai-key');
      expect(freshConfig.ai.anthropicApiKey).toBe('sk-anthropic-key');
    });
  });

  describe('Research Engine Configuration', () => {
    test('should use default research service URL when not specified', () => {
      delete process.env.RESEARCH_ENGINE_URL;
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.research.serviceUrl).toBe('http://localhost:3001');
    });

    test('should use custom research service URL', () => {
      process.env.RESEARCH_ENGINE_URL = 'https://research.example.com';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.research.serviceUrl).toBe('https://research.example.com');
    });
  });

  describe('Rate Limiting Configuration', () => {
    test('should use default rate limiting configuration', () => {
      delete process.env.RATE_LIMIT_WINDOW_MS;
      delete process.env.RATE_LIMIT_MAX_REQUESTS;
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.rateLimit.windowMs).toBe(15 * 60 * 1000); // 15 minutes
      expect(freshConfig.rateLimit.maxRequests).toBe(100);
    });

    test('should use custom rate limiting configuration', () => {
      process.env.RATE_LIMIT_WINDOW_MS = '300000'; // 5 minutes
      process.env.RATE_LIMIT_MAX_REQUESTS = '200';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.rateLimit.windowMs).toBe(300000);
      expect(freshConfig.rateLimit.maxRequests).toBe(200);
    });

    test('should handle invalid rate limiting configuration gracefully', () => {
      process.env.RATE_LIMIT_WINDOW_MS = 'invalid';
      process.env.RATE_LIMIT_MAX_REQUESTS = 'invalid';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.rateLimit.windowMs).toBe(15 * 60 * 1000);
      expect(freshConfig.rateLimit.maxRequests).toBe(100);
    });
  });

  describe('CORS Configuration', () => {
    test('should use default CORS origin when not specified', () => {
      delete process.env.CORS_ORIGIN;
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.cors.origin).toEqual(['http://localhost:3000']);
    });

    test('should use custom CORS origin', () => {
      process.env.CORS_ORIGIN = 'https://example.com,https://app.example.com';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.cors.origin).toEqual(['https://example.com', 'https://app.example.com']);
    });

    test('should handle single CORS origin', () => {
      process.env.CORS_ORIGIN = 'https://example.com';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.cors.origin).toEqual(['https://example.com']);
    });
  });

  describe('Logging Configuration', () => {
    test('should use default logging configuration', () => {
      delete process.env.LOG_LEVEL;
      delete process.env.LOG_FILE_PATH;
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.logging.level).toBe('info');
      expect(freshConfig.logging.filePath).toBe('logs/jarvis-api.log');
    });

    test('should use custom logging configuration', () => {
      process.env.LOG_LEVEL = 'debug';
      process.env.LOG_FILE_PATH = '/var/log/app.log';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.logging.level).toBe('debug');
      expect(freshConfig.logging.filePath).toBe('/var/log/app.log');
    });
  });

  describe('File Upload Configuration', () => {
    test('should use default file upload configuration', () => {
      delete process.env.MAX_FILE_SIZE;
      delete process.env.UPLOAD_DIR;
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.upload.maxFileSize).toBe(10 * 1024 * 1024); // 10MB
      expect(freshConfig.upload.uploadDir).toBe('uploads');
    });

    test('should use custom file upload configuration', () => {
      process.env.MAX_FILE_SIZE = '20971520'; // 20MB
      process.env.UPLOAD_DIR = '/tmp/uploads';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.upload.maxFileSize).toBe(20971520);
      expect(freshConfig.upload.uploadDir).toBe('/tmp/uploads');
    });

    test('should handle invalid file size gracefully', () => {
      process.env.MAX_FILE_SIZE = 'invalid';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.upload.maxFileSize).toBe(10 * 1024 * 1024);
    });
  });

  describe('WebSocket Configuration', () => {
    test('should use default WebSocket port when not specified', () => {
      delete process.env.WS_PORT;
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.websocket.port).toBe(3002);
    });

    test('should use custom WebSocket port', () => {
      process.env.WS_PORT = '8080';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.websocket.port).toBe(8080);
    });
  });

  describe('Monitoring Configuration', () => {
    test('should use default monitoring configuration', () => {
      delete process.env.PROMETHEUS_PORT;
      delete process.env.HEALTH_CHECK_INTERVAL;
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.monitoring.prometheusPort).toBe(9090);
      expect(freshConfig.monitoring.healthCheckInterval).toBe(30000);
    });

    test('should use custom monitoring configuration', () => {
      process.env.PROMETHEUS_PORT = '9091';
      process.env.HEALTH_CHECK_INTERVAL = '60000';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.monitoring.prometheusPort).toBe(9091);
      expect(freshConfig.monitoring.healthCheckInterval).toBe(60000);
    });
  });

  describe('Helper Functions', () => {
    test('parseIntOrDefault should handle valid integers', () => {
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      // Test with valid integer
      process.env.PORT = '8080';
      jest.resetModules();
      const { config: newConfig } = require('../../src/config/index.js');
      expect(newConfig.port).toBe(8080);
    });

    test('parseIntOrDefault should handle undefined values', () => {
      delete process.env.PORT;
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.port).toBe(3000);
    });

    test('parseIntOrDefault should handle invalid values gracefully', () => {
      process.env.PORT = 'invalid';
      
      // Re-import to trigger config creation
      jest.resetModules();
      const { config: freshConfig } = require('../../src/config/index.js');
      
      expect(freshConfig.port).toBe(3000);
    });
  });
});

