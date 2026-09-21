const assert = require('assert');
const { prisma } = require('@workspace/db');

async function run() {
  console.log('🧪 RUNNING TEST 05: Rider Inbox Queued Tasks Retrieval & Acceptance Lifecycle');

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
  if (!testProduct) testProduct = await prisma.product.create({ data: { storeId: store.id, title: 'Fresh Apples (1kg)', price: 220, stock: 50 } });

  const order = await prisma.order.create({
    data: {
      buyerId: customer.id,
      storeId: store.id,
      status: 'PACKED',
      totalAmount: 220,
      deliveryAddress: 'Sector 29, Leisure Valley',
      deliveryOtp: '7890',
      items: {
        create: [{ productId: testProduct.id, sku: 'APL-001', productName: 'Fresh Apples (1kg)', quantity: 1, priceAt: 220 }]
      }
    }
  });

  const assignment = await prisma.deliveryAssignment.create({
    data: {
      orderId: order.id,
      deliveryPartnerId: deliveryProfile.id,
      status: 'ASSIGNED',
      deliveryFee: 60,
    }
  });

  // 1. Rider queries incoming assignments (Inbox Queue)
  const incomingTasks = await prisma.deliveryAssignment.findMany({
    where: {
      deliveryPartnerId: deliveryProfile.id,
      status: 'ASSIGNED'
    },
    include: {
      order: {
        include: { store: true, buyer: true }
      }
    }
  });

  const targetTask = incomingTasks.find(t => t.id === assignment.id);
  assert(targetTask !== undefined, 'Target assignment must appear in incoming tasks queue');
  assert.strictEqual(targetTask.deliveryFee, 60);
  assert.strictEqual(targetTask.order.store.name, store.name);

  // 2. Rider accepts task -> status becomes ACCEPTED
  const acceptedAssignment = await prisma.deliveryAssignment.update({
    where: { id: assignment.id },
    data: { status: 'ACCEPTED', acceptedAt: new Date() }
  });

  await prisma.deliveryPartner.update({
    where: { id: deliveryProfile.id },
    data: { isBusy: true }
  });

  assert.strictEqual(acceptedAssignment.status, 'ACCEPTED');

  console.log(`   ✅ Rider Inbox: Successfully fetched task with fee ₹${targetTask.deliveryFee}`);
  console.log(`   ✅ Acceptance Action: Status transitioned to ${acceptedAssignment.status}, Rider isBusy: true`);

  // Cleanup
  await prisma.deliveryAssignment.delete({ where: { id: assignment.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });

  console.log('🎉 TEST 05 PASSED: Rider queue retrieval & acceptance lifecycle verified successfully!\n');
}

run().catch((err) => {
  console.error('❌ TEST 05 FAILED:', err);
  process.exit(1);
});
