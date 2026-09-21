import { Queue } from 'bullmq';
import { createRedisConnection } from '../../../shared/services/redis.service';

let notificationQueueInstance: Queue | null = null;

export function getNotificationQueue(): Queue | null {
  try {
    if (!notificationQueueInstance) {
      const connection = createRedisConnection();
      notificationQueueInstance = new Queue('notification-queue', {
        connection: connection as any,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: { count: 500 },
          removeOnFail: { count: 1000 }
        }
      });
      console.log('[NotificationQueue] BullMQ notification-queue initialized');
    }
    return notificationQueueInstance;
  } catch (err) {
    console.warn('[NotificationQueue] Unable to connect to Redis queue, falling back to direct mode:', err);
    return null;
  }
}
