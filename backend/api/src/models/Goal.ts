// Goal Model with TypeScript and Database Integration
import { query } from '../config/database';
import { Goal, CreateGoalRequest, UpdateGoalRequest, GoalFilters, GoalType, GoalStatus } from '../types/goals';
import { v4 as uuidv4 } from 'uuid';

export class GoalModel {
  static async create(userId: string, goalData: CreateGoalRequest): Promise<Goal> {
    // Validation
    if (!goalData.title || goalData.title.trim().length === 0) {
      throw new Error('Goal title is required');
    }

    if (!goalData.lifeAreaId) {
      throw new Error('Life area ID is required');
    }

    const goalId = uuidv4();
    const now = new Date();

    const queryText = `
      INSERT INTO goals (
        id, user_id, life_area_id, parent_goal_id, title, description, 
        goal_type, target_value, target_unit, deadline, priority, 
        metadata, reminder_config, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      goalId,
      userId,
      goalData.lifeAreaId,
      goalData.parentGoalId || null,
      goalData.title.trim(),
      goalData.description || null,
      goalData.goalType,
      goalData.targetValue || null,
      goalData.targetUnit || null,
      goalData.deadline ? new Date(goalData.deadline) : null,
      goalData.priority || 3,
      goalData.metadata ? JSON.stringify(goalData.metadata) : '{}',
      goalData.reminderConfig ? JSON.stringify(goalData.reminderConfig) : '{}',
      now,
      now,
    ];

    const result = await query(queryText, values);
    const row = result.rows[0];

    return this.mapRowToGoal(row);
  }

  static async findByUserId(userId: string, filters?: GoalFilters): Promise<Goal[]> {
    let queryText = 'SELECT * FROM goals WHERE user_id = $1';
    const values: any[] = [userId];
    let paramIndex = 2;

    if (filters?.lifeAreaId) {
      queryText += ` AND life_area_id = $${paramIndex}`;
      values.push(filters.lifeAreaId);
      paramIndex++;
    }

    if (filters?.status) {
      queryText += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters?.goalType) {
      queryText += ` AND goal_type = $${paramIndex}`;
      values.push(filters.goalType);
      paramIndex++;
    }

    if (filters?.parentGoalId !== undefined) {
      if (filters.parentGoalId) {
        queryText += ` AND parent_goal_id = $${paramIndex}`;
        values.push(filters.parentGoalId);
        paramIndex++;
      } else {
        queryText += ' AND parent_goal_id IS NULL';
      }
    }

    if (filters?.hasDeadline !== undefined) {
      queryText += filters.hasDeadline ? ' AND deadline IS NOT NULL' : ' AND deadline IS NULL';
    }

    queryText += ' ORDER BY priority DESC, created_at ASC';

    const result = await query(queryText, values);
    return result.rows.map(row => this.mapRowToGoal(row));
  }

  static async findById(id: string): Promise<Goal | null> {
    const queryText = 'SELECT * FROM goals WHERE id = $1';
    const result = await query(queryText, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToGoal(result.rows[0]);
  }

  static async update(id: string, updates: UpdateGoalRequest): Promise<Goal | null> {
    const now = new Date();
    const setClause: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    if (updates.title !== undefined) {
      if (updates.title.trim().length === 0) {
        throw new Error('Goal title cannot be empty');
      }
      setClause.push(`title = $${valueIndex++}`);
      values.push(updates.title.trim());
    }

    if (updates.description !== undefined) {
      setClause.push(`description = $${valueIndex++}`);
      values.push(updates.description || null);
    }

    if (updates.targetValue !== undefined) {
      setClause.push(`target_value = $${valueIndex++}`);
      values.push(updates.targetValue);
    }

    if (updates.currentValue !== undefined) {
      setClause.push(`current_value = $${valueIndex++}`);
      values.push(updates.currentValue);
    }

    if (updates.targetUnit !== undefined) {
      setClause.push(`target_unit = $${valueIndex++}`);
      values.push(updates.targetUnit || null);
    }

    if (updates.deadline !== undefined) {
      setClause.push(`deadline = $${valueIndex++}`);
      values.push(updates.deadline ? new Date(updates.deadline) : null);
    }

    if (updates.priority !== undefined) {
      setClause.push(`priority = $${valueIndex++}`);
      values.push(updates.priority);
    }

    if (updates.status !== undefined) {
      setClause.push(`status = $${valueIndex++}`);
      values.push(updates.status);
    }

    if (updates.metadata !== undefined) {
      setClause.push(`metadata = $${valueIndex++}`);
      values.push(updates.metadata ? JSON.stringify(updates.metadata) : '{}');
    }

    if (updates.reminderConfig !== undefined) {
      setClause.push(`reminder_config = $${valueIndex++}`);
      values.push(updates.reminderConfig ? JSON.stringify(updates.reminderConfig) : '{}');
    }

    if (setClause.length === 0) {
      return this.findById(id);
    }

    setClause.push(`updated_at = $${valueIndex++}`);
    values.push(now);
    values.push(id);

    const queryText = `
      UPDATE goals 
      SET ${setClause.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    const result = await query(queryText, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToGoal(result.rows[0]);
  }

  static async updateProgress(goalId: string, newValue: number): Promise<Goal | null> {
    return this.update(goalId, { currentValue: newValue });
  }

  static async delete(id: string): Promise<boolean> {
    const queryText = 'DELETE FROM goals WHERE id = $1';
    const result = await query(queryText, [id]);
    return (result.rowCount || 0) > 0;
  }

  static calculateProgressPercentage(goal: Goal): number {
    if (!goal.targetValue || goal.targetValue === 0) {
      return goal.status === GoalStatus.COMPLETED ? 100 : 0;
    }

    const percentage = (goal.currentValue / goal.targetValue) * 100;
    return Math.min(Math.round(percentage), 100);
  }

  static isCompleted(goal: Goal): boolean {
    switch (goal.goalType) {
    case GoalType.NUMERIC:
      return goal.targetValue ? goal.currentValue >= goal.targetValue : false;
    case GoalType.BINARY:
      return goal.status === GoalStatus.COMPLETED;
    case GoalType.MILESTONE:
      return goal.status === GoalStatus.COMPLETED;
    case GoalType.HABIT:
      // For habits, consider completed if status is completed
      return goal.status === GoalStatus.COMPLETED;
    default:
      return goal.status === GoalStatus.COMPLETED;
    }
  }

  private static mapRowToGoal(row: any): Goal {
    return {
      id: row.id,
      userId: row.user_id,
      lifeAreaId: row.life_area_id,
      parentGoalId: row.parent_goal_id,
      title: row.title,
      description: row.description,
      goalType: row.goal_type,
      targetValue: row.target_value ? parseFloat(row.target_value) : null,
      currentValue: row.current_value ? parseFloat(row.current_value) : 0,
      targetUnit: row.target_unit,
      deadline: row.deadline ? new Date(row.deadline) : null,
      priority: parseInt(row.priority),
      status: row.status,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      reminderConfig: row.reminder_config ? JSON.parse(row.reminder_config) : {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}