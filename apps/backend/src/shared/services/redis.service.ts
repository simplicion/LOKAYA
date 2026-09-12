import Redis, { RedisOptions } from 'ioredis';

export const getRedisOptions = (customOptions: RedisOptions = {}): RedisOptions => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const isTls = redisUrl.startsWith('rediss://') || process.env.REDIS_TLS === 'true';

  const options: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 500, 5000);
      return delay;
    },
    reconnectOnError(err) {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      if (targetErrors.some(target => err.message.includes(target))) {
        return true;
      }
      return false;
    },
    ...customOptions,
  };

  if (isTls) {
    options.tls = {
      rejectUnauthorized: false,
      ...(customOptions.tls || {}),
    };
  }

  return options;
};

export const createRedisConnection = (customOptions: RedisOptions = {}): Redis => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = new Redis(redisUrl, getRedisOptions(customOptions));

  client.on('error', (err) => {
    console.warn('[Redis Notice]:', err.message);
  });

  return client;
};

class RedisService {
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!RedisService.instance) {
      RedisService.instance = createRedisConnection();
      
      RedisService.instance.on('connect', () => {
        console.log('Redis Client Connected');
      });
    }
    return RedisService.instance;
  }
}

export const redisClient = RedisService.getInstance();

