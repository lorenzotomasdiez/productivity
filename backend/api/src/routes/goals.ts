import express from 'express';
import { GoalController } from '../controllers/GoalController';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { goalSchemas, additionalSchemas } from '../validation/schemas.js';

const router = express.Router();

// Protect all goal routes
router.use(authenticateToken);

// GET /api/v1/goals - Get all goals for user with optional filters
router.get('/', validateRequest(goalSchemas.list), GoalController.getGoals);

// POST /api/v1/goals - Create a new goal
router.post('/', validateRequest(goalSchemas.create), GoalController.createGoal);

// GET /api/v1/goals/:id - Get specific goal by ID
router.get('/:id', validateRequest(goalSchemas.getById), GoalController.getGoalById);

// PUT /api/v1/goals/:id/progress - Update goal progress (DEPRECATED)
router.put('/:id/progress', (req, res) => {
  res.status(410).json({
    success: false,
    error: { code: 'GONE', message: 'Deprecated. Create a progress entry instead.' },
  });
});

// DELETE /api/v1/goals/:id - Delete a goal
router.delete('/:id', validateRequest(goalSchemas.getById), GoalController.deleteGoal);

export { router as goalsRouter };