import { app } from './app.js';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { connectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('✅ Database connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('✅ Redis connected successfully');

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Jarvis API server running on port ${config.port}`);
      logger.info(`📖 Environment: ${config.env}`);
      logger.info(`🏥 Health check: http://localhost:${config.port}/health`);
    });

    // Handle server shutdown
    const gracefulShutdown = () => {
      logger.info('🛑 Received shutdown signal, closing server...');
      server.close(() => {
        logger.info('✅ HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();