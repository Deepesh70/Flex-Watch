const { logger } = require('../middlewares/logger');

class CacheService {
  constructor(maxEntries = 1000) {
    this.store = new Map(); // key -> { value, expiresAt }
    this.inflight = new Map(); // key -> Promise
    this.maxEntries = maxEntries;
    this.hits = 0;
    this.misses = 0;

    // Periodic garbage collection every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    // LRU: Update recency on cache hit
    this.store.delete(key);
    this.store.set(key, entry);

    this.hits++;
    return entry.value;
  }

  set(key, value, ttlSeconds = 3600) {
    // If key already exists, delete to update position on insert
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      // Evict the least recently used entry (first entry in Map insertion order)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  cleanup() {
    const now = Date.now();
    let expiredCount = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        expiredCount++;
      }
    }
    if (expiredCount > 0) {
      logger.debug({ expiredCount, currentSize: this.store.size }, 'Cleaned up expired cache entries');
    }
  }

  /**
   * Singleflight pattern: Deduplicates concurrent calls for the same key.
   * If a fetch operation is already in flight for 'key', concurrent requests
   * await the same Promise instead of spamming upstream.
   */
  async fetchOrCompute(key, computeFn, ttlSeconds = 3600) {
    // 1. Check Cache
    const cached = this.get(key);
    if (cached !== null) {
      return { data: cached, source: 'cache' };
    }

    // 2. Check in-flight requests (Singleflight)
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
          this.set(key, result, ttlSeconds);
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
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)).toFixed(3) : 0,
      inflightCount: this.inflight.size,
    };
  }
}

const cacheService = new CacheService();

module.exports = { cacheService, CacheService };
