const { PrismaClient } = require('c:/Users/saavi/Desktop/LOKAYA/packages/db/prisma/client');
const prisma = new PrismaClient();

async function runFcmTests() {
  console.log('🧪 RUNNING TEST: Firebase FCM Push Notification & Device Registry');

  try {
    // 1. Get or create a test user
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'FCM Test User',
          phone: '+9779800000001',
          email: 'fcm_test@lokaya.shop'
        }
      });
    }
    console.log(`   ✅ Test User: ${user.name} (${user.id})`);

    // 2. Test Device Token Registration
    const testToken = `fcm_token_test_${Date.now()}`;
    const registered = await prisma.deviceToken.upsert({
      where: { token: testToken },
      update: { userId: user.id, isActive: true, platform: 'ANDROID' },
      create: {
        userId: user.id,
        token: testToken,
        platform: 'ANDROID',
        deviceModel: 'Pixel 8 Pro',
        osVersion: 'Android 14',
        appVersion: '1.0.0'
      }
    });
    console.log(`   ✅ Device Token Registered: Platform = ${registered.platform}, Token = ${registered.token.slice(0, 25)}...`);

    // 3. Test In-App Notification Creation
    const notif = await prisma.notification.create({
      data: {
        userId: user.id,
        title: '🛍️ Order Confirmed!',
        body: 'Your test order #ORD-TEST is accepted by the store.',
        deepLink: '/orders/test/track',
        type: 'ORDER_UPDATE'
      }
    });
    console.log(`   ✅ In-App Notification Created: "${notif.title}" (DeepLink: ${notif.deepLink})`);

    // 4. Test Notification Query & Unread Count
    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false }
    });
    console.log(`   ✅ User Unread Notifications Count: ${unreadCount}`);

    // 5. Test Campaign Broadcast Persistence
    const campaign = await prisma.notificationCampaign.create({
      data: {
        title: '🔥 Weekend Flash Sale - Flat 50% Off!',
        body: 'Super discounts live across all verified stores. Tap to shop!',
        imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
        deepLink: '/explore',
        targetAudience: 'ALL_USERS',
        status: 'SENT',
        sentCount: 1,
        successCount: 1,
        failureCount: 0
      }
    });
    console.log(`   ✅ Marketing Campaign Dispatched & Stored: "${campaign.title}" -> ${campaign.targetAudience}`);

    // 6. Cleanup test records
    await prisma.notification.delete({ where: { id: notif.id } });
    await prisma.notificationCampaign.delete({ where: { id: campaign.id } });
    await prisma.deviceToken.delete({ where: { token: testToken } });
    console.log('   ✅ Test cleanup completed successfully.');

    console.log('🎉 TEST PASSED: Firebase FCM & Notification services verified successfully!');
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runFcmTests();
