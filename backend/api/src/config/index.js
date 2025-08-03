import dotenv from 'dotenv';
import { logger } from './logger.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL,
    testUrl: process.env.TEST_DATABASE_URL,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
    },
  },

  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiry: process.env.JWT_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  },

  // Apple Sign In configuration
  apple: {
    teamId: process.env.APPLE_TEAM_ID,
    keyId: process.env.APPLE_KEY_ID,
    privateKeyPath: process.env.APPLE_PRIVATE_KEY_PATH,
    clientId: process.env.APPLE_CLIENT_ID,
  },

  // AI Service configuration
  ai: {
    serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  },

  // Research Engine configuration
  research: {
    serviceUrl: process.env.RESEARCH_ENGINE_URL || 'http://localhost:3001',
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || 'logs/jarvis-api.log',
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },

  // WebSocket configuration
  websocket: {
    port: parseInt(process.env.WS_PORT) || 3002,
  },

  // Monitoring configuration
  monitoring: {
    prometheusPort: parseInt(process.env.PROMETHEUS_PORT) || 9090,
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
  },
};