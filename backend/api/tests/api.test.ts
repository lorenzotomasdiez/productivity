import request from 'supertest';
import express from 'express';

// Simple Express app for testing
const createTestApp = (): express.Application => {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: 'test',
        uptime: process.uptime(),
      },
    });
  });

  return app;
};

describe('API Health Check', () => {
  const app = createTestApp();

  test('GET /health should return healthy status', async() => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        status: 'healthy',
        timestamp: expect.any(String),
        version: expect.any(String),
        environment: expect.any(String),
        uptime: expect.any(Number),
      }),
    });
  });

  test('health check should include correct environment', async() => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.data.environment).toBe('test');
  });
});