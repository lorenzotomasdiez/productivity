// LifeArea Model with TypeScript and Database Integration
import { query } from '../config/database.js';
import { LifeArea, CreateLifeAreaRequest, UpdateLifeAreaRequest, LifeAreaFilters } from '../types/lifeAreas.js';
import { v4 as uuidv4 } from 'uuid';

export class LifeAreaModel {
  static async create(userId: string, lifeAreaData: CreateLifeAreaRequest): Promise<LifeArea> {
    // Validation
    if (!lifeAreaData.name || lifeAreaData.name.trim().length === 0) {
      throw new Error('Life area name is required');
    }

    const lifeAreaId = uuidv4();
    const now = new Date();

    const queryText = `
      INSERT INTO life_areas (
        id, user_id, name, type, description, icon, color, 
        configuration, sort_order, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      lifeAreaId,
      userId,
      lifeAreaData.name.trim(),
      lifeAreaData.type,
      lifeAreaData.description || null,
      lifeAreaData.icon || null,
      lifeAreaData.color || null,
      lifeAreaData.configuration ? JSON.stringify(lifeAreaData.configuration) : '{}',
      lifeAreaData.sortOrder || 0,
      now,
      now,
    ];

    const result = await query(queryText, values);
    const row = result.rows[0];

    return this.mapRowToLifeArea(row);
  }

  static async findByUserId(userId: string, filters?: LifeAreaFilters): Promise<LifeArea[]> {
    let queryText = 'SELECT * FROM life_areas WHERE user_id = $1';
    const values: any[] = [userId];
    let paramIndex = 2;

    if (filters?.isActive !== undefined) {
      queryText += ` AND is_active = $${paramIndex}`;
      values.push(filters.isActive);
      paramIndex++;
    }

    if (filters?.type !== undefined) {
      queryText += ` AND type = $${paramIndex}`;
      values.push(filters.type);
      paramIndex++;
    }

    queryText += ' ORDER BY sort_order ASC, created_at ASC';

    const result = await query(queryText, values);
    return result.rows.map(row => this.mapRowToLifeArea(row));
  }

  static async findById(id: string): Promise<LifeArea | null> {
    const queryText = 'SELECT * FROM life_areas WHERE id = $1';
    const result = await query(queryText, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToLifeArea(result.rows[0]);
  }

  static async update(id: string, updates: UpdateLifeAreaRequest): Promise<LifeArea | null> {
    const now = new Date();
    const setClause: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    if (updates.name !== undefined) {
      if (updates.name.trim().length === 0) {
        throw new Error('Life area name cannot be empty');
      }
      setClause.push(`name = $${valueIndex++}`);
      values.push(updates.name.trim());
    }

    if (updates.description !== undefined) {
      setClause.push(`description = $${valueIndex++}`);
      values.push(updates.description || null);
    }

    if (updates.icon !== undefined) {
      setClause.push(`icon = $${valueIndex++}`);
      values.push(updates.icon || null);
    }

    if (updates.color !== undefined) {
      setClause.push(`color = $${valueIndex++}`);
      values.push(updates.color || null);
    }

    if (updates.configuration !== undefined) {
      setClause.push(`configuration = $${valueIndex++}`);
      values.push(updates.configuration ? JSON.stringify(updates.configuration) : '{}');
    }

    if (updates.isActive !== undefined) {
      setClause.push(`is_active = $${valueIndex++}`);
      values.push(updates.isActive);
    }

    if (updates.sortOrder !== undefined) {
      setClause.push(`sort_order = $${valueIndex++}`);
      values.push(updates.sortOrder);
    }

    if (setClause.length === 0) {
      return this.findById(id);
    }

    setClause.push(`updated_at = $${valueIndex++}`);
    values.push(now);
    values.push(id);

    const queryText = `
      UPDATE life_areas 
      SET ${setClause.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    const result = await query(queryText, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToLifeArea(result.rows[0]);
  }

  static async delete(id: string): Promise<boolean> {
    const queryText = 'DELETE FROM life_areas WHERE id = $1';
    const result = await query(queryText, [id]);
    return (result.rowCount || 0) > 0;
  }

  static async reorder(userId: string, lifeAreaIds: string[]): Promise<LifeArea[]> {
    // Update sort order for all provided life areas
    const promises = lifeAreaIds.map((id, index) => 
      this.update(id, { sortOrder: index }),
    );

    await Promise.all(promises);
    return this.findByUserId(userId);
  }

  private static mapRowToLifeArea(row: any): LifeArea {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type,
      description: row.description,
      icon: row.icon,
      color: row.color,
      configuration: row.configuration ? JSON.parse(row.configuration) : {},
      isActive: row.is_active,
      sortOrder: row.sort_order,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}