const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { env } = require('./config/env');
const { logger, httpLogger } = require('./middlewares/logger');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { errorHandler } = require('./middlewares/errorHandler');

// Route imports
const healthRoutes = require('./routes/health.routes');
const movieRoutes = require('./routes/movie.routes');
const seriesRoutes = require('./routes/series.routes');
const searchRoutes = require('./routes/search.routes');
const watchlistRoutes = require('./routes/watchlist.routes');
const bookingRoutes = require('./routes/booking.routes');

const app = express();

// Trust reverse proxy if configured in deployment; disabled by default
if (env.TRUST_PROXY) {
  const trustProxyVal = env.TRUST_PROXY.toLowerCase();
  if (trustProxyVal === 'true') {
    app.set('trust proxy', true);
  } else if (!isNaN(Number(env.TRUST_PROXY))) {
    app.set('trust proxy', Number(env.TRUST_PROXY));
  } else {
    app.set('trust proxy', env.TRUST_PROXY);
  }
} else {
  app.set('trust proxy', false);
}

// 1. Security & Core Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: [env.CORS_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(httpLogger);

// 2. Health Probes (un-rate-limited for container health checks)
app.use('/health', healthRoutes);

// 3. Rate-limited API routes
app.use('/api', apiLimiter);

// 4. API v1 Mounts
app.use('/api/v1/movies', movieRoutes);
app.use('/api/v1/series', seriesRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/watchlist', watchlistRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// 5. 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    title: 'Not Found',
    status: 404,
    detail: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
    instance: req.originalUrl,
  });
});

// 6. Centralized Error Handler
app.use(errorHandler);

// 7. Server Bootstrap & Graceful Shutdown
let server = null;

if (require.main === module) {
  server = app.listen(env.PORT, () => {
    logger.info({
      port: env.PORT,
      env: env.NODE_ENV,
      tmdbActive: Boolean(env.TMDB_API_KEY),
    }, `🚀 Flex-Watch API Server started on port ${env.PORT}`);
  });

  const gracefulShutdown = (signal) => {
    logger.info({ signal }, 'Received termination signal, initiating graceful shutdown...');
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed. Exiting process.');
        process.exit(0);
      });
    }

    // Force close after 10s if hanging
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = { app, server };
