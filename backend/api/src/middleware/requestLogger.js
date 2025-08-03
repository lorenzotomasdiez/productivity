import { logger } from '../config/logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();

  // Generate unique request ID
  req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Log incoming request
  logger.info('HTTP request started', {
    requestId: req.id,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    contentLength: req.get('Content-Length'),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId: req.id,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      contentLength: res.get('Content-Length'),
    };

    if (res.statusCode >= 500) {
      logger.error('HTTP request completed with server error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP request completed with client error', logData);
    } else {
      logger.info('HTTP request completed successfully', logData);
    }
  });

  next();
}