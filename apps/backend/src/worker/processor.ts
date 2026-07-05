import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { getSharedConfig } from '../shared/config';
import { prisma, OrderStatus } from '@workspace/db';

export function startWorker() {
  const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
  });

  const worker = new Worker('ecom-queue', async job => {
    console.log(`[Worker] Processing job ${job.name} (ID: ${job.id})`);
    
    if (job.name === 'process-order') {
      const { orderId } = job.data;
      
      console.log(`Processing order ${orderId}...`);
      
      // Example async task (e.g. contacting delivery partner, processing payment)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.READY_FOR_PICKUP }
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

  console.log(`[Worker] Initialized and waiting for jobs...`);
}
