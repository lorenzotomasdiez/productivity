import { Router } from 'express';
import { ProgressController } from '../controllers/ProgressController';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { progressSchemas } from '../validation/schemas.js';

const router = Router();

// Apply authentication middleware to all progress routes
router.use(authenticateToken);

/**
 * Progress Entry Routes
 */

// Create a new progress entry for a goal
// POST /api/v1/goals/:goalId/progress
router.post('/goals/:goalId/progress', validateRequest(progressSchemas.create), ProgressController.createProgressEntry);

// Get progress entries for a goal with statistics
// GET /api/v1/goals/:goalId/progress
router.get('/goals/:goalId/progress', validateRequest(progressSchemas.getByGoal), ProgressController.getProgressEntries);

// Update a progress entry
// PUT /api/v1/progress-entries/:id
router.put('/progress-entries/:id', validateRequest(progressSchemas.update), ProgressController.updateProgressEntry);

// Delete a progress entry
// DELETE /api/v1/progress-entries/:id
router.delete('/progress-entries/:id', validateRequest(progressSchemas.delete), ProgressController.deleteProgressEntry);

export default router; 