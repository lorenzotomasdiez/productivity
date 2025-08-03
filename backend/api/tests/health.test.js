import request from 'supertest';
import { app } from './testApp.js';

describe('Health Check Endpoint', () => {
  test('GET /health should return healthy status', async () => {
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

  test('health check should include correct environment', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.data.environment).toBe('test');
  });
});