import express from 'express';
import { logger } from '../config/logger.js';
import { authenticateToken } from '../middleware/auth.js';
import { DashboardController } from '../controllers/DashboardController.js';

const router = express.Router();

// Protect all dashboard routes
router.use(authenticateToken);

// GET /api/v1/dashboard/stats
router.get('/stats', DashboardController.getDashboardStats);

// POST /api/v1/dashboard/widgets
router.post('/widgets', DashboardController.updateDashboardWidgets);

export { router as dashboardRouter };