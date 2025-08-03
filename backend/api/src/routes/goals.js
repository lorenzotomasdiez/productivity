import express from 'express';
import { logger } from '../config/logger.js';

const router = express.Router();

// GET /api/v1/goals
router.get('/', async (req, res, next) => {
  try {
    logger.info('Get goals endpoint called');
    
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Goals endpoints not yet implemented - coming in TDD phase',
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/goals
router.post('/', async (req, res, next) => {
  try {
    logger.info('Create goal endpoint called');
    
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Goals endpoints not yet implemented - coming in TDD phase',
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as goalsRouter };