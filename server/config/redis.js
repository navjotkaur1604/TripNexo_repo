const { createClient } = require('redis');
const env = require('./env');
const { logger } = require('./logger');

class RedisCacheManager {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.connectAttempted = false;
  }

  async connect(url = env.redisUrl) {
    if (env.nodeEnv === 'test' && !process.env.FORCE_REDIS_IN_TEST) {
      return false;
    }
    if (this.client && this.isReady) {
      return true;
    }

    this.connectAttempted = true;
    try {
      this.client = createClient({
        url,
        socket: {
          connectTimeout: 2000,
          reconnectStrategy: (retries) => {
            if (retries > 2) return false;
            return Math.min(retries * 200, 1000);
          },
        },
      });

      this.client.on('ready', () => {
        this.isReady = true;
        logger.info('Redis connected and ready for caching');
      });

      this.client.on('error', (err) => {
        if (this.isReady) {
          logger.warn('Redis connection error; falling back to MongoDB', {
            message: err.message,
          });
        }
        this.isReady = false;
      });

      this.client.on('end', () => {
        this.isReady = false;
      });

      await this.client.connect();
      this.isReady = true;
      return true;
    } catch (error) {
      this.isReady = false;
      logger.warn('Redis unavailable; graceful fallback to MongoDB enabled', {
        message: error.message,
      });
      return false;
    }
  }

  /**
   * Allow injecting a mock/test Redis client during automated tests.
   */
  setClient(customClient) {
    this.client = customClient;
    this.isReady = Boolean(customClient);
  }

  async get(key) {
    if (!this.client || !this.isReady) {
      return null;
    }
    try {
      const cached = await this.client.get(key);
      if (cached) {
        logger.info('Redis CACHE HIT', { key });
        return JSON.parse(cached);
      }
      logger.info('Redis CACHE MISS', { key });
      return null;
    } catch (error) {
      logger.warn('Redis GET failed; falling back to MongoDB', {
        key,
        message: error.message,
      });
      return null;
    }
  }

  async set(key, value, ttlSeconds = env.redisTtlSeconds) {
    if (!this.client || !this.isReady) {
      return false;
    }
    try {
      const payload = JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, payload);
      logger.info('Redis CACHE SET', { key, ttlSeconds });
      return true;
    } catch (error) {
      logger.warn('Redis SET failed; continuing without cache', {
        key,
        message: error.message,
      });
      return false;
    }
  }

  async invalidatePattern(pattern) {
    if (!this.client || !this.isReady) {
      return 0;
    }
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.info('Redis CACHE INVALIDATED', { pattern, deletedCount: keys.length });
      }
      return keys.length;
    } catch (error) {
      logger.warn('Redis INVALIDATE failed', { pattern, message: error.message });
      return 0;
    }
  }

  async disconnect() {
    if (this.client && this.isReady) {
      await this.client.quit();
      this.isReady = false;
    }
  }
}

const redisCache = new RedisCacheManager();

module.exports = { redisCache, RedisCacheManager };
