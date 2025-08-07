// GoalService - Business Logic Layer for Goals Management
import { GoalModel } from '../models/Goal';
import { LifeAreaModel } from '../models/LifeArea';
import { Goal, CreateGoalRequest, GoalFilters, GoalType, GoalStatus } from '../types/goals';

export class GoalService {
  static async createGoal(userId: string, goalData: CreateGoalRequest): Promise<Goal> {
    // Validate life area exists and belongs to user
    const lifeArea = await LifeAreaModel.findById(goalData.lifeAreaId);
    
    if (!lifeArea) {
      throw new Error('Life area not found');
    }
    
    if (lifeArea.userId !== userId) {
      throw new Error('Unauthorized to create goal in this life area');
    }
    
    // Validate goal type specific requirements
    if (goalData.goalType === GoalType.NUMERIC && !goalData.targetValue) {
      throw new Error('Numeric goals must have a target value');
    }
    
    // Create the goal
    return await GoalModel.create(userId, goalData);
  }
  
  static async getUserGoals(userId: string, filters?: GoalFilters): Promise<Goal[]> {
    return await GoalModel.findByUserId(userId, filters);
  }
  
  static async getGoalById(goalId: string, userId: string): Promise<Goal | null> {
    const goal = await GoalModel.findById(goalId);
    
    if (!goal) {
      return null;
    }
    
    // Ensure user owns the goal
    if (goal.userId !== userId) {
      throw new Error('Unauthorized to access this goal');
    }
    
    return goal;
  }
  
  // Deprecated: update goal progress directly; use progress entries instead
  
  static async deleteGoal(goalId: string, userId: string): Promise<boolean> {
    // Find and validate goal
    const goal = await GoalModel.findById(goalId);
    
    if (!goal) {
      throw new Error('Goal not found');
    }
    
    if (goal.userId !== userId) {
      throw new Error('Unauthorized to delete this goal');
    }
    
    return await GoalModel.delete(goalId);
  }
}