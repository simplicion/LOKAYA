const assert = require('assert');
const { OrderService } = require('../modules/order/application/order.service');
const { prisma } = require('@workspace/db');

async function run() {
  console.log('🧪 RUNNING TEST 09: Customer 8-Stage Synchronized Live Tracking Telemetry');

  let customer = await prisma.user.findFirst({ where: { email: 'test_buyer_e2e@lokaya.com' } });
  if (!customer) customer = await prisma.user.create({ data: { email: 'test_buyer_e2e@lokaya.com', phone: '+919876543210', name: 'Test Customer' } });

  let merchant = await prisma.user.findFirst({ where: { email: 'test_merchant_e2e@lokaya.com' } });
  if (!merchant) merchant = await prisma.user.create({ data: { email: 'test_merchant_e2e@lokaya.com', phone: '+919876543211', name: 'Test Store Owner' } });

  let store = await prisma.store.findFirst({ where: { users: { some: { userId: merchant.id } } } });
  if (!store) store = await prisma.store.create({ data: { name: 'Lokaya Organic Hub', address: 'Sector 14, Main Road', contactPhone: '+919876543211', users: { create: { userId: merchant.id } } } });

  let partnerUser = await prisma.user.findFirst({ where: { email: 'test_rider_offline@lokaya.com' } });
  if (!partnerUser) partnerUser = await prisma.user.create({ data: { email: 'test_rider_offline@lokaya.com', phone: '+919876543299', name: 'Arjun Verma (Offline Rider)' } });

  let deliveryProfile = await prisma.deliveryPartner.upsert({
    where: { userId: partnerUser.id },
    update: { isOnline: false, vehicleType: 'MOTORCYCLE', status: 'APPROVED' },
    create: { userId: partnerUser.id, isOnline: false, vehicleType: 'MOTORCYCLE', status: 'APPROVED', vehicleNumber: 'DL 04 EF 1234', vehiclePhotoUrl: 'https://test.com/bike.jpg', vehicleDocumentUrl: 'https://test.com/rc.jpg', selfieUrl: 'https://test.com/selfie.jpg', identityDocumentUrl: 'https://test.com/id.jpg' }
  });

  let testProduct = await prisma.product.findFirst({ where: { storeId: store.id } });
  if (!testProduct) testProduct = await prisma.product.create({ data: { storeId: store.id, title: 'Fresh Apples (1kg)', price: 320, stock: 50 } });

  const order = await prisma.order.create({
    data: {
      buyerId: customer.id,
      storeId: store.id,
      status: 'CONFIRMED',
      totalAmount: 320,
      deliveryAddress: 'Sector 56, Huda Market',
      deliveryOtp: '6789',
      items: {
        create: [{ productId: testProduct.id, sku: 'APL-001', productName: 'Fresh Apples', quantity: 1, priceAt: 320 }]
      }
    }
  });

  const pickupOtp = await prisma.orderPickupOtp.create({
    data: {
      orderId: order.id,
      otpCode: '4321',
      qrToken: `QR-${order.id.slice(0, 8)}`,
      isUsed: false,
      expiresAt: new Date(Date.now() + 86400000)
    }
  });

  const assignment = await prisma.deliveryAssignment.create({
    data: {
      orderId: order.id,
      deliveryPartnerId: deliveryProfile.id,
      status: 'ASSIGNED',
      deliveryFee: 50,
    }
  });

  // Call getOrderTracking
  const tracking = await OrderService.getOrderTracking(order.id);

  assert.strictEqual(tracking.orderId, order.id);
  assert.strictEqual(tracking.deliveryOtp, '6789', 'Tracking must include Customer Delivery OTP');
  assert(Array.isArray(tracking.timeline), 'Timeline must be an array of milestone events');
  assert.strictEqual(tracking.timeline.length, 9, 'Timeline must contain exactly 9 synchronized stages');

  // Verify milestone statuses
  const statuses = tracking.timeline.map(t => t.status);
  assert(statuses.includes('ORDER_PLACED'));
  assert(statuses.includes('CONFIRMED'));
  assert(statuses.includes('PACKED'));
  assert(statuses.includes('ASSIGNED'));
  assert(statuses.includes('HEADING_TO_STORE'));
  assert(statuses.includes('SHIPPED'));
  assert(statuses.includes('OUT_FOR_DELIVERY'));
  assert(statuses.includes('ARRIVED_AT_DESTINATION'));
  assert(statuses.includes('DELIVERED'));

  console.log(`   ✅ Tracking Returned: 9 Stages synchronized for Order #${order.id.slice(0, 8)}`);
  console.log(`   ✅ Delivery OTP for Customer: ${tracking.deliveryOtp}`);
  console.log(`   ✅ Assigned Partner: ${tracking.deliveryPartner?.name} (${tracking.deliveryPartner?.vehicleNumber})`);

  // Cleanup
  await prisma.deliveryAssignment.delete({ where: { id: assignment.id } });
  await prisma.orderPickupOtp.delete({ where: { id: pickupOtp.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });

  console.log('🎉 TEST 09 PASSED: Customer 8-stage tracking telemetry verified successfully!\n');
}

run().catch((err) => {
  console.error('❌ TEST 09 FAILED:', err);
  process.exit(1);
});
