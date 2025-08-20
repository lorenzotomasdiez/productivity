import request from 'supertest';
import express from 'express';
import { errorHandler, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, UnprocessableEntityError } from '../../src/middleware/errorHandler.js';
import { logger } from '../../src/config/logger.js';

// Mock logger
jest.mock('../../src/config/logger.js');
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('ErrorHandler Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Add request ID middleware
    app.use((req, res, next) => {
      req.id = 'test-request-id';
      next();
    });

    // Route that throws errors for testing
    app.get('/test-error', (req, res, next) => {
      const errorType = req.query.type as string;
      const errorMessage = req.query.message as string;
      
      switch (errorType) {
        case 'validation':
          next(new ValidationError(errorMessage || 'Validation failed', { field: 'test' }));
          break;
        case 'unauthorized':
          next(new UnauthorizedError(errorMessage || 'Unauthorized'));
          break;
        case 'forbidden':
          next(new ForbiddenError(errorMessage || 'Forbidden'));
          break;
        case 'notfound':
          next(new NotFoundError(errorMessage || 'Not found'));
          break;
        case 'conflict':
          next(new ConflictError(errorMessage || 'Conflict'));
          break;
        case 'unprocessable':
          next(new UnprocessableEntityError(errorMessage || 'Unprocessable', { field: 'test' }));
          break;
        case 'database':
          const dbError = new Error('Database error') as any;
          dbError.code = req.query.code as string;
          next(dbError);
          break;
        case 'jwt':
          const jwtError = new Error('JWT error') as any;
          jwtError.name = req.query.name as string;
          next(jwtError);
          break;
        case 'generic':
          next(new Error(errorMessage || 'Generic error'));
          break;
        default:
          next(new Error('Unknown error'));
      }
    });

    app.use(errorHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Custom Error Classes', () => {
    test('ValidationError should have correct properties', () => {
      const error = new ValidationError('Test message', { field: 'test' });
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test message');
      expect(error.details).toEqual({ field: 'test' });
    });

    test('UnauthorizedError should have correct properties', () => {
      const error = new UnauthorizedError('Test message');
      expect(error.name).toBe('UnauthorizedError');
      expect(error.message).toBe('Test message');
    });

    test('ForbiddenError should have correct properties', () => {
      const error = new ForbiddenError('Test message');
      expect(error.name).toBe('ForbiddenError');
      expect(error.message).toBe('Test message');
    });

    test('NotFoundError should have correct properties', () => {
      const error = new NotFoundError('Test message');
      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe('Test message');
    });

    test('ConflictError should have correct properties', () => {
      const error = new ConflictError('Test message');
      expect(error.name).toBe('ConflictError');
      expect(error.message).toBe('Test message');
    });

    test('UnprocessableEntityError should have correct properties', () => {
      const error = new UnprocessableEntityError('Test message', { field: 'test' });
      expect(error.name).toBe('UnprocessableEntityError');
      expect(error.message).toBe('Test message');
      expect(error.details).toEqual({ field: 'test' });
    });
  });

  describe('Error Response Format', () => {
    test('should return standardized error response format', async () => {
      const response = await request(app)
        .get('/test-error?type=generic&message=Test error');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
        meta: {
          timestamp: expect.any(String),
          request_id: 'test-request-id',
        },
      });
    });

    test('should include incident_id for 500 errors', async () => {
      const response = await request(app)
        .get('/test-error?type=generic');

      expect(response.status).toBe(500);
      expect(response.body.error.incident_id).toMatch(/^inc_\d+_[a-z0-9]+$/);
    });

    test('should not include incident_id for non-500 errors', async () => {
      const response = await request(app)
        .get('/test-error?type=validation');

      expect(response.status).toBe(422);
      expect(response.body.error.incident_id).toBeUndefined();
    });
  });

  describe('Validation Errors', () => {
    test('should handle ValidationError correctly', async () => {
      const response = await request(app)
        .get('/test-error?type=validation&message=Field required');

      expect(response.status).toBe(422);
      expect(response.body.error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Field required',
        details: { field: 'test' },
      });
    });

    test('should handle UnprocessableEntityError correctly', async () => {
      const response = await request(app)
        .get('/test-error?type=unprocessable&message=Semantic validation failed');

      expect(response.status).toBe(422);
      expect(response.body.error).toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'Semantic validation failed',
        details: { field: 'test' },
      });
    });
  });

  describe('Authentication Errors', () => {
    test('should handle UnauthorizedError correctly', async () => {
      const response = await request(app)
        .get('/test-error?type=unauthorized&message=Login required');

      expect(response.status).toBe(401);
      expect(response.body.error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    });

    test('should handle ForbiddenError correctly', async () => {
      const response = await request(app)
        .get('/test-error?type=forbidden&message=Insufficient permissions');

      expect(response.status).toBe(403);
      expect(response.body.error).toMatchObject({
        code: 'FORBIDDEN',
        message: 'Access denied',
      });
    });
  });

  describe('Resource Errors', () => {
    test('should handle NotFoundError correctly', async () => {
      const response = await request(app)
        .get('/test-error?type=notfound&message=User not found');

      expect(response.status).toBe(404);
      expect(response.body.error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'Resource not found',
      });
    });

    test('should handle ConflictError correctly', async () => {
      const response = await request(app)
        .get('/test-error?type=conflict&message=Email already exists');

      expect(response.status).toBe(409);
      expect(response.body.error).toMatchObject({
        code: 'CONFLICT',
        message: 'Resource conflict',
      });
    });
  });

  describe('Database Errors', () => {
    test('should handle unique violation (23505)', async () => {
      const response = await request(app)
        .get('/test-error?type=database&code=23505');

      expect(response.status).toBe(409);
      expect(response.body.error).toMatchObject({
        code: 'DUPLICATE_RESOURCE',
        message: 'Resource already exists',
      });
    });

    test('should handle foreign key violation (23503)', async () => {
      const response = await request(app)
        .get('/test-error?type=database&code=23503');

      expect(response.status).toBe(400);
      expect(response.body.error).toMatchObject({
        code: 'INVALID_REFERENCE',
        message: 'Invalid reference to related resource',
      });
    });

    test('should handle not null violation (23502)', async () => {
      const response = await request(app)
        .get('/test-error?type=database&code=23502');

      expect(response.status).toBe(400);
      expect(response.body.error).toMatchObject({
        code: 'MISSING_REQUIRED_FIELD',
        message: 'Required field is missing',
      });
    });

    test('should handle check violation (23514)', async () => {
      const response = await request(app)
        .get('/test-error?type=database&code=23514');

      expect(response.status).toBe(400);
      expect(response.body.error).toMatchObject({
        code: 'CONSTRAINT_VIOLATION',
        message: 'Data constraint violation',
      });
    });
  });

  describe('JWT Errors', () => {
    test('should handle JsonWebTokenError correctly', async () => {
      const response = await request(app)
        .get('/test-error?type=jwt&name=JsonWebTokenError');

      expect(response.status).toBe(401);
      expect(response.body.error).toMatchObject({
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      });
    });

    test('should handle TokenExpiredError correctly', async () => {
      const response = await request(app)
        .get('/test-error?type=jwt&name=TokenExpiredError');

      expect(response.status).toBe(401);
      expect(response.body.error).toMatchObject({
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
      });
    });
  });

  describe('Error Logging', () => {
    test('should log errors with request context', async () => {
      await request(app)
        .get('/test-error?type=generic&message=Test logging');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unhandled error',
        expect.objectContaining({
          error: 'Test logging',
          method: 'GET',
        })
      );
    });

    test('should log database errors with code', async () => {
      await request(app)
        .get('/test-error?type=database&code=23505');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unhandled error',
        expect.objectContaining({
          error: 'Database error',
        })
      );
    });
  });

  describe('Edge Cases', () => {
    test('should handle errors without message', async () => {
      const response = await request(app)
        .get('/test-error?type=validation');

      expect(response.status).toBe(422);
      expect(response.body.error.message).toBe('Validation failed');
    });

    test('should handle errors with custom details', async () => {
      const response = await request(app)
        .get('/test-error?type=validation&message=Custom message');

      expect(response.status).toBe(422);
      expect(response.body.error.details).toEqual({ field: 'test' });
    });

    test('should handle request without ID', async () => {
      // Create app without request ID middleware
      const appWithoutId = express();
      appWithoutId.use(express.json());
      appWithoutId.get('/test', (req, res, next) => {
        next(new Error('Test error'));
      });
      appWithoutId.use(errorHandler);

      const response = await request(appWithoutId)
        .get('/test');

      expect(response.status).toBe(500);
      expect(response.body.meta.request_id).toBe('unknown');
    });
  });

  describe('Production Environment', () => {
    const originalEnv = process.env.NODE_ENV;

    afterAll(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('should hide internal error details in production', async () => {
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/test-error?type=generic&message=Internal database error');

      expect(response.status).toBe(500);
      expect(response.body.error.message).toBe('Internal server error');
      expect(response.body.error.details).toBeUndefined();
    });

    test('should show original error details in development', async () => {
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/test-error?type=generic&message=Internal database error');

      expect(response.status).toBe(500);
      expect(response.body.error.message).toBe('An unexpected error occurred');
    });
  });
});
