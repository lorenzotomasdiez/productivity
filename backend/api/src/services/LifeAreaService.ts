// LifeArea Business Logic Service
import { LifeAreaModel } from '../models/LifeArea.js';
import { LifeArea, CreateLifeAreaRequest, UpdateLifeAreaRequest, LifeAreaFilters, LifeAreaType } from '../types/lifeAreas.js';

export class LifeAreaService {
  static async createLifeArea(userId: string, lifeAreaData: CreateLifeAreaRequest): Promise<LifeArea> {
    // Business validation
    this.validateCreateData(lifeAreaData);

    // Check for duplicate names for the same user
    const existingAreas = await LifeAreaModel.findByUserId(userId);
    const nameExists = existingAreas.some(area => 
      area.name.toLowerCase() === lifeAreaData.name.trim().toLowerCase(),
    );

    if (nameExists) {
      throw new Error('A life area with this name already exists');
    }

    return await LifeAreaModel.create(userId, lifeAreaData);
  }

  static async getUserLifeAreas(userId: string, filters?: LifeAreaFilters): Promise<LifeArea[]> {
    return await LifeAreaModel.findByUserId(userId, filters);
  }

  static async getLifeAreaById(id: string): Promise<LifeArea | null> {
    return await LifeAreaModel.findById(id);
  }

  static async updateLifeArea(id: string, userId: string, updates: UpdateLifeAreaRequest): Promise<LifeArea | null> {
    // Verify the life area exists and belongs to the user
    const existingArea = await LifeAreaModel.findById(id);
    if (!existingArea) {
      throw new Error('Life area not found');
    }

    if (existingArea.userId !== userId) {
      throw new Error('Unauthorized to update this life area');
    }

    // Check for name conflicts if name is being updated
    if (updates.name) {
      const otherAreas = await LifeAreaModel.findByUserId(userId);
      const nameConflict = otherAreas.some(area => 
        area.id !== id && area.name.toLowerCase() === updates.name!.trim().toLowerCase(),
      );

      if (nameConflict) {
        throw new Error('A life area with this name already exists');
      }
    }

    return await LifeAreaModel.update(id, updates);
  }

  static async deleteLifeArea(id: string, userId: string): Promise<boolean> {
    // Verify the life area exists and belongs to the user
    const existingArea = await LifeAreaModel.findById(id);
    if (!existingArea) {
      throw new Error('Life area not found');
    }

    if (existingArea.userId !== userId) {
      throw new Error('Unauthorized to delete this life area');
    }

    return await LifeAreaModel.delete(id);
  }

  static async reorderLifeAreas(userId: string, lifeAreaIds: string[]): Promise<LifeArea[]> {
    // Verify all life areas belong to the user
    const userAreas = await LifeAreaModel.findByUserId(userId);
    const userAreaIds = userAreas.map(area => area.id);

    const invalidIds = lifeAreaIds.filter(id => !userAreaIds.includes(id));
    if (invalidIds.length > 0) {
      throw new Error('Some life areas do not belong to the user');
    }

    return await LifeAreaModel.reorder(userId, lifeAreaIds);
  }

  private static validateCreateData(data: CreateLifeAreaRequest): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Life area name is required');
    }

    if (data.name.length > 255) {
      throw new Error('Life area name must be 255 characters or less');
    }

    if (!Object.values(LifeAreaType).includes(data.type)) {
      throw new Error('Invalid life area type');
    }

    if (data.color && !/^#[0-9A-F]{6}$/i.test(data.color)) {
      throw new Error('Color must be a valid hex color code');
    }

    if (data.icon && data.icon.length > 100) {
      throw new Error('Icon name must be 100 characters or less');
    }
  }
}