import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../../../shared/services/redis.service';
import { FcmService } from './fcm.service';

export function startNotificationWorker(): Worker | null {
  try {
    const connection = createRedisConnection();

    const worker = new Worker(
      'notification-queue',
      async (job: Job) => {
        console.log(`[NotificationWorker] Processing async job: ${job.name} (Job ID: ${job.id})`);

        switch (job.name) {
          case 'send-to-user': {
            const { userId, payload } = job.data;
            return await FcmService.sendToUserDirect(userId, payload);
          }

          case 'send-to-tokens': {
            const { tokens, payload } = job.data;
            return await FcmService.sendToTokensDirect(tokens, payload);
          }

          case 'broadcast-campaign': {
            const { campaignData, campaignId } = job.data;
            return await FcmService.broadcastCampaignDirect(campaignData, campaignId);
          }

          case 'order-lifecycle-push': {
            const { orderId, status, deliveryOtp } = job.data;
            return await FcmService.notifyOrderStatusChangedDirect(orderId, status, deliveryOtp);
          }

          case 'new-product-push': {
            const { storeId, productId, productName, imageUrl } = job.data;
            return await FcmService.notifyStoreNewProductDirect(storeId, productId, productName, imageUrl);
          }

          case 'new-story-push': {
            const { storeId, storyId, storeName, mediaUrl } = job.data;
            return await FcmService.notifyStoreNewStoryDirect(storeId, storyId, storeName, mediaUrl);
          }

          case 'new-post-push': {
            const { creatorUserId, itemId, type, titleOrCaption, mediaUrl } = job.data;
            return await FcmService.notifyFollowersNewPostDirect(creatorUserId, itemId, type, titleOrCaption, mediaUrl);
          }

          default:
            console.warn(`[NotificationWorker] Unknown job name: ${job.name}`);
        }
      },
      {
        connection: connection as any,
        concurrency: 10,
      }
    );

    worker.on('completed', (job: Job) => {
      console.log(`[NotificationWorker] Job ${job.name} (#${job.id}) completed successfully`);
    });

    worker.on('failed', (job: Job | undefined, err: Error) => {
      console.error(`[NotificationWorker] Job ${job?.name} (#${job?.id}) failed:`, err.message);
    });

    console.log('[NotificationWorker] BullMQ notification-worker started (concurrency: 10)');
    return worker;
  } catch (err) {
    console.warn('[NotificationWorker] Failed to start BullMQ worker:', err);
    return null;
  }
}
