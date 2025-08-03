import express from 'express';
import { logger } from '../config/logger.js';

const router = express.Router();

// GET /api/v1/chat/conversations
router.get('/conversations', async (req, res, next) => {
  try {
    logger.info('Get chat conversations endpoint called');
    
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Chat endpoints not yet implemented - coming in TDD phase',
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/chat/message
router.post('/message', async (req, res, next) => {
  try {
    logger.info('Send chat message endpoint called');
    
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Chat endpoints not yet implemented - coming in TDD phase',
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as chatRouter };