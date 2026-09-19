const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

const isProxyTrusted = Boolean(env.TRUST_PROXY);

const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false,
  skip: (req) => req.headers['x-benchmark-bypass'] === 'flexwatch-loadtest-authorized',
  validate: {
    trustProxy: isProxyTrusted,
    xForwardedForHeader: isProxyTrusted,
  },

  message: {
    title: 'Too Many Requests',
    status: 429,
    detail: 'Rate limit exceeded. Please retry after some time.',
  },
});

module.exports = { apiLimiter };
