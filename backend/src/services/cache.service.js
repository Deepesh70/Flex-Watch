const Redis = require('ioredis');
const { logger } = require('../middlewares/logger');
const { env } = require('../config/env');
const { cacheOperationsTotal } = require('./metrics.service');

class CacheService {
  constructor(maxEntries = 1000) {
    this.l1Store = new Map(); // key -> { value, expiresAt }
    this.inflight = new Map(); // key -> Promise
    this.maxEntries = maxEntries;

    // Local stats
    this.hitsL1 = 0;
    this.hitsL2 = 0;
    this.misses = 0;

    // Initialize Redis L2 tier if configured
    this.redis = null;
    this.isRedisAvailable = false;
    this._initRedis();

    // Periodic L1 garbage collection every 5 minutes
    setInterval(() => this.cleanupL1(), 5 * 60 * 1000).unref();
  }

  _initRedis() {
    if (!env.REDIS_URL) {
      logger.debug('Redis URL not configured; running in L1 local memory cache mode');
      return;
    }

    try {
      this.redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 5) return null; // stop retry flood if Redis is dead
          return Math.min(times * 200, 2000);
        },
      });

      this.redis.on('connect', () => {
        this.isRedisAvailable = true;
        logger.info('Connected to Redis L2 distributed cache');
      });

      this.redis.on('error', (err) => {
        if (this.isRedisAvailable) {
          logger.warn({ err: err.message }, 'Redis L2 cache error, falling back to L1 local memory');
        }
        this.isRedisAvailable = false;
      });

      this.redis.on('close', () => {
        this.isRedisAvailable = false;
      });

      this.redis.connect().catch((err) => {
        logger.debug({ err: err.message }, 'Initial Redis connection bypassed; operating in L1 memory mode');
        this.isRedisAvailable = false;
      });
    } catch (err) {
      logger.debug({ err: err.message }, 'Failed to initialize Redis client; operating in L1 memory mode');
      this.isRedisAvailable = false;
    }
  }

  /**
   * Synchronous L1 memory retrieval
   */
  getL1(key) {
    const entry = this.l1Store.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.l1Store.delete(key);
      return null;
    }

    // LRU: Update recency
    this.l1Store.delete(key);
    this.l1Store.set(key, entry);

    return entry.value;
  }

  /**
   * Set into L1 with LRU capacity protection
   */
  setL1(key, value, ttlSeconds = 3600) {
    if (this.l1Store.has(key)) {
      this.l1Store.delete(key);
    } else if (this.l1Store.size >= this.maxEntries) {
      const oldestKey = this.l1Store.keys().next().value;
      if (oldestKey !== undefined) {
        this.l1Store.delete(oldestKey);
      }
    }

    this.l1Store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Retrieve from cache (L1 first, then L2 Redis)
   */
  async get(key) {
    // 1. Check L1 Memory (0ms)
    const l1Value = this.getL1(key);
    if (l1Value !== null) {
      this.hitsL1++;
      cacheOperationsTotal.inc({ tier: 'l1', operation: 'get', status: 'hit' });
      return l1Value;
    }
    cacheOperationsTotal.inc({ tier: 'l1', operation: 'get', status: 'miss' });

    // 2. Check L2 Redis if available
    if (this.isRedisAvailable && this.redis) {
      try {
        const raw = await this.redis.get(`flexwatch:${key}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.hitsL2++;
          cacheOperationsTotal.inc({ tier: 'l2', operation: 'get', status: 'hit' });
          // Backfill into L1 memory for subsequent microsecond hits
          this.setL1(key, parsed, 300); // 5 min local buffer
          return parsed;
        }
        cacheOperationsTotal.inc({ tier: 'l2', operation: 'get', status: 'miss' });
      } catch (err) {
        logger.debug({ key, err: err.message }, 'Redis L2 read error; fallback to upstream');
      }
    }

    this.misses++;
    return null;
  }

  /**
   * Set into both L1 Memory and L2 Redis
   */
  async set(key, value, ttlSeconds = 3600) {
    // 1. Store in L1
    this.setL1(key, value, ttlSeconds);
    cacheOperationsTotal.inc({ tier: 'l1', operation: 'set', status: 'success' });

    // 2. Store in L2 Redis if available
    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.set(
          `flexwatch:${key}`,
          JSON.stringify(value),
          'EX',
          Math.max(ttlSeconds, 60)
        );
        cacheOperationsTotal.inc({ tier: 'l2', operation: 'set', status: 'success' });
      } catch (err) {
        logger.debug({ key, err: err.message }, 'Redis L2 write error');
      }
    }
  }

  /**
   * Invalidate key from all cache tiers
   */
  async delete(key) {
    this.l1Store.delete(key);
    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.del(`flexwatch:${key}`);
      } catch (err) {
        logger.debug({ key, err: err.message }, 'Redis L2 delete error');
      }
    }
  }

  cleanupL1() {
    const now = Date.now();
    let expiredCount = 0;
    for (const [key, entry] of this.l1Store.entries()) {
      if (now > entry.expiresAt) {
        this.l1Store.delete(key);
        expiredCount++;
      }
    }
    if (expiredCount > 0) {
      logger.debug({ expiredCount, currentSize: this.l1Store.size }, 'Cleaned up expired L1 cache entries');
    }
  }

  /**
   * Singleflight pattern: Deduplicates concurrent calls for the same key across tiers.
   * If a fetch operation is already in flight for 'key', concurrent requests
   * await the same Promise instead of spamming upstream.
   */
  async fetchOrCompute(key, computeFn, ttlSeconds = 3600) {
    // 1. Check Cache (L1 ➔ L2)
    const cached = await this.get(key);
    if (cached !== null) {
      return { data: cached, source: 'cache' };
    }

    // 2. Check in-flight requests (Singleflight promise collapsing)
    if (this.inflight.has(key)) {
      logger.debug({ key }, 'Singleflight collapsed concurrent request');
      const data = await this.inflight.get(key);
      return { data, source: 'singleflight' };
    }

    // 3. Compute and store
    const promise = (async () => {
      try {
        const result = await computeFn();
        if (result !== null && result !== undefined) {
          await this.set(key, result, ttlSeconds);
        }
        return result;
      } finally {
        this.inflight.delete(key);
      }
    })();

    this.inflight.set(key, promise);
    const data = await promise;
    return { data, source: 'upstream' };
  }

  getStats() {
    const totalHits = this.hitsL1 + this.hitsL2;
    const totalRequests = totalHits + this.misses;
    return {
      tier: this.isRedisAvailable ? 'L1-Memory + L2-Redis' : 'L1-Memory',
      l1Size: this.l1Store.size,
      maxEntries: this.maxEntries,
      hitsL1: this.hitsL1,
      hitsL2: this.hitsL2,
      totalHits,
      misses: this.misses,
      hitRate: totalRequests > 0 ? (totalHits / totalRequests).toFixed(3) : '0.000',
      inflightCount: this.inflight.size,
      redisConnected: this.isRedisAvailable,
    };
  }

  async close() {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (err) {
        // ignore on close
      }
    }
  }
}

const cacheService = new CacheService();

module.exports = { cacheService, CacheService };
