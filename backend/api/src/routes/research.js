import express from 'express';
import { logger } from '../config/logger.js';

const router = express.Router();

// GET /api/v1/research/history
router.get('/history', async (req, res, next) => {
  try {
    logger.info('Get research history endpoint called');
    
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Research endpoints not yet implemented - coming in TDD phase',
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/research/query
router.post('/query', async (req, res, next) => {
  try {
    logger.info('Execute research query endpoint called');
    
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Research endpoints not yet implemented - coming in TDD phase',
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as researchRouter };