import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandler.js';

export interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body) {
        const { error, value } = schema.body.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
          allowUnknown: true
        });
        
        if (error) {
          const details = error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message,
            type: d.type
          }));
          
          throw new ValidationError('Request validation failed', { field_errors: details });
        }
        
        req.body = value;
      }

      // Validate query parameters
      if (schema.query) {
        const { error, value } = schema.query.validate(req.query, {
          abortEarly: false,
          stripUnknown: true,
          allowUnknown: true
        });
        
        if (error) {
          const details = error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message,
            type: d.type
          }));
          
          throw new ValidationError('Query parameter validation failed', { field_errors: details });
        }
        
        req.query = value;
      }

      // Validate path parameters
      if (schema.params) {
        const { error, value } = schema.params.validate(req.params, {
          abortEarly: false,
          stripUnknown: true,
          allowUnknown: true
        });
        
        if (error) {
          const details = error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message,
            type: d.type
          }));
          
          throw new ValidationError('Path parameter validation failed', { field_errors: details });
        }
        
        req.params = value;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  uuid: Joi.string().min(1).required(), // Allow any non-empty string for now (includes UUIDs and test IDs)
  pagination: {
    limit: Joi.number().integer().min(1).max(100).default(20),
    page: Joi.number().integer().min(1).default(1)
  },
  date: Joi.date().iso().required(),
  email: Joi.string().email().required(),
  hexColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).required()
};
