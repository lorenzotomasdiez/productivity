import request from 'supertest';
import express from 'express';
import Joi from 'joi';
import { validateRequest } from '../../src/middleware/validation.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

const app = express();
app.use(express.json());

// Test schemas
const testBodySchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(18).max(120)
});

const testQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  page: Joi.number().integer().min(1).default(1),
  search: Joi.string().optional()
});

const testParamsSchema = Joi.object({
  id: Joi.string().uuid().required()
});

// Test routes
app.post('/test-body', 
  validateRequest({ body: testBodySchema }),
  (req, res) => res.json({ success: true, data: req.body })
);

app.get('/test-query',
  validateRequest({ query: testQuerySchema }),
  (req, res) => res.json({ success: true, data: req.query })
);

app.get('/test-params/:id',
  validateRequest({ params: testParamsSchema }),
  (req, res) => res.json({ success: true, data: req.params })
);

app.post('/test-all/:id',
  validateRequest({
    body: testBodySchema,
    query: testQuerySchema,
    params: testParamsSchema
  }),
  (req, res) => res.json({ success: true, data: { body: req.body, query: req.query, params: req.params } })
);

// Error handling
app.use(errorHandler);

describe('Validation Middleware', () => {
  describe('Body Validation', () => {
    it('should pass validation with valid body', async () => {
      const response = await request(app)
        .post('/test-body')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          age: 25
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('John Doe');
    });

    it('should fail validation with missing required fields', async () => {
      const response = await request(app)
        .post('/test-body')
        .send({
          name: 'John Doe'
          // Missing email
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.field_errors).toHaveLength(1);
      expect(response.body.error.details.field_errors[0].field).toBe('email');
    });

    it('should fail validation with invalid email format', async () => {
      const response = await request(app)
        .post('/test-body')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          age: 25
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.field_errors).toHaveLength(1);
      expect(response.body.error.details.field_errors[0].field).toBe('email');
    });

    it('should fail validation with invalid age range', async () => {
      const response = await request(app)
        .post('/test-body')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          age: 150 // Too high
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.field_errors).toHaveLength(1);
      expect(response.body.error.details.field_errors[0].field).toBe('age');
    });

    it('should strip unknown fields', async () => {
      const response = await request(app)
        .post('/test-body')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          age: 25,
          unknownField: 'should be stripped'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.unknownField).toBeUndefined();
    });
  });

  describe('Query Validation', () => {
    it('should pass validation with valid query parameters', async () => {
      const response = await request(app)
        .get('/test-query?limit=10&page=2&search=test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.limit).toBe(10);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.search).toBe('test');
    });

    it('should use default values for missing query parameters', async () => {
      const response = await request(app)
        .get('/test-query');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.limit).toBe(20);
      expect(response.body.data.page).toBe(1);
    });

    it('should fail validation with invalid limit', async () => {
      const response = await request(app)
        .get('/test-query?limit=150'); // Too high

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.field_errors).toHaveLength(1);
      expect(response.body.error.details.field_errors[0].field).toBe('limit');
    });

    it('should fail validation with invalid page', async () => {
      const response = await request(app)
        .get('/test-query?page=0'); // Too low

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.field_errors).toHaveLength(1);
      expect(response.body.error.details.field_errors[0].field).toBe('page');
    });
  });

  describe('Params Validation', () => {
    it('should pass validation with valid UUID', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/test-params/${validUuid}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(validUuid);
    });

    it('should fail validation with invalid UUID', async () => {
      const response = await request(app)
        .get('/test-params/invalid-uuid');

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.field_errors).toHaveLength(1);
      expect(response.body.error.details.field_errors[0].field).toBe('id');
    });

    it('should fail validation with missing UUID', async () => {
      const response = await request(app)
        .get('/test-params/');

      expect(response.status).toBe(404);
    });
  });

  describe('Multiple Validation Types', () => {
    it('should validate body, query, and params together', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .post(`/test-all/${validUuid}?limit=15&page=3`)
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          age: 30
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.body.name).toBe('Jane Doe');
      expect(response.body.data.query.limit).toBe(15);
      expect(response.body.data.params.id).toBe(validUuid);
    });

    it('should fail if any validation fails', async () => {
      const response = await request(app)
        .post('/test-all/invalid-uuid?limit=150')
        .send({
          name: 'Jane Doe'
          // Missing email
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Error Response Format', () => {
    it('should return properly formatted validation errors', async () => {
      const response = await request(app)
        .post('/test-body')
        .send({
          name: 'Jo', // Too short
          email: 'invalid-email',
          age: 15 // Too young
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Request validation failed');
      expect(response.body.error.details.field_errors).toHaveLength(3);
      
      // Check that all field errors are present
      const fields = response.body.error.details.field_errors.map((e: any) => e.field);
      expect(fields).toContain('name');
      expect(fields).toContain('email');
      expect(fields).toContain('age');
    });

    it('should include field error details', async () => {
      const response = await request(app)
        .post('/test-body')
        .send({
          name: 'Jo' // Too short
        });

      expect(response.status).toBe(422);
      expect(response.body.error.details.field_errors[0]).toHaveProperty('field');
      expect(response.body.error.details.field_errors[0]).toHaveProperty('message');
      expect(response.body.error.details.field_errors[0]).toHaveProperty('type');
    });

    it('should return 422 status code for all validation errors', async () => {
      // Test body validation
      const bodyResponse = await request(app)
        .post('/test-body')
        .send({
          name: 'Jo' // Too short
        });

      expect(bodyResponse.status).toBe(422);
      expect(bodyResponse.body.error.code).toBe('VALIDATION_ERROR');

      // Test query validation
      const queryResponse = await request(app)
        .get('/test-query?limit=150');

      expect(queryResponse.status).toBe(422);
      expect(queryResponse.body.error.code).toBe('VALIDATION_ERROR');

      // Test params validation
      const paramsResponse = await request(app)
        .get('/test-params/invalid-uuid');

      expect(paramsResponse.status).toBe(422);
      expect(paramsResponse.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
