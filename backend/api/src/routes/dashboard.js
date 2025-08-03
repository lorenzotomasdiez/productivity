import express from 'express';
import { logger } from '../config/logger.js';

const router = express.Router();

// GET /api/v1/dashboard/stats
router.get('/stats', async (req, res, next) => {
  try {
    logger.info('Get dashboard stats endpoint called');
    
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Dashboard endpoints not yet implemented - coming in TDD phase',
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/dashboard/widgets
router.post('/widgets', async (req, res, next) => {
  try {
    logger.info('Update dashboard widgets endpoint called');
    
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Dashboard endpoints not yet implemented - coming in TDD phase',
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as dashboardRouter };