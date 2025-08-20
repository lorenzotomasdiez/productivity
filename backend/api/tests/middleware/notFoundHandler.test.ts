import { jest } from '@jest/globals';
import { Request, Response } from 'express';
import { notFoundHandler } from '../../src/middleware/notFoundHandler.js';

describe('notFoundHandler', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();

    mockRequest = {
      method: 'GET',
      url: '/api/nonexistent',
      id: 'test-request-id',
    };

    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
  });

  it('should return 404 status', () => {
    notFoundHandler(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(404);
  });

  it('should return correct error response structure', () => {
    notFoundHandler(mockRequest as Request, mockResponse as Response);

    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint GET /api/nonexistent not found',
      },
      meta: {
        timestamp: expect.any(String),
        request_id: 'test-request-id',
      },
    });
  });

  it('should handle different HTTP methods', () => {
    mockRequest.method = 'POST';
    mockRequest.url = '/api/users';

    notFoundHandler(mockRequest as Request, mockResponse as Response);

    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint POST /api/users not found',
      },
      meta: {
        timestamp: expect.any(String),
        request_id: 'test-request-id',
      },
    });
  });

  it('should handle missing request ID gracefully', () => {
    delete mockRequest.id;

    notFoundHandler(mockRequest as Request, mockResponse as Response);

    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint GET /api/nonexistent not found',
      },
      meta: {
        timestamp: expect.any(String),
        request_id: 'unknown',
      },
    });
  });

  it('should return valid ISO timestamp', () => {
    notFoundHandler(mockRequest as Request, mockResponse as Response);

    expect(mockJson).toHaveBeenCalled();
    const calls = mockJson.mock.calls;
    expect(calls).toBeDefined();
    expect(calls?.length).toBeGreaterThan(0);
    
    const response = calls?.[0]?.[0] as any;
    expect(response).toBeDefined();
    expect(response?.meta?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('should handle complex URLs', () => {
    mockRequest.url = '/api/users/123/posts/456/comments?page=1&limit=10';

    notFoundHandler(mockRequest as Request, mockResponse as Response);

    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint GET /api/users/123/posts/456/comments?page=1&limit=10 not found',
      },
      meta: {
        timestamp: expect.any(String),
        request_id: 'test-request-id',
      },
    });
  });

  it('should handle root path', () => {
    mockRequest.url = '/';

    notFoundHandler(mockRequest as Request, mockResponse as Response);

    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint GET / not found',
      },
      meta: {
        timestamp: expect.any(String),
        request_id: 'test-request-id',
      },
    });
  });

  it('should handle empty URL', () => {
    mockRequest.url = '';

    notFoundHandler(mockRequest as Request, mockResponse as Response);

    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint GET  not found',
      },
      meta: {
        timestamp: expect.any(String),
        request_id: 'test-request-id',
      },
    });
  });
});
