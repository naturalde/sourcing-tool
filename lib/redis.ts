import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  retryStrategy: () => null, // Don't retry, fail fast
  lazyConnect: true,
});

let redisAvailable = false;

redis.on('error', () => {
  // Silently handle Redis errors - caching is optional
  redisAvailable = false;
});

redis.on('connect', () => {
  redisAvailable = true;
});

// Try to connect but don't fail if Redis is unavailable
redis.connect().catch(() => {
  redisAvailable = false;
});

export const redisClient = {
  async get(key: string): Promise<string | null> {
    if (!redisAvailable) return null;
    try {
      return await redis.get(key);
    } catch (error) {
      return null;
    }
  },
};

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const value = await redisClient.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!redisAvailable) return;
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      // Silently fail
    }
  },

  async del(key: string): Promise<void> {
    if (!redisAvailable) return;
    try {
      await redis.del(key);
    } catch (error) {
      // Silently fail
    }
  },

  async exists(key: string): Promise<boolean> {
    if (!redisAvailable) return false;
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      return false;
    }
  },

  async incr(key: string): Promise<number> {
    if (!redisAvailable) return 0;
    try {
      return await redis.incr(key);
    } catch (error) {
      return 0;
    }
  },

  async expire(key: string, seconds: number): Promise<void> {
    if (!redisAvailable) return;
    try {
      await redis.expire(key, seconds);
    } catch (error) {
      // Silently fail
    }
  },
};

export default redis;
