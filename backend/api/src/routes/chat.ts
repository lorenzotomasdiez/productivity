import express from 'express';
import { logger } from '../config/logger.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { additionalSchemas } from '../validation/schemas.js';

const router = express.Router();

// Protect all chat routes
router.use(authenticateToken);

// GET /api/v1/chat/conversations
router.get('/conversations', validateRequest(additionalSchemas.chatConversations), async(req, res, next) => {
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
router.post('/message', validateRequest(additionalSchemas.chatMessage), async(req, res, next) => {
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