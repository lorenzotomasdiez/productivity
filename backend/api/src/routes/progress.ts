import { Router } from 'express';
import { ProgressController } from '../controllers/ProgressController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all progress routes
router.use(authenticateToken);

/**
 * Progress Entry Routes
 */

// Create a new progress entry for a goal
// POST /api/v1/goals/:goalId/progress
router.post('/goals/:goalId/progress', ProgressController.createProgressEntry);

// Get progress entries for a goal with statistics
// GET /api/v1/goals/:goalId/progress
router.get('/goals/:goalId/progress', ProgressController.getProgressEntries);

// Update a progress entry
// PUT /api/v1/progress-entries/:id
router.put('/progress-entries/:id', ProgressController.updateProgressEntry);

// Delete a progress entry
// DELETE /api/v1/progress-entries/:id
router.delete('/progress-entries/:id', ProgressController.deleteProgressEntry);

export default router; 