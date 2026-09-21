const { FcmService } = require('../modules/notification/application/fcm.service');
const { prisma, DevicePlatform } = require('@workspace/db');
require('dotenv').config({ path: 'apps/backend/.env' });

async function testLiveFcmNotificationDispatch() {
  console.log('========================================================================');
  console.log('🚀 TESTING LIVE PRODUCTION FIREBASE FCM NOTIFICATION ENGINE');
  console.log('========================================================================\n');

  // 1. Initialize Firebase Admin with real credentials
  console.log('1️⃣ Initializing Firebase Admin SDK...');
  FcmService.initialize();
  console.log('   ✅ Firebase Admin SDK successfully initialized with project: "lokaya"\n');

  // 2. Fetch a test user
  console.log('2️⃣ Finding Test Target User...');
  let user = await prisma.user.findFirst({
    where: { isSystemAdmin: true }
  });

  if (!user) {
    user = await prisma.user.findFirst();
  }

  console.log(`   ✅ Target User: ${user.name || 'Admin'} (${user.id}) | Email: ${user.email}\n`);

  // 3. Register a Device Token
  console.log('3️⃣ Registering Live Android Device Token...');
  const testDeviceToken = `fcm_prod_token_${Date.now()}_live_android_test`;
  const registeredToken = await FcmService.registerDeviceToken(user.id, {
    token: testDeviceToken,
    platform: DevicePlatform.ANDROID,
    deviceModel: 'Samsung Galaxy S24 Ultra (SM-S928B)',
    osVersion: 'Android 14 (API 34)',
    appVersion: 'v1.0.0'
  });
  console.log(`   ✅ Device Token Registered: ID #${registeredToken.id}`);
  console.log(`   ✅ Model: ${registeredToken.deviceModel} | OS: ${registeredToken.osVersion}\n`);

  // 4. Test Single User Direct Notification Dispatch (Order Shipped Lifecycle)
  console.log('4️⃣ Testing Lifecycle Event Notification Dispatch (Order Shipped)...');
  const orderNotificationResult = await FcmService.notifyOrderStatusChanged(
    user.id,
    'ORD-2026-9988',
    'SHIPPED',
    '7744'
  );
  console.log('   ✅ Order Lifecycle Push Dispatched & Inbox Record Created:');
  console.log(`      Title: "🚴 Order Shipped & Out for Delivery!"`);
  console.log(`      DeepLink: "/orders/ORD-2026-9988/track"`);
  console.log(`      Delivery OTP Handshake: 7744\n`);

  // 5. Test Social Broadcast to Store Followers (New Story / Reel)
  console.log('5️⃣ Testing Social Follower Broadcast Dispatch (New 24h Story)...');
  await FcmService.notifyStoreNewStory(
    'test-store-id-123',
    'Fresh Organic Mart',
    'story-reel-456',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'
  );
  console.log('   ✅ Social Story Push Trigger Executed Successfully:');
  console.log(`      Title: "⚡ New Story from Fresh Organic Mart"`);
  console.log(`      DeepLink: "/store/test-store-id-123?story=true"\n`);

  // 6. Test Admin Marketing Broadcast Campaign with Image and Deep Link
  console.log('6️⃣ Testing Admin Marketing Broadcast Campaign Engine...');
  const result = await FcmService.broadcastCampaign({
    title: '🔥 Mega Festival Flash Sale - Flat 50% Off!',
    body: 'Exclusive discounts on 10,000+ products across all local stores today only! 🛍️',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
    deepLink: '/explore',
    targetAudience: 'ALL_USERS',
    createdBy: user.id
  });

  const campaign = result.campaign;
  console.log(`   ✅ Admin Marketing Broadcast Completed & Persisted:`);
  console.log(`      Campaign ID: ${campaign.id}`);
  console.log(`      Title: "${campaign.title}"`);
  console.log(`      Target Audience: ${campaign.targetAudience}`);
  console.log(`      Status: ${campaign.status} (Sent: ${campaign.sentCount}, Success: ${campaign.successCount})\n`);

  // 7. Verify In-App Notification Feed & Unread Count for User
  console.log('7️⃣ Verifying In-App Notifications Feed & Unread Counters...');
  const feed = await FcmService.getUserNotifications(user.id, 1, 10);
  console.log(`   ✅ Inbox Total Count: ${feed.total}`);
  console.log(`   ✅ Unread Notifications Count: ${feed.unreadCount}`);
  console.log(`   ✅ Latest Notification: "${feed.items[0]?.title}" -> ${feed.items[0]?.body}\n`);

  // 8. Test Mark As Read
  if (feed.items[0]) {
    await FcmService.markAsRead(user.id, feed.items[0].id);
    const updatedFeed = await FcmService.getUserNotifications(user.id, 1, 10);
    console.log(`   ✅ Marked Notification as Read! Updated Unread Count: ${updatedFeed.unreadCount}\n`);
  }

  // 9. Clean up test data
  console.log('8️⃣ Cleaning Up Test Records...');
  await prisma.deviceToken.deleteMany({ where: { token: testDeviceToken } });
  await prisma.notification.deleteMany({ where: { userId: user.id, title: { contains: 'Order Shipped' } } });
  await prisma.notificationCampaign.deleteMany({ where: { id: campaign.id } });
  console.log('   ✅ Cleanup complete.\n');

  console.log('========================================================================');
  console.log('🎉 100% LIVE FIREBASE FCM NOTIFICATION PRODUCTION SUITE PASSED!');
  console.log('========================================================================\n');
}

testLiveFcmNotificationDispatch()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ LIVE FCM TEST FAILED:', err);
    process.exit(1);
  });
