import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import { prisma, DevicePlatform, NotificationType } from '@workspace/db';
import fs from 'fs';
import path from 'path';
import { getNotificationQueue } from './notification-queue';

export interface PushNotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  deepLink?: string;
  type?: 'ORDER_UPDATE' | 'DELIVERY_DISPATCH' | 'NEW_PRODUCT' | 'NEW_STORY' | 'NEW_POST' | 'MARKETING' | 'SYSTEM';
  data?: Record<string, string>;
}

export class FcmService {
  private static isInitialized = false;
  private static app: App | null = null;

  /**
   * Initializes Firebase Admin SDK using credentials from JSON file, environment variables, or fallback sandbox mode.
   */
  static initialize() {
    if (this.isInitialized) return;

    try {
      if (getApps().length > 0) {
        this.app = getApps()[0];
        this.isInitialized = true;
        return;
      }

      // 1. Try service account file path
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
        path.resolve(process.cwd(), 'firebase-service-account.json') ||
        path.resolve(process.cwd(), 'service-account.json');

      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        this.app = initializeApp({
          credential: cert(serviceAccount)
        });
        this.isInitialized = true;
        console.log('[FCM] Initialized with Service Account JSON file:', serviceAccountPath);
        return;
      }

      // 2. Try raw JSON environment variable
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        this.app = initializeApp({
          credential: cert(serviceAccount)
        });
        this.isInitialized = true;
        console.log('[FCM] Initialized with FIREBASE_SERVICE_ACCOUNT_JSON env var');
        return;
      }

      // 3. Try individual env credentials
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        this.app = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          })
        });
        this.isInitialized = true;
        console.log('[FCM] Initialized with discrete Firebase environment variables');
        return;
      }

      console.warn('[FCM] No Firebase Admin credentials found. Operating in mock/sandbox logging mode.');
      this.isInitialized = true;
    } catch (err) {
      console.error('[FCM] Error initializing Firebase Admin SDK:', err);
      this.isInitialized = true;
    }
  }

  /**
   * Helper: Resolves Android Notification Channel based on message type
   */
  private static getChannelId(type?: string): string {
    switch (type) {
      case 'ORDER_UPDATE':
      case 'DELIVERY_DISPATCH':
        return 'lokaya_orders';
      case 'NEW_PRODUCT':
      case 'NEW_STORY':
      case 'NEW_POST':
        return 'lokaya_social';
      case 'MARKETING':
      default:
        return 'lokaya_promotions';
    }
  }

  /**
   * Registers or updates a device FCM token for a user.
   */
  static async registerDeviceToken(
    userId: string,
    data: {
      token: string;
      platform?: DevicePlatform | string;
      deviceModel?: string;
      osVersion?: string;
      appVersion?: string;
    }
  ) {
    const rawPlatform = (data.platform || 'ANDROID').toUpperCase();
    const platform = rawPlatform === 'IOS' ? DevicePlatform.IOS : rawPlatform === 'WEB' ? DevicePlatform.WEB : DevicePlatform.ANDROID;

    return (prisma as any).deviceToken.upsert({
      where: { token: data.token },
      update: {
        userId,
        platform,
        deviceModel: data.deviceModel || null,
        osVersion: data.osVersion || null,
        appVersion: data.appVersion || null,
        isActive: true,
        lastUsedAt: new Date()
      },
      create: {
        userId,
        token: data.token,
        platform,
        deviceModel: data.deviceModel || null,
        osVersion: data.osVersion || null,
        appVersion: data.appVersion || null,
        isActive: true,
        lastUsedAt: new Date()
      }
    });
  }

  /**
   * Unregisters/deactivates a device token upon user logout.
   */
  static async unregisterDeviceToken(token: string) {
    try {
      return await (prisma as any).deviceToken.updateMany({
        where: { token },
        data: { isActive: false }
      });
    } catch (err) {
      console.warn('[FCM] Error deactivating device token:', err);
      return { count: 0 };
    }
  }

  /**
   * Async Queued Send to User: Enqueues to BullMQ if available, otherwise executes directly.
   */
  static async sendToUser(userId: string, payload: PushNotificationPayload) {
    const queue = getNotificationQueue();
    if (queue) {
      try {
        await queue.add('send-to-user', { userId, payload });
        return { success: true, queued: true };
      } catch (e) {
        console.warn('[FCM] Failed to enqueue send-to-user job, falling back to direct send:', e);
      }
    }
    return this.sendToUserDirect(userId, payload);
  }

  /**
   * Direct Dispatch to specific user with database record insertion.
   */
  static async sendToUserDirect(userId: string, payload: PushNotificationPayload) {
    this.initialize();

    // 1. Create in-app Notification record
    let notificationRecord = null;
    try {
      notificationRecord = await (prisma as any).notification.create({
        data: {
          userId,
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl || null,
          deepLink: payload.deepLink || null,
          type: payload.type || 'SYSTEM',
          data: payload.data || {}
        }
      });
    } catch (err) {
      console.warn('[FCM] Could not create in-app notification row:', err);
    }

    // 2. Fetch active device tokens for the user
    const tokens = await (prisma as any).deviceToken.findMany({
      where: { userId, isActive: true },
      select: { token: true, platform: true }
    });

    if (tokens.length === 0) {
      console.log(`[FCM] No active device tokens found for user ${userId}. In-app notification stored.`);
      return { success: true, deliveredCount: 0, notification: notificationRecord };
    }

    const tokenList = tokens.map((t: any) => t.token);
    const pushResult = await this.sendToTokensDirect(tokenList, payload);

    return {
      success: true,
      deliveredCount: pushResult.successCount,
      failedCount: pushResult.failureCount,
      notification: notificationRecord
    };
  }

  /**
   * Async Queued Multicast Send: Enqueues to BullMQ if available, otherwise executes directly.
   */
  static async sendToTokens(tokens: string[], payload: PushNotificationPayload) {
    const queue = getNotificationQueue();
    if (queue) {
      try {
        await queue.add('send-to-tokens', { tokens, payload });
        return { success: true, queued: true };
      } catch (e) {
        console.warn('[FCM] Failed to enqueue send-to-tokens job, falling back to direct send:', e);
      }
    }
    return this.sendToTokensDirect(tokens, payload);
  }

  /**
   * Direct multicast push notifications to a list of raw FCM tokens in chunks of 500.
   */
  static async sendToTokensDirect(tokens: string[], payload: PushNotificationPayload) {
    this.initialize();

    if (!tokens || tokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    // If running in sandbox mode without active Firebase app
    if (!this.app || !getApps().length) {
      console.log(`[FCM-Sandbox] Mock push dispatch to ${tokens.length} tokens:`, {
        title: payload.title,
        body: payload.body,
        deepLink: payload.deepLink,
        imageUrl: payload.imageUrl
      });
      return { successCount: tokens.length, failureCount: 0 };
    }

    let successCount = 0;
    let failureCount = 0;
    const invalidTokens: string[] = [];
    const messaging = getMessaging(this.app);
    const channelId = this.getChannelId(payload.type);

    // Process in chunks of 500 (Google FCM limit)
    const chunkSize = 500;
    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize);

      const message: MulticastMessage = {
        tokens: chunk,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {})
        },
        data: {
          title: payload.title,
          body: payload.body,
          deepLink: payload.deepLink || '/',
          type: payload.type || 'SYSTEM',
          channelId,
          ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
          ...(payload.data || {})
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId,
            priority: payload.type === 'ORDER_UPDATE' || payload.type === 'DELIVERY_DISPATCH' ? 'max' : 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
            ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {})
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          },
          fcmOptions: {
            ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {})
          }
        },
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: '/icon.png',
            badge: '/icon.png',
            ...(payload.imageUrl ? { image: payload.imageUrl } : {})
          },
          fcmOptions: {
            link: payload.deepLink || '/'
          }
        }
      };

      try {
        const response = await messaging.sendEachForMulticast(message);
        successCount += response.successCount;
        failureCount += response.failureCount;

        // Cleanup invalid or expired tokens
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success && resp.error) {
            const errorCode = resp.error.code;
            if (
              errorCode === 'messaging/registration-token-not-registered' ||
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/mismatched-credential'
            ) {
              invalidTokens.push(chunk[idx]);
            }
          }
        });
      } catch (err) {
        console.error('[FCM] Error sending chunk multicast:', err);
        failureCount += chunk.length;
      }
    }

    // Deactivate invalid tokens from DB asynchronously
    if (invalidTokens.length > 0) {
      (prisma as any).deviceToken.updateMany({
        where: { token: { in: invalidTokens } },
        data: { isActive: false }
      }).catch((e: any) => console.warn('[FCM] Failed to deactivate invalid tokens:', e));
    }

    return { successCount, failureCount };
  }

  /**
   * Broadcasts a marketing campaign (Queued or Direct).
   */
  static async broadcastCampaign(campaignData: {
    title: string;
    body: string;
    imageUrl?: string;
    deepLink?: string;
    targetAudience: 'ALL_USERS' | 'STORE_OWNERS' | 'RIDERS' | 'CUSTOM_SEGMENT' | 'SPECIFIC_USER' | string;
    targetFilter?: any;
    createdBy?: string;
  }) {
    // 1. Create campaign record immediately
    const campaign = await (prisma as any).notificationCampaign.create({
      data: {
        title: campaignData.title,
        body: campaignData.body,
        imageUrl: campaignData.imageUrl || null,
        deepLink: campaignData.deepLink || '/',
        targetAudience: campaignData.targetAudience,
        targetFilter: campaignData.targetFilter || null,
        status: 'PROCESSING',
        createdBy: campaignData.createdBy || null
      }
    });

    const queue = getNotificationQueue();
    if (queue) {
      try {
        await queue.add('broadcast-campaign', { campaignId: campaign.id, campaignData });
        return { success: true, queued: true, campaign, message: 'Campaign broadcast enqueued successfully' };
      } catch (e) {
        console.warn('[FCM] Failed to enqueue broadcast campaign, falling back to direct execution:', e);
      }
    }
    return this.broadcastCampaignDirect(campaignData, campaign.id);
  }

  /**
   * Direct execution of marketing campaign broadcast.
   */
  static async broadcastCampaignDirect(
    campaignData: {
      title: string;
      body: string;
      imageUrl?: string;
      deepLink?: string;
      targetAudience: 'ALL_USERS' | 'STORE_OWNERS' | 'RIDERS' | 'CUSTOM_SEGMENT' | 'SPECIFIC_USER' | string;
      targetFilter?: any;
      createdBy?: string;
    },
    existingCampaignId?: string
  ) {
    let campaign;
    if (existingCampaignId) {
      campaign = await (prisma as any).notificationCampaign.findUnique({
        where: { id: existingCampaignId }
      });
    }

    if (!campaign) {
      campaign = await (prisma as any).notificationCampaign.create({
        data: {
          title: campaignData.title,
          body: campaignData.body,
          imageUrl: campaignData.imageUrl || null,
          deepLink: campaignData.deepLink || '/',
          targetAudience: campaignData.targetAudience,
          targetFilter: campaignData.targetFilter || null,
          status: 'PROCESSING',
          createdBy: campaignData.createdBy || null
        }
      });
    }

    try {
      let targetUserIds: string[] = [];

      if (campaignData.targetAudience === 'SPECIFIC_USER' && campaignData.targetFilter?.userId) {
        targetUserIds = [campaignData.targetFilter.userId];
      } else if (campaignData.targetAudience === 'SPECIFIC_USER' && campaignData.targetFilter?.searchQuery) {
        const q = campaignData.targetFilter.searchQuery;
        const matched = await prisma.user.findMany({
          where: {
            OR: [
              { phone: { contains: q } },
              { email: { contains: q } },
              { name: { contains: q, mode: 'insensitive' } }
            ]
          },
          select: { id: true },
          take: 20
        });
        targetUserIds = matched.map(u => u.id);
      } else if (campaignData.targetAudience === 'STORE_OWNERS') {
        const storeUsers = await prisma.storeUser.findMany({
          select: { userId: true },
          distinct: ['userId']
        });
        targetUserIds = storeUsers.map(su => su.userId);
      } else if (campaignData.targetAudience === 'RIDERS') {
        const riders = await prisma.deliveryPartner.findMany({
          select: { userId: true }
        });
        targetUserIds = riders.map(r => r.userId);
      } else {
        // ALL_USERS or Location filtered
        const where: any = {};
        if (campaignData.targetFilter?.city) {
          where.city = { contains: campaignData.targetFilter.city, mode: 'insensitive' };
        }
        const users = await prisma.user.findMany({
          where,
          select: { id: true }
        });
        targetUserIds = users.map(u => u.id);
      }

      if (targetUserIds.length === 0) {
        await (prisma as any).notificationCampaign.update({
          where: { id: campaign.id },
          data: { status: 'SENT', sentCount: 0, successCount: 0, failureCount: 0 }
        });
        return { success: true, campaign, deliveredCount: 0 };
      }

      // Fetch active device tokens for all target users
      const deviceTokens = await (prisma as any).deviceToken.findMany({
        where: {
          userId: { in: targetUserIds },
          isActive: true
        },
        select: { token: true }
      });

      const tokenList = deviceTokens.map((dt: any) => dt.token);

      // Create in-app notifications in batch
      const notificationsData = targetUserIds.map(uid => ({
        userId: uid,
        title: campaignData.title,
        body: campaignData.body,
        imageUrl: campaignData.imageUrl || null,
        deepLink: campaignData.deepLink || '/',
        type: 'MARKETING'
      }));

      // Insert in chunks of 500
      for (let i = 0; i < notificationsData.length; i += 500) {
        const chunk = notificationsData.slice(i, i + 500);
        await (prisma as any).notification.createMany({
          data: chunk
        }).catch((e: any) => console.warn('[FCM] Bulk in-app notification creation error:', e));
      }

      // Dispatch FCM Push
      const pushResult = await this.sendToTokensDirect(tokenList, {
        title: campaignData.title,
        body: campaignData.body,
        imageUrl: campaignData.imageUrl,
        deepLink: campaignData.deepLink,
        type: 'MARKETING'
      });

      // Update Campaign Status
      const updatedCampaign = await (prisma as any).notificationCampaign.update({
        where: { id: campaign.id },
        data: {
          status: 'SENT',
          sentCount: targetUserIds.length,
          successCount: pushResult.successCount,
          failureCount: pushResult.failureCount,
          sentAt: new Date()
        }
      });

      return {
        success: true,
        campaign: updatedCampaign,
        deliveredCount: pushResult.successCount,
        failureCount: pushResult.failureCount
      };
    } catch (err: any) {
      console.error('[FCM] Error executing campaign broadcast:', err);
      await (prisma as any).notificationCampaign.update({
        where: { id: campaign.id },
        data: { status: 'FAILED' }
      });
      throw err;
    }
  }

  // ==========================================
  // Automated Event Triggers
  // ==========================================

  /**
   * Automated Trigger: Order & Delivery Lifecycle Status Updates
   */
  static async notifyOrderStatusChanged(orderId: string, newStatus: string, deliveryOtp?: string) {
    const queue = getNotificationQueue();
    if (queue) {
      try {
        await queue.add('order-lifecycle-push', { orderId, status: newStatus, deliveryOtp });
        return { success: true, queued: true };
      } catch (e) {
        console.warn('[FCM] Failed to queue order notification, falling back to direct:', e);
      }
    }
    return this.notifyOrderStatusChangedDirect(orderId, newStatus, deliveryOtp);
  }

  static async notifyOrderStatusChangedDirect(orderId: string, newStatus: string, deliveryOtp?: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          buyer: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } }
        }
      });

      if (!order || !order.buyerId) return;

      let title = 'Order Update';
      let body = `Your order #${orderId.slice(0, 8).toUpperCase()} status is now ${newStatus}.`;
      let type: PushNotificationPayload['type'] = 'ORDER_UPDATE';

      switch (newStatus) {
        case 'CONFIRMED':
          title = 'Order Confirmed! 🛍️';
          body = `Great news! ${order.store?.name || 'The store'} has accepted your order.`;
          break;
        case 'PACKED':
        case 'PROCESSING':
          title = 'Order Packed 📦';
          body = `Your items are packed and ready for pickup.`;
          break;
        case 'SHIPPED':
        case 'OUT_FOR_DELIVERY':
          title = 'Out for Delivery 🚴';
          body = deliveryOtp 
            ? `Your rider is on the way! Your Delivery OTP is ${deliveryOtp}.`
            : `Your rider is on the way! Tap to track live delivery.`;
          type = 'DELIVERY_DISPATCH';
          break;
        case 'DELIVERED':
          title = 'Order Delivered! 🎉';
          body = `Enjoy your order! Rate your store & rider experience.`;
          break;
        case 'CANCELLED':
          title = 'Order Cancelled';
          body = `Your order #${orderId.slice(0, 8).toUpperCase()} has been cancelled.`;
          break;
      }

      await this.sendToUserDirect(order.buyerId, {
        title,
        body,
        deepLink: `/orders/${orderId}/track`,
        type,
        data: { orderId, status: newStatus, ...(deliveryOtp ? { deliveryOtp } : {}) }
      });
    } catch (err) {
      console.warn('[FCM] Failed to dispatch order status notification:', err);
    }
  }

  /**
   * Automated Trigger: Notify Store Sellers/Owners of New Order Received
   */
  static async notifySellerNewOrder(
    storeId: string, 
    orderId: string, 
    details: { itemsCount: number; totalAmount: number; buyerName?: string }
  ) {
    try {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: {
          users: { select: { userId: true } }
        }
      });
      if (!store) return;

      const title = '🔔 New Order Received!';
      const shortOrderId = orderId.slice(0, 8).toUpperCase();
      const body = `Order #${shortOrderId} for ₹${details.totalAmount} (${details.itemsCount} items) has been placed. Tap to accept & prepare.`;
      const deepLink = `/seller/orders/details?id=${orderId}`;

      // 1. In-App Seller Notification
      try {
        await prisma.sellerNotification.create({
          data: {
            storeId,
            type: NotificationType.ORDER,
            title: `New Order Received #${shortOrderId}`,
            message: `You have received a new order for ${details.itemsCount} items (Total: ₹${details.totalAmount}).`,
            linkUrl: deepLink
          }
        });
      } catch (err) {
        console.warn('[FCM] Error creating sellerNotification row:', err);
      }

      // 2. Dispatch FCM Push to all owners/managers of this store
      const storeUserIds = store.users.map((u: any) => u.userId);
      if (storeUserIds.length > 0) {
        const tokens = await (prisma as any).deviceToken.findMany({
          where: { userId: { in: storeUserIds }, isActive: true },
          select: { token: true }
        });

        if (tokens.length > 0) {
          await this.sendToTokensDirect(tokens.map((t: any) => t.token), {
            title,
            body,
            deepLink,
            type: 'ORDER_UPDATE',
            data: { orderId, storeId, type: 'NEW_ORDER' }
          });
        }
      }
    } catch (err) {
      console.warn('[FCM] Error dispatching seller new order notification:', err);
    }
  }

  /**
   * Automated Trigger: Notify Customer on Order Placement
   */
  static async notifyCustomerOrderPlaced(
    buyerId: string,
    orderId: string,
    details: { storeName: string; totalAmount: number; itemsCount: number }
  ) {
    try {
      const shortOrderId = orderId.slice(0, 8).toUpperCase();
      const title = '🛍️ Order Placed Successfully!';
      const body = `Your order #${shortOrderId} at ${details.storeName || 'the store'} (₹${details.totalAmount}) is confirmed and sent to seller.`;
      const deepLink = `/orders/${orderId}/track`;

      await this.sendToUserDirect(buyerId, {
        title,
        body,
        deepLink,
        type: 'ORDER_UPDATE',
        data: { orderId, status: 'PENDING' }
      });
    } catch (err) {
      console.warn('[FCM] Error dispatching customer order placed notification:', err);
    }
  }

  /**
   * Automated Trigger: Notify Delivery Partner / Rider of Assigned Delivery Task
   */
  static async notifyRiderDeliveryAssigned(
    riderUserId: string,
    orderId: string,
    details: { storeName: string; pickupAddress?: string; deliveryAddress?: string; earning?: number }
  ) {
    try {
      const shortOrderId = orderId.slice(0, 8).toUpperCase();
      const title = '🚴 New Delivery Task Assigned!';
      const body = `Order #${shortOrderId} from ${details.storeName || 'partner store'} is ready for pickup.${details.earning ? ` Earning: ₹${details.earning}` : ''} Tap to start route.`;
      const deepLink = `/delivery/orders/${orderId}`;

      await this.sendToUserDirect(riderUserId, {
        title,
        body,
        deepLink,
        type: 'DELIVERY_DISPATCH',
        data: { orderId, type: 'DELIVERY_ASSIGNED' }
      });
    } catch (err) {
      console.warn('[FCM] Error dispatching rider assignment notification:', err);
    }
  }

  /**
   * Automated Trigger: Store Follower Notification on New Product Upload
   */
  static async notifyStoreNewProduct(storeId: string, productId: string, productName: string, imageUrl?: string) {
    const queue = getNotificationQueue();
    if (queue) {
      try {
        await queue.add('new-product-push', { storeId, productId, productName, imageUrl });
        return { success: true, queued: true };
      } catch (e) {
        console.warn('[FCM] Failed to queue product notification, calling direct:', e);
      }
    }
    return this.notifyStoreNewProductDirect(storeId, productId, productName, imageUrl);
  }

  static async notifyStoreNewProductDirect(storeId: string, productId: string, productName: string, imageUrl?: string) {
    try {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: {
          users: { select: { userId: true } }
        }
      });

      if (!store) return;

      const storeOwnerUserIds = store.users.map(u => u.userId);

      // Find all users who follow the store owners
      const followers = await prisma.follow.findMany({
        where: {
          followingId: { in: storeOwnerUserIds }
        },
        select: { followerId: true },
        distinct: ['followerId']
      });

      if (followers.length === 0) return;

      const followerIds = followers.map(f => f.followerId);
      const title = `New at ${store.name} 🛍️`;
      const body = `${store.name} just added "${productName}". Tap to check it out!`;
      const deepLink = `/product/${productId}`;

      // Insert in-app notifications
      const notifs = followerIds.map(uid => ({
        userId: uid,
        title,
        body,
        imageUrl: imageUrl || null,
        deepLink,
        type: 'NEW_PRODUCT'
      }));

      await (prisma as any).notification.createMany({ data: notifs }).catch(() => {});

      // Dispatch FCM Push
      const deviceTokens = await (prisma as any).deviceToken.findMany({
        where: { userId: { in: followerIds }, isActive: true },
        select: { token: true }
      });

      await this.sendToTokensDirect(deviceTokens.map((dt: any) => dt.token), {
        title,
        body,
        imageUrl,
        deepLink,
        type: 'NEW_PRODUCT',
        data: { storeId, productId }
      });
    } catch (err) {
      console.warn('[FCM] Error dispatching new product follower notification:', err);
    }
  }

  /**
   * Automated Trigger: Store Follower Notification on New 24h Story
   */
  static async notifyStoreNewStory(storeId: string, storyId: string, storeName?: string, mediaUrl?: string) {
    const queue = getNotificationQueue();
    if (queue) {
      try {
        await queue.add('new-story-push', { storeId, storyId, storeName, mediaUrl });
        return { success: true, queued: true };
      } catch (e) {
        console.warn('[FCM] Failed to queue story notification, calling direct:', e);
      }
    }
    return this.notifyStoreNewStoryDirect(storeId, storyId, storeName, mediaUrl);
  }

  static async notifyStoreNewStoryDirect(storeId: string, storyId: string, storeName?: string, mediaUrl?: string) {
    try {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: { users: { select: { userId: true } } }
      });

      if (!store) return;
      const sName = storeName || store.name;
      const storeOwnerUserIds = store.users.map(u => u.userId);

      const followers = await prisma.follow.findMany({
        where: { followingId: { in: storeOwnerUserIds } },
        select: { followerId: true },
        distinct: ['followerId']
      });

      if (followers.length === 0) return;
      const followerIds = followers.map(f => f.followerId);
      const title = `${sName} posted a new Story! ⚡`;
      const body = `Watch the latest 24h story from ${sName}.`;
      const deepLink = `/store/${storeId}?story=${storyId}`;

      const deviceTokens = await (prisma as any).deviceToken.findMany({
        where: { userId: { in: followerIds }, isActive: true },
        select: { token: true }
      });

      await this.sendToTokensDirect(deviceTokens.map((dt: any) => dt.token), {
        title,
        body,
        imageUrl: mediaUrl,
        deepLink,
        type: 'NEW_STORY',
        data: { storeId, storyId }
      });
    } catch (err) {
      console.warn('[FCM] Error dispatching new story notification:', err);
    }
  }

  /**
   * Automated Trigger: Creator / Store Follower Notification on New Post/Reel
   */
  static async notifyFollowersNewPost(creatorUserId: string, itemId: string, type: 'POST' | 'REEL', titleOrCaption?: string, mediaUrl?: string) {
    const queue = getNotificationQueue();
    if (queue) {
      try {
        await queue.add('new-post-push', { creatorUserId, itemId, type, titleOrCaption, mediaUrl });
        return { success: true, queued: true };
      } catch (e) {
        console.warn('[FCM] Failed to queue post notification, calling direct:', e);
      }
    }
    return this.notifyFollowersNewPostDirect(creatorUserId, itemId, type, titleOrCaption, mediaUrl);
  }

  static async notifyFollowersNewPostDirect(creatorUserId: string, itemId: string, type: 'POST' | 'REEL', titleOrCaption?: string, mediaUrl?: string) {
    try {
      const creator = await prisma.user.findUnique({
        where: { id: creatorUserId },
        select: { name: true }
      });

      const creatorName = creator?.name || 'Someone you follow';
      const followers = await prisma.follow.findMany({
        where: { followingId: creatorUserId },
        select: { followerId: true }
      });

      if (followers.length === 0) return;
      const followerIds = followers.map(f => f.followerId);

      const title = type === 'REEL' ? `${creatorName} shared a new Reel 🎥` : `${creatorName} published a new Post 📸`;
      const body = titleOrCaption ? titleOrCaption.slice(0, 100) : `Tap to view the new ${type.toLowerCase()}!`;
      const deepLink = type === 'REEL' ? `/reel/${itemId}` : `/post/${itemId}`;

      const deviceTokens = await (prisma as any).deviceToken.findMany({
        where: { userId: { in: followerIds }, isActive: true },
        select: { token: true }
      });

      await this.sendToTokensDirect(deviceTokens.map((dt: any) => dt.token), {
        title,
        body,
        imageUrl: mediaUrl,
        deepLink,
        type: 'NEW_POST',
        data: { itemId, type }
      });
    } catch (err) {
      console.warn('[FCM] Error dispatching post/reel notification:', err);
    }
  }

  // ==========================================
  // In-App Notification Feed Methods
  // ==========================================

  static async getUserNotifications(userId: string, page = 1, limit = 20, type?: string) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const where: any = { userId };
    if (type && type !== 'ALL') {
      where.type = type;
    }

    const [total, unreadCount, items] = await Promise.all([
      (prisma as any).notification.count({ where }),
      (prisma as any).notification.count({ where: { userId, isRead: false } }),
      (prisma as any).notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit
      })
    ]);

    return {
      total,
      unreadCount,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
      items
    };
  }

  static async markAsRead(userId: string, notificationId: string) {
    return (prisma as any).notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() }
    });
  }

  static async markAllAsRead(userId: string) {
    return (prisma as any).notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });
  }
}
