// Goal HTTP Controller
import { Request, Response } from 'express';
import { GoalService } from '../services/GoalService';
import { CreateGoalRequest, GoalType, GoalStatus } from '../types/goals';
import { logger } from '../config/logger';

export class GoalController {
  static async getGoals(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 
        });
        return;
      }

      // Parse query filters
      const filters: any = {};
      
      // Handle both snake_case and camelCase parameter names
      if (req.query.lifeAreaId || req.query.life_area_id) {
        filters.lifeAreaId = (req.query.lifeAreaId || req.query.life_area_id) as string;
      }
      if (req.query.status && Object.values(GoalStatus).includes(req.query.status as GoalStatus)) {
        filters.status = req.query.status as GoalStatus;
      }
      if (req.query.goalType && Object.values(GoalType).includes(req.query.goalType as GoalType)) {
        filters.goalType = req.query.goalType as GoalType;
      }
      if (req.query.parentGoalId !== undefined || req.query.parent_goal_id !== undefined) {
        const parentGoalId = req.query.parentGoalId || req.query.parent_goal_id;
        filters.parentGoalId = parentGoalId === 'null' ? null : parentGoalId as string;
      }
      if (req.query.hasDeadline !== undefined || req.query.has_deadline !== undefined) {
        const hasDeadline = req.query.hasDeadline || req.query.has_deadline;
        filters.hasDeadline = hasDeadline === 'true';
      }

      const goals = await GoalService.getUserGoals(userId, filters);

      res.status(200).json({
        success: true,
        data: goals,
      });
    } catch (error) {
      logger.error('Error fetching goals', { error, userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch goals' },
      });
    }
  }

  static async createGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 
        });
        return;
      }

      const goalData: CreateGoalRequest = req.body;

      const goal = await GoalService.createGoal(userId, goalData);

      res.status(201).json({
        success: true,
        data: goal,
      });
    } catch (error: any) {
      logger.error('Error creating goal', { error, userId: req.user?.id, body: req.body });
      
      if (error.message.includes('Life area not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
        return;
      }

      if (error.message.includes('Unauthorized')) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
        return;
      }

      if (error.message.includes('must have') || error.message.includes('required') || error.message.includes('Invalid')) {
        res.status(422).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.message },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create goal' },
      });
    }
  }

  static async getGoalById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 
        });
        return;
      }

      const goal = await GoalService.getGoalById(id!, userId);

      if (!goal) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Goal not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: goal,
      });
    } catch (error) {
      logger.error('Error fetching goal', { error, goalId: req.params.id, userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch goal' },
      });
    }
  }

  static async updateGoalProgress(req: Request, res: Response): Promise<void> {
    // Deprecated: single source of truth is progress entries + DB trigger
    res.status(410).json({
      success: false,
      error: { code: 'GONE', message: 'Deprecated. Create a progress entry instead.' },
    });
  }

  static async deleteGoal(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 
        });
        return;
      }

      await GoalService.deleteGoal(id!, userId);

      res.status(200).json({
        success: true,
        message: 'Goal deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting goal', { error, goalId: req.params.id, userId: req.user?.id });
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
        return;
      }

      if (error.message.includes('Unauthorized')) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete goal' },
      });
    }
  }
}