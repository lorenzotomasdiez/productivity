import express from 'express';
import { logger } from '../config/logger.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Protect all notifications routes
router.use(authenticateToken);

// GET /api/v1/notifications
router.get('/', async(req, res, next) => {
  try {
    logger.info('Get notifications endpoint called');
    
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Notifications endpoints not yet implemented - coming in TDD phase',
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/notifications/mark-read
router.post('/mark-read', async(req, res, next) => {
  try {
    logger.info('Mark notifications as read endpoint called');
    
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Notifications endpoints not yet implemented - coming in TDD phase',
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as notificationsRouter };