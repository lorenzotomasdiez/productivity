// ProgressEntry Model with TypeScript and Database Integration
import { query } from '../config/database';
import { ProgressEntry, CreateProgressEntryRequest, UpdateProgressEntryRequest, DataSource } from '../types/goals';
import { v4 as uuidv4 } from 'uuid';

export class ProgressEntryModel {
  static async create(progressData: CreateProgressEntryRequest): Promise<ProgressEntry> {
    // Validation
    if (!progressData.goalId) {
      throw new Error('Goal ID is required');
    }

    if (!progressData.userId) {
      throw new Error('User ID is required');
    }

    if (!progressData.entryDate) {
      throw new Error('Entry date is required');
    }

    const entryId = uuidv4();
    const now = new Date();

    const queryText = `
      INSERT INTO progress_entries (
        id, goal_id, user_id, entry_date, value, notes, 
        data_source, metadata, attachments, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      entryId,
      progressData.goalId,
      progressData.userId,
      new Date(progressData.entryDate),
      progressData.value || null,
      progressData.notes || null,
      progressData.dataSource || DataSource.MANUAL,
      progressData.metadata ? JSON.stringify(progressData.metadata) : '{}',
      progressData.attachments ? JSON.stringify(progressData.attachments) : '[]',
      now,
      now,
    ];

    const result = await query(queryText, values);
    const row = result.rows[0];

    return this.mapRowToProgressEntry(row);
  }

  static async findByGoalId(goalId: string): Promise<ProgressEntry[]> {
    const queryText = 'SELECT * FROM progress_entries WHERE goal_id = $1 ORDER BY entry_date DESC';
    const result = await query(queryText, [goalId]);
    return result.rows.map(row => this.mapRowToProgressEntry(row));
  }

  static async findById(id: string): Promise<ProgressEntry | null> {
    const queryText = 'SELECT * FROM progress_entries WHERE id = $1';
    const result = await query(queryText, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProgressEntry(result.rows[0]);
  }

  static async update(id: string, updates: UpdateProgressEntryRequest): Promise<ProgressEntry | null> {
    const now = new Date();
    const setClause: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    if (updates.value !== undefined) {
      setClause.push(`value = $${valueIndex++}`);
      values.push(updates.value);
    }

    if (updates.notes !== undefined) {
      setClause.push(`notes = $${valueIndex++}`);
      values.push(updates.notes);
    }

    if (updates.dataSource !== undefined) {
      setClause.push(`data_source = $${valueIndex++}`);
      values.push(updates.dataSource);
    }

    if (updates.metadata !== undefined) {
      setClause.push(`metadata = $${valueIndex++}`);
      values.push(updates.metadata ? JSON.stringify(updates.metadata) : '{}');
    }

    if (updates.attachments !== undefined) {
      setClause.push(`attachments = $${valueIndex++}`);
      values.push(updates.attachments ? JSON.stringify(updates.attachments) : '[]');
    }

    if (setClause.length === 0) {
      return this.findById(id);
    }

    setClause.push(`updated_at = $${valueIndex++}`);
    values.push(now);
    values.push(id);

    const queryText = `
      UPDATE progress_entries 
      SET ${setClause.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    const result = await query(queryText, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProgressEntry(result.rows[0]);
  }

  static async delete(id: string): Promise<boolean> {
    const queryText = 'DELETE FROM progress_entries WHERE id = $1';
    const result = await query(queryText, [id]);
    return (result.rowCount || 0) > 0;
  }

  static async findByUserId(userId: string): Promise<ProgressEntry[]> {
    const queryText = 'SELECT * FROM progress_entries WHERE user_id = $1 ORDER BY entry_date DESC';
    const result = await query(queryText, [userId]);
    return result.rows.map(row => this.mapRowToProgressEntry(row));
  }

  private static mapRowToProgressEntry(row: any): ProgressEntry {
    return {
      id: row.id,
      goalId: row.goal_id,
      userId: row.user_id,
      entryDate: new Date(row.entry_date),
      value: row.value ? parseFloat(row.value) : null,
      notes: row.notes,
      dataSource: row.data_source,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      attachments: row.attachments ? JSON.parse(row.attachments) : [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
