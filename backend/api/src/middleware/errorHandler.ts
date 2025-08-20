import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

// Extend Request interface to include id
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

interface CustomError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
}

export function errorHandler(err: CustomError, req: Request, res: Response, _next: NextFunction): void {
  // Log the error
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Default error response
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = err.message || 'Invalid input data';
    details = err.details || null;
  } else if (err.name === 'UnauthorizedError' || err.message.includes('unauthorized')) {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Authentication required';
  } else if (err.name === 'ForbiddenError' || err.message.includes('forbidden')) {
    statusCode = 403;
    code = 'FORBIDDEN';
    message = 'Access denied';
  } else if (err.name === 'NotFoundError' || err.message.includes('not found')) {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Resource not found';
  } else if (err.name === 'ConflictError' || err.message.includes('conflict')) {
    statusCode = 409;
    code = 'CONFLICT';
    message = 'Resource conflict';
  } else if (err.name === 'UnprocessableEntityError') {
    statusCode = 422;
    code = 'VALIDATION_FAILED';
    message = 'Semantic validation failed';
    details = err.details || err.message;
  }

  // Database-specific errors
  if (err.code) {
    switch (err.code) {
    case '23505': // unique_violation
      statusCode = 409;
      code = 'DUPLICATE_RESOURCE';
      message = 'Resource already exists';
      break;
    case '23503': // foreign_key_violation
      statusCode = 400;
      code = 'INVALID_REFERENCE';
      message = 'Invalid reference to related resource';
      break;
    case '23502': // not_null_violation
      statusCode = 400;
      code = 'MISSING_REQUIRED_FIELD';
      message = 'Required field is missing';
      break;
    case '23514': // check_violation
      statusCode = 400;
      code = 'CONSTRAINT_VIOLATION';
      message = 'Data constraint violation';
      break;
    }
  }

  // JWT-specific errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
    details = null;
  }

  // Generate unique incident ID for tracking
  const incidentId = `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const errorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(statusCode === 500 && { incident_id: incidentId }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      request_id: req.id || 'unknown',
    },
  };

  res.status(statusCode).json(errorResponse);
}

// Custom error classes
export class ValidationError extends Error {
  public details: any;
  
  constructor(message: string, details: any = null) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string = 'Conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class UnprocessableEntityError extends Error {
  public details: any;
  
  constructor(message: string, details: any = null) {
    super(message);
    this.name = 'UnprocessableEntityError';
    this.details = details;
  }
}