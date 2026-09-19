const client = require('prom-client');

// Initialize default Node.js system and process metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'flexwatch_' });

// HTTP Request Duration Histogram
const httpRequestDurationSeconds = new client.Histogram({
  name: 'flexwatch_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

// HTTP Requests Counter
const httpRequestsTotal = new client.Counter({
  name: 'flexwatch_http_requests_total',
  help: 'Total number of HTTP requests handled',
  labelNames: ['method', 'route', 'status_code'],
});

// Cache Operations Counter (L1/L2 hits & misses)
const cacheOperationsTotal = new client.Counter({
  name: 'flexwatch_cache_operations_total',
  help: 'Total number of cache operations across L1 and L2 tiers',
  labelNames: ['tier', 'operation', 'status'],
});

/**
 * Express middleware to record HTTP metrics
 */
const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    // Normalise route for metrics to avoid cardinality explosion with IDs
    const route = req.baseUrl
      ? `${req.baseUrl}${req.route?.path || req.path || ''}`
      : req.route?.path || req.path || 'unknown';

    const diff = process.hrtime(start);
    const durationSeconds = diff[0] + diff[1] / 1e9;
    const statusCode = res.statusCode ? res.statusCode.toString() : '500';

    // Don't flood metrics with the /metrics endpoint itself
    if (req.path !== '/metrics') {
      httpRequestDurationSeconds.observe(
        { method: req.method, route, status_code: statusCode },
        durationSeconds
      );
      httpRequestsTotal.inc({
        method: req.method,
        route,
        status_code: statusCode,
      });
    }
  });

  next();
};

module.exports = {
  client,
  httpRequestDurationSeconds,
  httpRequestsTotal,
  cacheOperationsTotal,
  metricsMiddleware,
};
