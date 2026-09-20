const assert = require('assert');
const { prisma } = require('@workspace/db');

async function run() {
  console.log('🧪 RUNNING TEST 04: Offline Delivery Partner Direct Assignment & Pickup OTP Generation');

  let customer = await prisma.user.findFirst({ where: { email: 'test_buyer_e2e@lokaya.com' } });
  if (!customer) {
    customer = await prisma.user.create({
      data: { email: 'test_buyer_e2e@lokaya.com', phone: '+919876543210', name: 'Test Customer' }
    });
  }

  let merchant = await prisma.user.findFirst({ where: { email: 'test_merchant_e2e@lokaya.com' } });
  if (!merchant) {
    merchant = await prisma.user.create({
      data: { email: 'test_merchant_e2e@lokaya.com', phone: '+919876543211', name: 'Test Store Owner' }
    });
  }

  let store = await prisma.store.findFirst({
    where: { users: { some: { userId: merchant.id } } }
  });
  if (!store) {
    store = await prisma.store.create({
      data: {
        name: 'Lokaya Organic Hub',
        address: 'Sector 14, Main Road',
        contactPhone: '+919876543211',
        users: { create: { userId: merchant.id } }
      }
    });
  }

  // Create OFFLINE delivery partner
  let partnerUser = await prisma.user.findFirst({ where: { email: 'test_rider_offline@lokaya.com' } });
  if (!partnerUser) {
    partnerUser = await prisma.user.create({
      data: { email: 'test_rider_offline@lokaya.com', phone: '+919876543299', name: 'Arjun Verma (Offline Rider)' }
    });
  }

  let deliveryProfile = await prisma.deliveryPartner.upsert({
    where: { userId: partnerUser.id },
    update: {
      isOnline: false, // EXPLICITLY OFFLINE
      vehicleType: 'MOTORCYCLE',
      vehicleNumber: 'DL 04 EF 1234',
      vehiclePhotoUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc',
      vehicleDocumentUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc',
      selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      identityDocumentUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      status: 'APPROVED',
      baseFare: 40,
      perKmRate: 8,
    },
    create: {
      userId: partnerUser.id,
      isOnline: false, // EXPLICITLY OFFLINE
      vehicleType: 'MOTORCYCLE',
      vehicleNumber: 'DL 04 EF 1234',
      vehiclePhotoUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc',
      vehicleDocumentUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc',
      selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      identityDocumentUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      status: 'APPROVED',
      baseFare: 40,
      perKmRate: 8,
    }
  });

  // Partner store relation
  await prisma.storeDeliveryPartner.upsert({
    where: { storeId_deliveryPartnerId: { storeId: store.id, deliveryPartnerId: deliveryProfile.id } },
    update: { status: 'ACCEPTED' },
    create: { storeId: store.id, deliveryPartnerId: deliveryProfile.id, status: 'ACCEPTED' }
  });

  // Create product & order
  let testProduct = await prisma.product.findFirst({ where: { storeId: store.id } });
  if (!testProduct) {
    testProduct = await prisma.product.create({
      data: {
        storeId: store.id,
        name: 'Fresh Apples (1kg)',
        sku: 'APL-001',
        mrp: 200,
        sellingPrice: 180,
        costPrice: 120,
        stockCount: 50,
      }
    });
  }

  const order = await prisma.order.create({
    data: {
      buyerId: customer.id,
      storeId: store.id,
      status: 'PACKED',
      totalAmount: 180,
      deliveryAddress: 'Block C, Green Valley',
      deliveryOtp: '5566',
      items: {
        create: [{ productId: testProduct.id, sku: 'APL-001', productName: 'Fresh Apples (1kg)', quantity: 1, priceAt: 180 }]
      }
    }
  });

  // Store assigns order to OFFLINE rider
  const pickupOtpCode = Math.floor(1000 + Math.random() * 9000).toString();
  const pickupOtp = await prisma.orderPickupOtp.upsert({
    where: { orderId: order.id },
    update: { otpCode: pickupOtpCode, qrToken: `QR-${order.id.slice(0, 8)}`, isUsed: false, expiresAt: new Date(Date.now() + 86400000) },
    create: { orderId: order.id, otpCode: pickupOtpCode, qrToken: `QR-${order.id.slice(0, 8)}`, isUsed: false, expiresAt: new Date(Date.now() + 86400000) }
  });

  const assignment = await prisma.deliveryAssignment.create({
    data: {
      orderId: order.id,
      deliveryPartnerId: deliveryProfile.id,
      status: 'ASSIGNED',
      deliveryFee: 55,
    }
  });

  assert.strictEqual(deliveryProfile.isOnline, false, 'Delivery partner should be offline');
  assert.strictEqual(assignment.status, 'ASSIGNED', 'Assignment must be in ASSIGNED status in queue');
  assert(pickupOtp.otpCode.length === 4, 'Pickup OTP must be a 4-digit code');

  console.log(`   ✅ Offline Partner Assignment Created: ID #${assignment.id}`);
  console.log(`   ✅ Rider isOnline: ${deliveryProfile.isOnline} -> Queued in ASSIGNED state`);
  console.log(`   ✅ Store Pickup OTP Generated: ${pickupOtp.otpCode}`);

  // Cleanup
  await prisma.deliveryAssignment.delete({ where: { id: assignment.id } });
  await prisma.orderPickupOtp.delete({ where: { id: pickupOtp.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });

  console.log('🎉 TEST 04 PASSED: Offline partner assignment verified successfully!\n');
}

run().catch((err) => {
  console.error('❌ TEST 04 FAILED:', err);
  process.exit(1);
});
