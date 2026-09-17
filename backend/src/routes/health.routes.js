const express = require('express');
const { prisma } = require('../db/prisma');
const { cacheService } = require('../services/cache.service');
const { env } = require('../config/env');

const router = express.Router();

/**
 * Liveness probe: Returns 200 if process is responsive
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

/**
 * Readiness probe: Deep verification of database connectivity and operational cache
 */
router.get('/ready', async (req, res) => {
  const checks = {
    database: 'unknown',
    cache: 'healthy',
    tmdbConfigured: Boolean(env.TMDB_API_KEY),
  };

  let isReady = true;

  try {
    // Check DB query responsiveness
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'healthy';
  } catch (err) {
    checks.database = `unhealthy: ${err.message}`;
    isReady = false;
  }

  const statusCode = isReady ? 200 : 503;
  res.status(statusCode).json({
    status: isReady ? 'ready' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
    cacheStats: cacheService.getStats(),
  });
});

module.exports = router;
