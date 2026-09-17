const { logger } = require('./logger');

/**
 * Standard RFC-7807 Problem Details Error Handler
 */
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const requestId = req.id || req.headers['x-request-id'];

  logger.error({
    err: {
      message: err.message,
      stack: err.stack,
      status,
    },
    requestId,
    url: req.originalUrl,
  }, 'Unhandled request error');

  const is5xx = status >= 500;
  res.status(status).json({
    type: 'about:blank',
    title: is5xx ? 'Internal Server Error' : err.message || 'Request Error',
    status,
    detail: is5xx ? 'An unexpected error occurred processing your request.' : (err.message || 'Request failed.'),
    instance: req.originalUrl,
    requestId,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { errorHandler };
