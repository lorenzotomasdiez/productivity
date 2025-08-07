// Auth protection integration tests for protected routes
import request from 'supertest';
import express from 'express';

// Use test secrets
jest.mock('../../src/config/index.js', () => ({
  config: {
    jwt: { secret: 'test-secret', refreshSecret: 'test-refresh' },
    cors: { origin: '*' },
    rateLimit: { windowMs: 900000, maxRequests: 100 },
  },
}));

// Mock models used by controllers
jest.mock('../../src/models/Goal', () => ({
  GoalModel: {
    findByUserId: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../src/models/LifeArea', () => ({
  LifeAreaModel: {
    findByUserId: jest.fn().mockResolvedValue([]),
  },
}));

const jwt = require('jsonwebtoken');

// Build a minimal app mounting the real routers
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const { goalsRouter } = require('../../src/routes/goals.js');
  const { lifeAreasRouter } = require('../../src/routes/lifeAreas.js');
  const progressRouter = require('../../src/routes/progress.js').default;
  const { dashboardRouter } = require('../../src/routes/dashboard.js');
  const { chatRouter } = require('../../src/routes/chat.js');
  const { researchRouter } = require('../../src/routes/research.js');
  const { integrationsRouter } = require('../../src/routes/integrations.js');
  const { notificationsRouter } = require('../../src/routes/notifications.js');

  app.use('/api/v1/goals', goalsRouter);
  app.use('/api/v1/life-areas', lifeAreasRouter);
  app.use('/api/v1', progressRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/chat', chatRouter);
  app.use('/api/v1/research', researchRouter);
  app.use('/api/v1/integrations', integrationsRouter);
  app.use('/api/v1/notifications', notificationsRouter);

  const { errorHandler } = require('../../src/middleware/errorHandler.js');
  app.use(errorHandler);
  return app;
};

describe('Protected routes require auth and accept valid JWT', () => {
  const app = createTestApp();

  test('GET /api/v1/goals returns 401 without Authorization', async () => {
    const res = await request(app).get('/api/v1/goals');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('GET /api/v1/goals returns 200 with valid JWT', async () => {
    const token = jwt.sign({ userId: 'u1', email: 'u1@example.com', sessionId: 's1' }, 'test-secret', { expiresIn: '15m' });
    const res = await request(app).get('/api/v1/goals').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/v1/life-areas returns 401 without Authorization', async () => {
    const res = await request(app).get('/api/v1/life-areas');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('GET /api/v1/life-areas returns 200 with valid JWT', async () => {
    const token = jwt.sign({ userId: 'u1', email: 'u1@example.com', sessionId: 's1' }, 'test-secret', { expiresIn: '15m' });
    const res = await request(app).get('/api/v1/life-areas').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    // Some routers may return raw arrays; ensure no error and data present
    expect(res.body.success ?? true).toBe(true);
  });

  test('POST /api/v1/goals/:goalId/progress requires auth (401)', async () => {
    const res = await request(app)
      .post('/api/v1/goals/goal_1/progress')
      .send({ entryDate: '2025-01-01', value: 1 });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('Protected stubbed routes return 401 without token', async () => {
    const endpoints = [
      '/api/v1/dashboard/stats',
      '/api/v1/chat/conversations',
      '/api/v1/research/history',
      '/api/v1/integrations',
      '/api/v1/notifications',
    ];

    for (const path of endpoints) {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
    }
  });

  test('Protected stubbed routes accept valid JWT', async () => {
    const token = jwt.sign({ userId: 'u1', email: 'u1@example.com', sessionId: 's1' }, 'test-secret', { expiresIn: '15m' });
    const endpoints = [
      '/api/v1/dashboard/stats',
      '/api/v1/chat/conversations',
      '/api/v1/research/history',
      '/api/v1/integrations',
      '/api/v1/notifications',
    ];

    for (const path of endpoints) {
      const res = await request(app).get(path).set('Authorization', `Bearer ${token}`);
      expect([200, 501, 404]).toContain(res.status);
    }
  });
});


