// Life Areas TypeScript Interfaces
export enum LifeAreaType {
  HEALTH = 'health',
  FINANCE = 'finance',
  LEARNING = 'learning',
  WORK = 'work',
  GOALS = 'goals',
  PRODUCTIVITY = 'productivity',
  RELATIONSHIPS = 'relationships',
  HOBBIES = 'hobbies',
  PERSONAL_GROWTH = 'personal_growth',
  CUSTOM = 'custom'
}

export interface LifeArea {
  id: string;
  userId: string;
  name: string;
  type: LifeAreaType;
  description?: string;
  icon?: string;
  color?: string;
  configuration?: Record<string, any>;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLifeAreaRequest {
  name: string;
  type: LifeAreaType;
  description?: string;
  icon?: string;
  color?: string;
  configuration?: Record<string, any>;
  sortOrder?: number;
}

export interface UpdateLifeAreaRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  configuration?: Record<string, any>;
  isActive?: boolean;
  sortOrder?: number;
}

export interface LifeAreaFilters {
  isActive?: boolean;
  type?: LifeAreaType;
}