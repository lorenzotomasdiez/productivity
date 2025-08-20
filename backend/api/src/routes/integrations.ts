import express from 'express';
import { logger } from '../config/logger.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { integrationSchemas, additionalSchemas } from '../validation/schemas.js';

const router = express.Router();

// Protect all integrations routes
router.use(authenticateToken);

// GET /api/v1/integrations
router.get('/', validateRequest(additionalSchemas.integrationList), async(req, res, next) => {
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
router.post('/connect', validateRequest(integrationSchemas.connect), async(req, res, next) => {
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