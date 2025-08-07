// ProgressEntryService - Business Logic Layer for Progress Tracking
import { ProgressEntryModel } from '../models/ProgressEntry';
import { GoalModel } from '../models/Goal';
import { ProgressEntry, CreateProgressEntryRequest, UpdateProgressEntryRequest } from '../types/goals';

export class ProgressEntryService {
  static async createProgressEntry(progressData: CreateProgressEntryRequest): Promise<ProgressEntry> {
    // Validate goal exists and belongs to user
    const goal = await GoalModel.findById(progressData.goalId);
    
    if (!goal) {
      throw new Error('Goal not found');
    }
    
    if (goal.userId !== progressData.userId) {
      throw new Error('Unauthorized to add progress to this goal');
    }
    
    // Create the progress entry
    const progressEntry = await ProgressEntryModel.create(progressData);
    
    // Do not directly update goal current_value here; DB trigger maintains it
    
    return progressEntry;
  }
  
  static async getProgressEntries(goalId: string, userId: string): Promise<ProgressEntry[]> {
    // Validate goal exists and belongs to user
    const goal = await GoalModel.findById(goalId);
    
    if (!goal) {
      throw new Error('Goal not found');
    }
    
    if (goal.userId !== userId) {
      throw new Error('Unauthorized to access this goal');
    }
    
    return await ProgressEntryModel.findByGoalId(goalId);
  }
  
  static async updateProgressEntry(entryId: string, userId: string, updates: UpdateProgressEntryRequest): Promise<ProgressEntry> {
    // Find and validate progress entry
    const progressEntry = await ProgressEntryModel.findById(entryId);
    
    if (!progressEntry) {
      throw new Error('Progress entry not found');
    }
    
    // Validate goal exists and belongs to user
    const goal = await GoalModel.findById(progressEntry.goalId);
    
    if (!goal) {
      throw new Error('Goal not found');
    }
    
    if (goal.userId !== userId) {
      throw new Error('Unauthorized to update this progress entry');
    }
    
    // Update the progress entry
    const updatedEntry = await ProgressEntryModel.update(entryId, updates);
    
    if (!updatedEntry) {
      throw new Error('Failed to update progress entry');
    }
    
    // Do not directly update goal current_value here; DB trigger maintains it
    
    return updatedEntry;
  }
  
  static async deleteProgressEntry(entryId: string, userId: string): Promise<boolean> {
    // Find and validate progress entry
    const progressEntry = await ProgressEntryModel.findById(entryId);
    
    if (!progressEntry) {
      throw new Error('Progress entry not found');
    }
    
    // Validate goal exists and belongs to user
    const goal = await GoalModel.findById(progressEntry.goalId);
    
    if (!goal) {
      throw new Error('Goal not found');
    }
    
    if (goal.userId !== userId) {
      throw new Error('Unauthorized to delete this progress entry');
    }
    
    return await ProgressEntryModel.delete(entryId);
  }

  /**
   * Get a single progress entry by ID
   */
  static async getProgressEntryById(entryId: string, userId: string): Promise<ProgressEntry> {
    const progressEntry = await ProgressEntryModel.findById(entryId);
    
    if (!progressEntry) {
      throw new Error('Progress entry not found');
    }
    
    // Validate goal exists and belongs to user
    const goal = await GoalModel.findById(progressEntry.goalId);
    
    if (!goal) {
      throw new Error('Goal not found');
    }
    
    if (goal.userId !== userId) {
      throw new Error('Unauthorized to access this progress entry');
    }
    
    return progressEntry;
  }
}
