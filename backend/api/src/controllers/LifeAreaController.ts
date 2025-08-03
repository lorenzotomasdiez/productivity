// LifeArea HTTP Controller
import { Request, Response } from 'express';
import { LifeAreaService } from '../services/LifeAreaService';
import { CreateLifeAreaRequest, UpdateLifeAreaRequest, LifeAreaType } from '../types/lifeAreas';
import { logger } from '../config/logger';

export class LifeAreaController {
  static async getLifeAreas(req: Request, res: Response): Promise<void> {
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
      if (req.query.is_active !== undefined) {
        filters.isActive = req.query.is_active === 'true';
      }
      if (req.query.type && Object.values(LifeAreaType).includes(req.query.type as LifeAreaType)) {
        filters.type = req.query.type as LifeAreaType;
      }

      const lifeAreas = await LifeAreaService.getUserLifeAreas(userId, filters);

      res.status(200).json({
        success: true,
        data: lifeAreas,
      });
    } catch (error) {
      logger.error('Error fetching life areas', { error, userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch life areas' },
      });
    }
  }

  static async createLifeArea(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 
        });
        return;
      }

      const lifeAreaData: CreateLifeAreaRequest = req.body;

      // Validation
      if (!lifeAreaData.name || !lifeAreaData.type) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Name and type are required' },
        });
        return;
      }

      const lifeArea = await LifeAreaService.createLifeArea(userId, lifeAreaData);

      res.status(201).json({
        success: true,
        data: lifeArea,
      });
    } catch (error: any) {
      logger.error('Error creating life area', { error, userId: req.user?.id, body: req.body });
      
      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: error.message },
        });
        return;
      }

      if (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('must be')) {
        res.status(422).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.message },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create life area' },
      });
    }
  }

  static async getLifeAreaById(req: Request, res: Response): Promise<void> {
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

      const lifeArea = await LifeAreaService.getLifeAreaById(id!);

      if (!lifeArea) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Life area not found' },
        });
        return;
      }

      // Check if user owns this life area
      if (lifeArea.userId !== userId) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied to this life area' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: lifeArea,
      });
    } catch (error) {
      logger.error('Error fetching life area', { error, lifeAreaId: req.params.id, userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch life area' },
      });
    }
  }

  static async updateLifeArea(req: Request, res: Response): Promise<void> {
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

      const updates: UpdateLifeAreaRequest = req.body;

      const lifeArea = await LifeAreaService.updateLifeArea(id!, userId!, updates);

      res.status(200).json({
        success: true,
        data: lifeArea,
      });
    } catch (error: any) {
      logger.error('Error updating life area', { error, lifeAreaId: req.params.id, userId: req.user?.id });
      
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

      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: error.message },
        });
        return;
      }

      if (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('must be')) {
        res.status(422).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.message },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update life area' },
      });
    }
  }

  static async deleteLifeArea(req: Request, res: Response): Promise<void> {
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

      await LifeAreaService.deleteLifeArea(id!, userId!);

      res.status(200).json({
        success: true,
        message: 'Life area deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting life area', { error, lifeAreaId: req.params.id, userId: req.user?.id });
      
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
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete life area' },
      });
    }
  }

  static async reorderLifeAreas(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 
        });
        return;
      }

      const { life_area_ids } = req.body;

      if (!Array.isArray(life_area_ids)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'life_area_ids must be an array' },
        });
        return;
      }

      const lifeAreas = await LifeAreaService.reorderLifeAreas(userId, life_area_ids);

      res.status(200).json({
        success: true,
        data: lifeAreas,
      });
    } catch (error: any) {
      logger.error('Error reordering life areas', { error, userId: req.user?.id });
      
      if (error.message.includes('do not belong')) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to reorder life areas' },
      });
    }
  }
}