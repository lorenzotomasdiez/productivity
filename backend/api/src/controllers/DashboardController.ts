import { Request, Response, NextFunction } from 'express';
import { LifeAreaModel } from '../models/LifeArea.js';
import { GoalModel } from '../models/Goal.js';
import { ProgressEntryModel } from '../models/ProgressEntry.js';
import { logger } from '../config/logger.js';

export class DashboardController {
  static async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      logger.info('Get dashboard stats endpoint called');

      // Fetch all data for the user
      const [lifeAreas, goals, progressEntries] = await Promise.all([
        LifeAreaModel.findByUserId(userId),
        GoalModel.findByUserId(userId),
        ProgressEntryModel.findByUserId(userId),
      ]);

      // Calculate summary statistics
      const totalLifeAreas = lifeAreas.filter(la => la.isActive).length;
      const totalGoals = goals.length;
      const activeGoals = goals.filter(g => g.status === 'active').length;
      const completedGoals = goals.filter(g => g.status === 'completed').length;
      const totalProgressEntries = progressEntries.length;

      // Calculate current streak (consecutive days with progress entries)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let currentStreak = 0;
      const sortedEntries = progressEntries
        .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
      
      if (sortedEntries.length > 0) {
        let currentDate = new Date(today);
        let dayOffset = 0;
        
        while (dayOffset < 365) { // Limit to 1 year to prevent infinite loops
          const hasEntryForDate = sortedEntries.some(entry => {
            const entryDate = new Date(entry.entryDate);
            entryDate.setHours(0, 0, 0, 0);
            return entryDate.getTime() === currentDate.getTime();
          });
          
          if (hasEntryForDate) {
            currentStreak++;
            currentDate.setDate(currentDate.getDate() - 1);
            dayOffset++;
          } else {
            break;
          }
        }
      }

      // Get recent progress entries (last 5)
      const recentProgress = progressEntries
        .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
        .slice(0, 5);

      // Calculate life area statistics
      const lifeAreaStats = lifeAreas
        .filter(la => la.isActive)
        .map(la => {
          const areaGoals = goals.filter(g => g.lifeAreaId === la.id);
          const completedAreaGoals = areaGoals.filter(g => g.status === 'completed').length;
          const completionRate = areaGoals.length > 0 
            ? Math.round((completedAreaGoals / areaGoals.length) * 100)
            : 0;

          return {
            ...la,
            goals_count: areaGoals.length,
            completion_rate: completionRate,
          };
        });

      const dashboardData = {
        summary: {
          total_life_areas: totalLifeAreas,
          total_goals: totalGoals,
          active_goals: activeGoals,
          completed_goals: completedGoals,
          total_progress_entries: totalProgressEntries,
          current_streak: currentStreak,
        },
        life_areas: lifeAreaStats,
        recent_progress: recentProgress,
      };

      res.status(200).json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      logger.error('Error fetching dashboard stats', { error, userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch dashboard statistics',
        },
      });
    }
  }

  static async updateDashboardWidgets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const { widgets } = req.body;

      // Validate widget data structure
      if (!Array.isArray(widgets)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Widgets must be an array',
          },
        });
        return;
      }

      // Validate each widget
      for (const widget of widgets) {
        if (!widget.id || !widget.type || !widget.position) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Each widget must have id, type, and position',
            },
          });
          return;
        }

        if (widget.position.x === undefined || widget.position.x === null || 
            widget.position.y === undefined || widget.position.y === null) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Widget position must have x and y coordinates',
            },
          });
          return;
        }
      }

      // For MVP, we'll just return the widgets as-is
      // In a real implementation, this would save to the database
      res.status(200).json({
        success: true,
        data: {
          widgets,
          message: 'Dashboard widgets updated successfully',
        },
      });
    } catch (error) {
      logger.error('Error updating dashboard widgets', { error, userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update dashboard widgets',
        },
      });
    }
  }
}
