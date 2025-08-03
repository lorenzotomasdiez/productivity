import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

// Import routes
import authRouter from './routes/auth.js';
import { lifeAreasRouter } from './routes/lifeAreas.js';
import { goalsRouter } from './routes/goals.js';
import { chatRouter } from './routes/chat.js';
import { researchRouter } from './routes/research.js';
import { dashboardRouter } from './routes/dashboard.js';
import { integrationsRouter } from './routes/integrations.js';
import { notificationsRouter } from './routes/notifications.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later.',
    },
  },
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.env,
      uptime: process.uptime(),
    },
  });
});

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/life-areas', lifeAreasRouter);
app.use('/api/v1/goals', goalsRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/research', researchRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/integrations', integrationsRouter);
app.use('/api/v1/notifications', notificationsRouter);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export { app };