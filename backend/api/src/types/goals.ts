// Goals TypeScript Interfaces
export enum GoalType {
  NUMERIC = 'numeric',
  HABIT = 'habit',
  MILESTONE = 'milestone',
  BINARY = 'binary',
  CUSTOM = 'custom',
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived',
}

export enum DataSource {
  MANUAL = 'manual',
  APPLE_HEALTH = 'apple_health',
  APPLE_CALENDAR = 'apple_calendar',
  APPLE_REMINDERS = 'apple_reminders',
  API_INTEGRATION = 'api_integration',
  AI_AUTOMATION = 'ai_automation',
  FILE_IMPORT = 'file_import',
}

export interface Goal {
  id: string;
  userId: string;
  lifeAreaId: string;
  parentGoalId?: string;
  title: string;
  description: string | null;
  goalType: GoalType;
  targetValue: number | null;
  currentValue: number;
  targetUnit: string | null;
  deadline: Date | null;
  priority: number;
  status: GoalStatus;
  metadata: Record<string, any>;
  reminderConfig: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGoalRequest {
  lifeAreaId: string;
  parentGoalId?: string;
  title: string;
  description?: string;
  goalType: GoalType;
  targetValue?: number;
  targetUnit?: string;
  deadline?: string;
  priority?: number;
  metadata?: Record<string, any>;
  reminderConfig?: Record<string, any>;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  targetUnit?: string;
  deadline?: string;
  priority?: number;
  status?: GoalStatus;
  metadata?: Record<string, any>;
  reminderConfig?: Record<string, any>;
}

export interface ProgressEntry {
  id: string;
  goalId: string;
  userId: string;
  entryDate: Date;
  value: number | null;
  notes: string | null;
  dataSource: DataSource;
  metadata: Record<string, any>;
  attachments: Array<Record<string, any>>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProgressEntryRequest {
  goalId: string;
  userId: string;
  entryDate: string;
  value?: number;
  notes?: string;
  dataSource?: DataSource;
  metadata?: Record<string, any>;
  attachments?: Array<Record<string, any>>;
}

export interface UpdateProgressEntryRequest {
  value?: number;
  notes?: string;
  dataSource?: DataSource;
  metadata?: Record<string, any>;
  attachments?: Array<Record<string, any>>;
}

export interface GoalFilters {
  lifeAreaId?: string;
  status?: GoalStatus;
  goalType?: GoalType;
  parentGoalId?: string;
  hasDeadline?: boolean;
}

export interface GoalWithProgress extends Goal {
  progressEntries?: ProgressEntry[];
  progressPercentage: number;
  streak?: number;
  lastUpdated?: Date;
}