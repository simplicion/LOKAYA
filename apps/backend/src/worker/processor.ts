import { Worker } from 'bullmq';
import { getSharedConfig } from '../shared/config';
import { prisma, OrderStatus } from '@workspace/db';
import { mediaWorker } from '../modules/media/application/media-worker.service';
import { createRedisConnection } from '../shared/services/redis.service';
import { StoryRetentionService } from './cron/story-retention.cron';
import { startNotificationWorker } from '../modules/notification/application/notification-worker';

export function startWorker() {
  const connection = createRedisConnection();

  // Start 30-day story retention and R2 permanent purge schedule
  StoryRetentionService.startScheduledJob();

  // Start BullMQ Async Notification Worker
  const notificationWorker = startNotificationWorker();

  const worker = new Worker('ecom-queue', async job => {
    console.log(`[Worker] Processing job ${job.name} (ID: ${job.id})`);
    
    if (job.name === 'process-order') {
      const { orderId } = job.data;
      
      console.log(`Processing order ${orderId}...`);
      
      // Example async task (e.g. contacting delivery partner, processing payment)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PACKED }
      });
      
      console.log(`Order ${orderId} is ready for pickup.`);
    }
  }, { connection: connection as any });

  worker.on('completed', job => {
    console.log(`[Worker] Job ${job.id} has completed!`);
  });

  worker.on('failed', (job, err) => {
    console.log(`[Worker] Job ${job?.id} has failed: ${err.message}`);
  });

  if (mediaWorker) {
    mediaWorker.on('completed', job => console.log(`[MediaWorker] Job ${job.id} completed`));
    mediaWorker.on('failed', (job, err) => console.log(`[MediaWorker] Job ${job?.id} failed: ${err.message}`));
  }

  console.log(`[Worker] Initialized and waiting for jobs...`);
}

