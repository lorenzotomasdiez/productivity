import { Request, Response } from 'express';
import { ProgressEntryService } from '../services/ProgressEntryService';
import { GoalService } from '../services/GoalService';
import { CreateProgressEntryRequest, UpdateProgressEntryRequest } from '../types/goals';
import { logger } from '../config/logger';

export class ProgressController {
  /**
   * Create a new progress entry for a goal
   * POST /api/v1/goals/:goalId/progress
   */
  static async createProgressEntry(req: Request, res: Response): Promise<void> {
    try {
      const goalId = req.params.goalId;
      const userId = (req as any).user?.id;

      if (!goalId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Goal ID is required',
          },
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
        return;
      }

      // Validate request body
      const { entryDate, value, notes, dataSource, metadata, attachments } = req.body;

      if (!entryDate) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Entry date is required',
          },
        });
        return;
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(entryDate)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Entry date must be in YYYY-MM-DD format',
          },
        });
        return;
      }

      // Validate value if provided
      if (value !== undefined && value !== null) {
        if (typeof value !== 'number' || isNaN(value)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Value must be a valid number',
            },
          });
          return;
        }
      }

      const progressData: CreateProgressEntryRequest = {
        goalId,
        userId,
        entryDate,
        value,
        notes,
        dataSource,
        metadata,
        attachments,
      };

      const progressEntry = await ProgressEntryService.createProgressEntry(progressData);

      logger.info(`Progress entry created for goal ${goalId} by user ${userId}`);

      res.status(201).json({
        success: true,
        data: progressEntry,
      });
    } catch (error: any) {
      logger.error('Error creating progress entry:', error);

      if (error.message === 'Goal not found') {
        res.status(404).json({
          success: false,
          error: {
            code: 'GOAL_NOT_FOUND',
            message: 'Goal not found',
          },
        });
        return;
      }

      if (error.message === 'Unauthorized to add progress to this goal') {
        res.status(403).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to add progress to this goal',
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create progress entry',
        },
      });
    }
  }

  /**
   * Get progress entries for a goal with statistics
   * GET /api/v1/goals/:goalId/progress
   */
  static async getProgressEntries(req: Request, res: Response): Promise<void> {
    try {
      const goalId = req.params.goalId;
      const userId = (req as any).user?.id;

      if (!goalId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Goal ID is required',
          },
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
        return;
      }

      // Verify goal exists and user has access
      const goal = await GoalService.getGoalById(goalId, userId);
      if (!goal) {
        res.status(404).json({
          success: false,
          error: {
            code: 'GOAL_NOT_FOUND',
            message: 'Goal not found',
          },
        });
        return;
      }

      const progressEntries = await ProgressEntryService.getProgressEntries(goalId, userId);

      // Calculate statistics
      const totalEntries = progressEntries.length;
      const values = progressEntries
        .map(entry => entry.value)
        .filter(value => value !== null && value !== undefined);
      
      const averageValue = values.length > 0 
        ? values.reduce((sum, value) => sum + value, 0) / values.length 
        : 0;

      // Calculate streak (consecutive days with entries)
      let streak = 0;
      const sortedEntries = progressEntries
        .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
      
      if (sortedEntries.length > 0 && sortedEntries[0]) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (const entry of sortedEntries) {
          const entryDate = new Date(entry.entryDate);
          const diffTime = Math.abs(today.getTime() - entryDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= streak + 1) {
            streak++;
          } else {
            break;
          }
        }
      }

      // Calculate completion percentage based on goal type
      let completionPercentage = 0;
      if (goal.goalType === 'numeric' && goal.targetValue && averageValue > 0) {
        completionPercentage = Math.min((averageValue / goal.targetValue) * 100, 100);
      }

      const statistics = {
        totalEntries,
        averageValue: Math.round(averageValue * 100) / 100,
        streak,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
      };

      logger.info(`Progress entries retrieved for goal ${goalId} by user ${userId}`);

      res.status(200).json({
        success: true,
        data: {
          goal,
          progress_entries: progressEntries,
          statistics,
        },
      });
    } catch (error: any) {
      logger.error('Error retrieving progress entries:', error);

      if (error.message === 'Goal not found') {
        res.status(404).json({
          success: false,
          error: {
            code: 'GOAL_NOT_FOUND',
            message: 'Goal not found',
          },
        });
        return;
      }

      if (error.message === 'Unauthorized to access this goal') {
        res.status(403).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to access this goal',
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve progress entries',
        },
      });
    }
  }

  /**
   * Update a progress entry
   * PUT /api/v1/progress-entries/:id
   */
  static async updateProgressEntry(req: Request, res: Response): Promise<void> {
    try {
      const progressEntryId = req.params.id;
      const userId = (req as any).user?.id;

      if (!progressEntryId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Progress entry ID is required',
          },
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
        return;
      }
      const { value, notes, dataSource, metadata, attachments } = req.body;

      // Validate value if provided
      if (value !== undefined && value !== null) {
        if (typeof value !== 'number' || isNaN(value)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Value must be a valid number',
            },
          });
          return;
        }
      }

      const updateData: UpdateProgressEntryRequest = {
        value,
        notes,
        dataSource,
        metadata,
        attachments,
      };

      const progressEntry = await ProgressEntryService.updateProgressEntry(progressEntryId, userId, updateData);

      logger.info(`Progress entry ${progressEntryId} updated by user ${userId}`);

      res.status(200).json({
        success: true,
        data: progressEntry,
      });
    } catch (error: any) {
      logger.error('Error updating progress entry:', error);

      if (error.message === 'Progress entry not found') {
        res.status(404).json({
          success: false,
          error: {
            code: 'PROGRESS_ENTRY_NOT_FOUND',
            message: 'Progress entry not found',
          },
        });
        return;
      }

      if (error.message === 'Unauthorized to update this progress entry') {
        res.status(403).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to update this progress entry',
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update progress entry',
        },
      });
    }
  }

  /**
   * Delete a progress entry
   * DELETE /api/v1/progress-entries/:id
   */
  static async deleteProgressEntry(req: Request, res: Response): Promise<void> {
    try {
      const progressEntryId = req.params.id;
      const userId = (req as any).user?.id;

      if (!progressEntryId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Progress entry ID is required',
          },
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
        return;
      }

      await ProgressEntryService.deleteProgressEntry(progressEntryId, userId);

      logger.info(`Progress entry ${progressEntryId} deleted by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Progress entry deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting progress entry:', error);

      if (error.message === 'Progress entry not found') {
        res.status(404).json({
          success: false,
          error: {
            code: 'PROGRESS_ENTRY_NOT_FOUND',
            message: 'Progress entry not found',
          },
        });
        return;
      }

      if (error.message === 'Unauthorized to delete this progress entry') {
        res.status(403).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to delete this progress entry',
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete progress entry',
        },
      });
    }
  }
} 