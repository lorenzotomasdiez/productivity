import Joi from 'joi';
import {
  lifeAreaSchemas,
  goalSchemas,
  progressSchemas,
  dashboardSchemas,
  authSchemas,
  chatSchemas,
  researchSchemas,
  integrationSchemas,
  notificationSchemas
} from '../../src/validation/schemas.js';

describe('Validation Schemas', () => {
  describe('Life Area Schemas', () => {
    describe('create', () => {
      it('should validate valid create life area data', () => {
        const validData = {
          name: 'Health & Fitness',
          type: 'health',
          description: 'Physical and mental wellbeing',
          icon: 'heart.fill',
          color: '#FF6B6B',
          configuration: { tracking_methods: ['workouts', 'weight'] },
          sort_order: 1
        };

        const { error } = lifeAreaSchemas.create.body.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should fail validation with missing required fields', () => {
        const invalidData = {
          description: 'Physical and mental wellbeing'
          // Missing name and type
        };

        const { error } = lifeAreaSchemas.create.body.validate(invalidData);
        expect(error).toBeDefined();
        // Joi stops at first error by default, so we expect only one error
        expect(error?.details).toHaveLength(1);
        expect(error?.details?.some(d => d.path.includes('name'))).toBe(true);
      });

      it('should fail validation with invalid type', () => {
        const invalidData = {
          name: 'Health & Fitness',
          type: 'invalid_type'
        };

        const { error } = lifeAreaSchemas.create.body.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('type'))).toBe(true);
      });

      it('should fail validation with invalid hex color', () => {
        const invalidData = {
          name: 'Health & Fitness',
          type: 'health',
          color: 'invalid-color'
        };

        const { error } = lifeAreaSchemas.create.body.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('color'))).toBe(true);
      });
    });

    describe('update', () => {
      it('should validate valid update data', () => {
        const validData = {
          name: 'Updated Health & Fitness',
          isActive: false
        };

        const { error } = lifeAreaSchemas.update.body.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should allow partial updates', () => {
        const validData = {
          name: 'Updated Name'
        };

        const { error } = lifeAreaSchemas.update.body.validate(validData);
        expect(error).toBeUndefined();
      });
    });

    describe('reorder', () => {
      it('should validate valid reorder data', () => {
        const validData = {
          lifeAreaOrders: [
            { id: '123e4567-e89b-12d3-a456-426614174000', sortOrder: 0 },
            { id: '123e4567-e89b-12d3-a456-426614174001', sortOrder: 1 }
          ]
        };

        const { error } = lifeAreaSchemas.reorder.body.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should fail validation with empty array', () => {
        const invalidData = {
          lifeAreaOrders: []
        };

        const { error } = lifeAreaSchemas.reorder.body.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('lifeAreaOrders'))).toBe(true);
      });
    });
  });

  describe('Goal Schemas', () => {
    describe('create', () => {
      it('should validate valid numeric goal data', () => {
        const validData = {
          lifeAreaId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Read 24 books this year',
          goalType: 'numeric',
          targetValue: 24,
          targetUnit: 'books',
          deadline: '2025-12-31',
          priority: 4
        };

        const { error } = goalSchemas.create.body.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should validate valid habit goal data', () => {
        const validData = {
          lifeAreaId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Exercise daily',
          goalType: 'habit'
        };

        const { error } = goalSchemas.create.body.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should fail validation for numeric goal without target value', () => {
        const invalidData = {
          lifeAreaId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Read books this year',
          goalType: 'numeric'
          // Missing targetValue and targetUnit
        };

        const { error } = goalSchemas.create.body.validate(invalidData);
        expect(error).toBeDefined();
        // Joi stops at first error by default
        expect(error?.details?.some(d => d.path.includes('targetValue'))).toBe(true);
      });

      it('should fail validation for numeric goal without target unit', () => {
        const invalidData = {
          lifeAreaId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Read books this year',
          goalType: 'numeric',
          targetValue: 24
          // Missing targetUnit
        };

        const { error } = goalSchemas.create.body.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('targetUnit'))).toBe(true);
      });

      it('should fail validation with past deadline', () => {
        const invalidData = {
          lifeAreaId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Read books this year',
          goalType: 'numeric',
          targetValue: 24,
          targetUnit: 'books',
          deadline: '2020-12-31' // Past date
        };

        const { error } = goalSchemas.create.body.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('deadline'))).toBe(true);
      });

      it('should fail validation with invalid priority', () => {
        const invalidData = {
          lifeAreaId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Read books this year',
          goalType: 'numeric',
          targetValue: 24,
          targetUnit: 'books',
          priority: 6 // Invalid priority
        };

        const { error } = goalSchemas.create.body.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('priority'))).toBe(true);
      });
    });

    describe('list', () => {
      it('should validate valid query parameters', () => {
        const validQuery = {
          limit: 10,
          page: 2,
          lifeAreaId: '123e4567-e89b-12d3-a456-426614174000',
          status: 'active',
          goalType: 'numeric'
        };

        const { error } = goalSchemas.list.query.validate(validQuery);
        expect(error).toBeUndefined();
      });

      it('should use default pagination values', () => {
        const query = {};

        const { value } = goalSchemas.list.query.validate(query);
        expect(value.limit).toBe(20);
        expect(value.page).toBe(1);
      });
    });
  });

  describe('Progress Entry Schemas', () => {
    describe('create', () => {
      it('should validate valid progress entry data', () => {
        const validData = {
          entryDate: '2025-08-18',
          value: 1,
          notes: 'Finished reading a book',
          metadata: { book_title: 'Atomic Habits' },
          attachments: [
            {
              type: 'document',
              url: 'https://example.com/book.pdf',
              name: 'Book Summary'
            }
          ]
        };

        const { error } = progressSchemas.create.body.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should fail validation with future entry date', () => {
        const invalidData = {
          entryDate: '2026-08-18', // Future date
          value: 1
        };

        const { error } = progressSchemas.create.body.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('entryDate'))).toBe(true);
      });

      it('should fail validation with invalid attachment type', () => {
        const invalidData = {
          entryDate: '2025-08-18',
          attachments: [
            {
              type: 'invalid_type',
              url: 'https://example.com/file.txt'
            }
          ]
        };

        const { error } = progressSchemas.create.body.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('attachments'))).toBe(true);
      });

      it('should fail validation with invalid URL', () => {
        const invalidData = {
          entryDate: '2025-08-18',
          attachments: [
            {
              type: 'document',
              url: 'not-a-url'
            }
          ]
        };

        const { error } = progressSchemas.create.body.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('attachments'))).toBe(true);
      });
    });
  });

  describe('Dashboard Schemas', () => {
    describe('getStats', () => {
      it('should validate valid time range', () => {
        const validQuery = { timeRange: 'month' };

        const { error } = dashboardSchemas.getStats.query.validate(validQuery);
        expect(error).toBeUndefined();
      });

      it('should use default time range', () => {
        const query = {};

        const { value } = dashboardSchemas.getStats.query.validate(query);
        expect(value.timeRange).toBe('week');
      });

      it('should fail validation with invalid time range', () => {
        const invalidQuery = { time_range: 'invalid' };

        const { error } = dashboardSchemas.getStats.query.validate(invalidQuery);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('time_range'))).toBe(true);
      });
    });

    describe('updateWidgets', () => {
      it('should validate valid widget configuration', () => {
        const validData = {
          widgets: [
            {
              id: 'widget1',
              type: 'chart',
              position: { x: 0, y: 0 },
              config: { chart_type: 'line' }
            }
          ]
        };

        const { error } = dashboardSchemas.updateWidgets.body.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should fail validation with missing required widget fields', () => {
        const invalidData = {
          widgets: [
            {
              id: 'widget1'
              // Missing type and position
            }
          ]
        };

        const { error } = dashboardSchemas.updateWidgets.body.validate(invalidData);
        expect(error).toBeDefined();
        // Joi stops at first error by default
        expect(error?.details?.some(d => d.path.includes('type'))).toBe(true);
      });
    });
  });

  describe('Auth Schemas', () => {
    describe('appleSignIn', () => {
      it('should validate valid Apple Sign In data', () => {
        const validData = {
          identityToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
          authorizationCode: 'c1234567890abcdef...',
          user: {
            name: {
              firstName: 'Lorenzo',
              lastName: 'Tomas'
            },
            email: 'lorenzo@example.com'
          },
          deviceInfo: {
            deviceId: 'iPhone14,2',
            deviceName: 'Lorenzo\'s iPhone'
          }
        };

        const { error } = authSchemas.appleSignIn.body.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should fail validation with missing required fields', () => {
        const invalidData = {
          user: {
            name: 'Lorenzo Tomas'
          }
          // Missing identityToken and authorizationCode
        };

        const { error } = authSchemas.appleSignIn.body.validate(invalidData);
        expect(error).toBeDefined();
        // Joi stops at first error by default
        expect(error?.details).toHaveLength(1);
        expect(error?.details?.some(d => d.path.includes('identityToken'))).toBe(true);
      });
    });

    describe('refresh', () => {
      it('should validate valid refresh token data', () => {
        const validData = {
          refreshToken: 'rt_1234567890abcdef...'
        };

        const { error } = authSchemas.refresh.body.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should fail validation with empty refresh token', () => {
        const invalidData = {
          refreshToken: ''
        };

        const { error } = authSchemas.refresh.body.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('refreshToken'))).toBe(true);
      });
    });
  });

  describe('Chat Schemas', () => {
    describe('createConversation', () => {
      it('should validate valid conversation data', () => {
        const validData = {
          title: 'Weekly Progress Review',
          initialMessage: 'Hey Jarvis, how am I doing with my goals this week?',
          contextPreference: {
            includeGoals: true,
            includeRecentProgress: true,
            includeLifeAreas: false,
            timeRangeDays: 14
          }
        };

        const { error } = chatSchemas.createConversation.body.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should use default context preferences', () => {
        const data = {
          title: 'Weekly Progress Review'
        };

        const { value } = chatSchemas.createConversation.body.validate(data);
        expect(value.contextPreference.includeGoals).toBe(true);
        expect(value.contextPreference.includeRecentProgress).toBe(true);
        expect(value.contextPreference.includeLifeAreas).toBe(true);
        expect(value.contextPreference.timeRangeDays).toBe(7);
      });
    });

    describe('sendMessage', () => {
      it('should validate valid message data', () => {
        const validData = {
          content: 'How can I improve my workout consistency?',
          includeContext: false
        };

        const { error } = chatSchemas.sendMessage.body.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should fail validation with empty content', () => {
        const invalidData = {
          content: ''
        };

        const { error } = chatSchemas.sendMessage.body.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('content'))).toBe(true);
      });

      it('should fail validation with content too long', () => {
        const invalidData = {
          content: 'a'.repeat(2001) // Too long
        };

        const { error } = chatSchemas.sendMessage.body.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('content'))).toBe(true);
      });
    });
  });

  describe('Research Schemas', () => {
    describe('createCategory', () => {
      it('should validate valid research category data', () => {
        const validData = {
          name: 'Investment Opportunities',
          description: 'Research on investment opportunities in various sectors',
          researchPrompt: 'Research the latest investment opportunities in technology stocks and ETFs, focusing on AI and semiconductor sectors. Include risk analysis and growth potential.',
          scheduleConfig: {
            frequency: 'weekly',
            dayOfWeek: 'monday',
            time: '09:00'
          },
          targetLifeAreas: ['123e4567-e89b-12d3-a456-426614174000']
        };

        const { error } = researchSchemas.createCategory.body.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should fail validation with research prompt too short', () => {
        const invalidData = {
          name: 'Investment Opportunities',
          researchPrompt: 'Too short' // Less than 10 characters
        };

        const { error } = researchSchemas.createCategory.body.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('researchPrompt'))).toBe(true);
      });

      it('should fail validation with invalid time format', () => {
        const invalidData = {
          name: 'Investment Opportunities',
          researchPrompt: 'Research the latest investment opportunities...',
          scheduleConfig: {
            frequency: 'weekly',
            time: '25:00' // Invalid time
          }
        };

        const { error } = researchSchemas.createCategory.body.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('time'))).toBe(true);
      });
    });
  });

  describe('Integration Schemas', () => {
    describe('connect', () => {
      it('should validate valid integration connection data', () => {
        const validData = {
          connectionData: {
            api_key: 'sk-1234567890abcdef',
            workspace_id: 'workspace123'
          },
          syncConfig: {
            syncFrequency: 'daily',
            dataTypes: ['workouts', 'weight', 'sleep']
          }
        };

        const { error } = integrationSchemas.connect.body.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should fail validation with missing connection data', () => {
        const invalidData = {
          syncConfig: {
            syncFrequency: 'daily'
          }
          // Missing connectionData
        };

        const { error } = integrationSchemas.connect.body.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('connectionData'))).toBe(true);
      });
    });

    describe('sync', () => {
      it('should validate valid provider parameter', () => {
        const validParams = {
          provider: 'apple_health'
        };

        const { error } = integrationSchemas.sync.params.validate(validParams);
        expect(error).toBeUndefined();
      });

      it('should fail validation with invalid provider', () => {
        const invalidParams = {
          provider: 'invalid_provider'
        };

        const { error } = integrationSchemas.sync.params.validate(invalidParams);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('provider'))).toBe(true);
      });
    });
  });

  describe('Notification Schemas', () => {
    describe('list', () => {
      it('should validate valid notification list query', () => {
        const validQuery = {
          limit: 25,
          page: 1,
          isRead: false,
          notificationType: 'reminder'
        };

        const { error } = notificationSchemas.list.query.validate(validQuery);
        expect(error).toBeUndefined();
      });

      it('should use default pagination values', () => {
        const query = {};

        const { value } = notificationSchemas.list.query.validate(query);
        expect(value.limit).toBe(20);
        expect(value.page).toBe(1);
      });
    });

    describe('markAsRead', () => {
      it('should validate valid notification ID parameter', () => {
        const validParams = {
          id: '123e4567-e89b-12d3-a456-426614174000'
        };

        const { error } = notificationSchemas.markAsRead.params.validate(validParams);
        expect(error).toBeUndefined();
      });

      it('should fail validation with invalid UUID', () => {
        const invalidParams = {
          id: 'invalid-uuid'
        };

        const { error } = notificationSchemas.markAsRead.params.validate(invalidParams);
        expect(error).toBeDefined();
        expect(error?.details?.some(d => d.path.includes('id'))).toBe(true);
      });
    });
  });
});
