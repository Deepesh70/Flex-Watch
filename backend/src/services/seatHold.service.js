const { cacheService } = require('./cache.service');
const { logger } = require('../middlewares/logger');

class SeatHoldService {
  constructor() {
    // In-memory fallback map: key -> { userId, expiresAt }
    this.memoryHolds = new Map();

    // Clean up expired memory holds every minute
    setInterval(() => this._cleanupMemoryHolds(), 60 * 1000).unref();
  }

  _getKey(movieId, showtime, seatCode) {
    const timeKey = new Date(showtime).toISOString();
    return `flexwatch:hold:${movieId}:${timeKey}:${seatCode.toUpperCase()}`;
  }

  _cleanupMemoryHolds() {
    const now = Date.now();
    for (const [key, entry] of this.memoryHolds.entries()) {
      if (now > entry.expiresAt) {
        this.memoryHolds.delete(key);
      }
    }
  }

  /**
   * Attempt to hold seats for a user with TTL (default 600s = 10 min)
   */
  async holdSeats(movieId, showtime, seats, userId, ttlSeconds = 600) {
    const redis = cacheService.isRedisAvailable ? cacheService.redis : null;
    const requested = seats.map((s) => s.trim().toUpperCase());
    const acquired = [];
    const conflicts = [];
    const expiresAt = Date.now() + ttlSeconds * 1000;

    if (redis) {
      try {
        for (const seat of requested) {
          const key = this._getKey(movieId, showtime, seat);
          // SET key userId NX EX ttlSeconds
          const result = await redis.set(key, userId, 'NX', 'EX', ttlSeconds);
          if (result === 'OK') {
            acquired.push(seat);
          } else {
            // Check if held by the same user already
            const existingHolder = await redis.get(key);
            if (existingHolder === userId) {
              // Refresh TTL
              await redis.expire(key, ttlSeconds);
              acquired.push(seat);
            } else {
              conflicts.push(seat);
            }
          }
        }

        // If any conflict occurred, roll back any acquired holds in this attempt
        if (conflicts.length > 0) {
          for (const seat of acquired) {
            if (!conflicts.includes(seat)) {
              await redis.del(this._getKey(movieId, showtime, seat));
            }
          }
          return { success: false, conflicts, heldSeats: [] };
        }

        return { success: true, conflicts: [], heldSeats: acquired, expiresAt };
      } catch (err) {
        logger.warn({ err: err.message }, 'Redis seat hold failed, falling back to memory');
      }
    }

    // In-memory fallback
    this._cleanupMemoryHolds();
    const now = Date.now();

    for (const seat of requested) {
      const key = this._getKey(movieId, showtime, seat);
      const existing = this.memoryHolds.get(key);
      if (existing && now < existing.expiresAt && existing.userId !== userId) {
        conflicts.push(seat);
      } else {
        acquired.push(seat);
      }
    }

    if (conflicts.length > 0) {
      return { success: false, conflicts, heldSeats: [] };
    }

    for (const seat of acquired) {
      const key = this._getKey(movieId, showtime, seat);
      this.memoryHolds.set(key, { userId, expiresAt });
    }

    return { success: true, conflicts: [], heldSeats: acquired, expiresAt };
  }

  /**
   * Release hold on seats
   */
  async releaseSeats(movieId, showtime, seats, userId) {
    const redis = cacheService.isRedisAvailable ? cacheService.redis : null;
    const requested = seats.map((s) => s.trim().toUpperCase());
    const released = [];

    if (redis) {
      try {
        for (const seat of requested) {
          const key = this._getKey(movieId, showtime, seat);
          const currentHolder = await redis.get(key);
          if (currentHolder === userId) {
            await redis.del(key);
            released.push(seat);
          }
        }
        return released;
      } catch (err) {
        logger.debug({ err: err.message }, 'Redis release error');
      }
    }

    for (const seat of requested) {
      const key = this._getKey(movieId, showtime, seat);
      const existing = this.memoryHolds.get(key);
      if (existing && existing.userId === userId) {
        this.memoryHolds.delete(key);
        released.push(seat);
      }
    }
    return released;
  }

  /**
   * Get all active holds for this showtime
   */
  async getHeldSeats(movieId, showtime) {
    const redis = cacheService.isRedisAvailable ? cacheService.redis : null;
    const timeKey = new Date(showtime).toISOString();
    const pattern = `flexwatch:hold:${movieId}:${timeKey}:*`;
    const prefix = `flexwatch:hold:${movieId}:${timeKey}:`;
    const held = [];

    if (redis) {
      try {
        const keys = await redis.keys(pattern);
        for (const key of keys) {
          const seatCode = key.replace(prefix, '');
          const userId = await redis.get(key);
          const ttl = await redis.ttl(key);
          if (userId && ttl > 0) {
            held.push({ seatCode, userId, remainingSeconds: ttl });
          }
        }
        return held;
      } catch (err) {
        logger.debug({ err: err.message }, 'Redis getHeldSeats error');
      }
    }

    this._cleanupMemoryHolds();
    const now = Date.now();
    for (const [key, entry] of this.memoryHolds.entries()) {
      if (key.startsWith(prefix) && now < entry.expiresAt) {
        const seatCode = key.replace(prefix, '');
        held.push({
          seatCode,
          userId: entry.userId,
          remainingSeconds: Math.max(0, Math.round((entry.expiresAt - now) / 1000)),
        });
      }
    }
    return held;
  }

  /**
   * Permanent confirmation - remove temporary hold
   */
  async confirmSeats(movieId, showtime, seats) {
    const redis = cacheService.isRedisAvailable ? cacheService.redis : null;
    const requested = seats.map((s) => s.trim().toUpperCase());

    if (redis) {
      try {
        for (const seat of requested) {
          await redis.del(this._getKey(movieId, showtime, seat));
        }
      } catch (err) {
        logger.debug({ err: err.message }, 'Redis confirmSeats error');
      }
    }

    for (const seat of requested) {
      this.memoryHolds.delete(this._getKey(movieId, showtime, seat));
    }
  }
}

const seatHoldService = new SeatHoldService();

module.exports = { seatHoldService, SeatHoldService };
