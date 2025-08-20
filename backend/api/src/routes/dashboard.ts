import express from 'express';
import { DashboardController } from '../controllers/DashboardController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { dashboardSchemas } from '../validation/schemas.js';

const router = express.Router();

// Protect all dashboard routes
router.use(authenticateToken);

// GET /api/v1/dashboard/stats
router.get('/stats', validateRequest(dashboardSchemas.getStats), DashboardController.getDashboardStats);

// POST /api/v1/dashboard/widgets
router.post('/widgets', validateRequest(dashboardSchemas.updateWidgets), DashboardController.updateDashboardWidgets);

export { router as dashboardRouter };