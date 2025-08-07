import express from 'express';
import { GoalController } from '../controllers/GoalController';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Protect all goal routes
router.use(authenticateToken);

// GET /api/v1/goals - Get all goals for user with optional filters
router.get('/', GoalController.getGoals);

// POST /api/v1/goals - Create a new goal
router.post('/', GoalController.createGoal);

// GET /api/v1/goals/:id - Get specific goal by ID
router.get('/:id', GoalController.getGoalById);

// PUT /api/v1/goals/:id/progress - Update goal progress
router.put('/:id/progress', GoalController.updateGoalProgress);

// DELETE /api/v1/goals/:id - Delete a goal
router.delete('/:id', GoalController.deleteGoal);

export { router as goalsRouter };