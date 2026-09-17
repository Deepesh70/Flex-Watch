const { verifyToken } = require('@clerk/backend');
const { env } = require('../config/env');
const { prisma } = require('../db/prisma');
const { logger } = require('./logger');

/**
 * Verifies Bearer token with Clerk and resolves/upserts the database User.
 * Throws an error with a message and status if verification fails.
 */
async function verifyAndResolveUser(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Authorization Bearer token is required.');
    error.status = 401;
    throw error;
  }

  if (!env.CLERK_SECRET_KEY && !env.CLERK_JWT_KEY) {
    const error = new Error('Clerk verification keys (CLERK_SECRET_KEY or CLERK_JWT_KEY) are not configured.');
    error.status = 401;
    throw error;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    const error = new Error('Authorization Bearer token is missing.');
    error.status = 401;
    throw error;
  }

  const payload = await verifyToken(token, {
    secretKey: env.CLERK_SECRET_KEY || undefined,
    jwtKey: env.CLERK_JWT_KEY || undefined,
  });

  const clerkId = payload?.sub || payload?.id;
  if (!clerkId) {
    const error = new Error('User could not be identified from verified token.');
    error.status = 401;
    throw error;
  }

  const user = await prisma.user.upsert({
    where: { clerkId },
    update: {},
    create: { clerkId },
  });

  return { user, clerkId };
}

/**
 * Require authentication middleware using Clerk
 */
async function requireAuth(req, res, next) {
  try {
    const { user, clerkId } = await verifyAndResolveUser(req.headers.authorization);
    req.user = user;
    req.clerkId = clerkId;
    next();
  } catch (err) {
    logger.error({ err: err.message }, 'Auth middleware error');
    return res.status(err.status || 401).json({
      title: 'Unauthorized',
      status: err.status || 401,
      detail: err.message || 'Authentication failed.',
    });
  }
}

/**
 * Optional authentication: Attaches user if token is valid, otherwise leaves req.user undefined
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const { user, clerkId } = await verifyAndResolveUser(authHeader);
    req.user = user;
    req.clerkId = clerkId;
  } catch (err) {
    logger.debug({ err: err.message }, 'Optional auth token resolution failed; proceeding unauthenticated');
    req.user = undefined;
    req.clerkId = undefined;
  }
  return next();
}

module.exports = { requireAuth, optionalAuth };
