import { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.url} not found`,
    },
    meta: {
      timestamp: new Date().toISOString(),
      request_id: req.id || 'unknown',
    },
  });
}