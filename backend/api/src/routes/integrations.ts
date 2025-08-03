import express from 'express';
import { logger } from '../config/logger.js';

const router = express.Router();

// GET /api/v1/integrations
router.get('/', async(req, res, next) => {
  try {
    logger.info('Get integrations endpoint called');
    
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Integrations endpoints not yet implemented - coming in TDD phase',
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/integrations/connect
router.post('/connect', async(req, res, next) => {
  try {
    logger.info('Connect integration endpoint called');
    
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Integrations endpoints not yet implemented - coming in TDD phase',
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as integrationsRouter };