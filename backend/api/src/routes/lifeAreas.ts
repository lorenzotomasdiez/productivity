import express from 'express';
import { logger } from '../config/logger.js';

const router = express.Router();

// GET /api/v1/life-areas
router.get('/', async(req, res, next) => {
  try {
    logger.info('Get life areas endpoint called');
    
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Life areas endpoints not yet implemented - coming in TDD phase',
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/life-areas
router.post('/', async(req, res, next) => {
  try {
    logger.info('Create life area endpoint called');
    
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Life areas endpoints not yet implemented - coming in TDD phase',
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as lifeAreasRouter };