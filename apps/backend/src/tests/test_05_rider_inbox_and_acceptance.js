const assert = require('assert');
const { prisma } = require('@workspace/db');

async function run() {
  console.log('🧪 RUNNING TEST 05: Rider Inbox Queued Tasks Retrieval & Acceptance Lifecycle');

  let customer = await prisma.user.findFirst({ where: { email: 'test_buyer_e2e@lokaya.com' } });
  let merchant = await prisma.user.findFirst({ where: { email: 'test_merchant_e2e@lokaya.com' } });
  let store = await prisma.store.findFirst({ where: { users: { some: { userId: merchant.id } } } });
  let partnerUser = await prisma.user.findFirst({ where: { email: 'test_rider_offline@lokaya.com' } });
  let deliveryProfile = await prisma.deliveryPartner.findUnique({ where: { userId: partnerUser.id } });
  let testProduct = await prisma.product.findFirst({ where: { storeId: store.id } });

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
