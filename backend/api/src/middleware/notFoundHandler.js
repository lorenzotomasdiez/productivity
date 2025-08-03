export function notFoundHandler(req, res, next) {
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