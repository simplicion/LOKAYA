import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisService {
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!RedisService.instance) {
      RedisService.instance = new Redis(redisUrl);
      
      RedisService.instance.on('error', (err) => {
        console.error('Redis Client Error', err);
      });
      
      RedisService.instance.on('connect', () => {
        console.log('Redis Client Connected');
      });
    }
    return RedisService.instance;
  }
}

export const redisClient = RedisService.getInstance();
