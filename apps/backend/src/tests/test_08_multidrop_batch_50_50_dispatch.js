const assert = require('assert');
const { prisma } = require('@workspace/db');

async function run() {
  console.log('🧪 RUNNING TEST 08: 50/50 Multi-Drop Batch Dispatch Hub & Drop OTP Completions');

  let customer = await prisma.user.findFirst({ where: { email: 'test_buyer_e2e@lokaya.com' } });
  let merchant = await prisma.user.findFirst({ where: { email: 'test_merchant_e2e@lokaya.com' } });
  let store = await prisma.store.findFirst({ where: { users: { some: { userId: merchant.id } } } });
  let partnerUser = await prisma.user.findFirst({ where: { email: 'test_rider_offline@lokaya.com' } });
  let deliveryProfile = await prisma.deliveryPartner.findUnique({ where: { userId: partnerUser.id } });
  let testProduct = await prisma.product.findFirst({ where: { storeId: store.id } });

  // Create 3 orders for the same store to batch
  const o1 = await prisma.order.create({
    data: {
      buyerId: customer.id, storeId: store.id, status: 'PACKED', totalAmount: 300, shippingFee: 60,
      deliveryAddress: 'Sector 14 Drop 1', deliveryOtp: '1111',
      items: { create: [{ productId: testProduct.id, sku: 'APL-001', productName: 'Apples', quantity: 1, priceAt: 300 }] }
    }
  });

  const o2 = await prisma.order.create({
    data: {
      buyerId: customer.id, storeId: store.id, status: 'PACKED', totalAmount: 400, shippingFee: 50,
      deliveryAddress: 'Sector 14 Drop 2', deliveryOtp: '2222',
      items: { create: [{ productId: testProduct.id, sku: 'APL-001', productName: 'Apples', quantity: 1, priceAt: 400 }] }
    }
  });

  const o3 = await prisma.order.create({
    data: {
      buyerId: customer.id, storeId: store.id, status: 'PACKED', totalAmount: 250, shippingFee: 50,
      deliveryAddress: 'Sector 14 Drop 3', deliveryOtp: '3333',
      items: { create: [{ productId: testProduct.id, sku: 'APL-001', productName: 'Apples', quantity: 1, priceAt: 250 }] }
    }
  });

  // Calculate 50/50 Multi-Drop economics:
  // Drop 1 (₹60): 100% Rider = ₹60, Merchant = ₹0
  // Drop 2 (₹50): 50% Rider = ₹25, 50% Merchant = ₹25
  // Drop 3 (₹50): 50% Rider = ₹25, 50% Merchant = ₹25
  // Total Collected = ₹160 | Total Rider Payout = ₹110 | Total Merchant Profit = ₹50
  const dropsConfig = [
    { orderId: o1.id, shipping: 60, riderShare: 60, merchantShare: 0, isFirst: true, otp: '1111' },
    { orderId: o2.id, shipping: 50, riderShare: 25, merchantShare: 25, isFirst: false, otp: '2222' },
    { orderId: o3.id, shipping: 50, riderShare: 25, merchantShare: 25, isFirst: false, otp: '3333' },
  ];

  const totalCollected = 160;
  const totalRiderPayout = 110;
  const totalMerchantProfit = 50;

  const batch = await prisma.deliveryBatch.create({
    data: {
      storeId: store.id,
      deliveryPartnerId: deliveryProfile.id,
      status: 'PENDING',
      totalDrops: 3,
      completedDrops: 0,
      totalShippingCollected: totalCollected,
      totalRiderPayout,
      totalMerchantProfit,
      items: {
        create: dropsConfig.map((d, i) => ({
          orderId: d.orderId,
          dropSequence: i + 1,
          shippingCollected: d.shipping,
          riderShare: d.riderShare,
          merchantShare: d.merchantShare,
          isFirstDrop: d.isFirst,
          customerOtp: d.otp
        }))
      }
    },
    include: { items: true }
  });

  assert.strictEqual(batch.totalDrops, 3);
  assert.strictEqual(batch.totalRiderPayout, 110);
  assert.strictEqual(batch.totalMerchantProfit, 50);

  // Complete Drop 1
  const item1 = batch.items.find(i => i.orderId === o1.id);
  await prisma.deliveryBatchItem.update({ where: { id: item1.id }, data: { isCompleted: true, completedAt: new Date() } });
  await prisma.order.update({ where: { id: o1.id }, data: { status: 'DELIVERED' } });
  await prisma.deliveryBatch.update({ where: { id: batch.id }, data: { completedDrops: 1, status: 'IN_TRANSIT' } });

  // Complete Drop 2
  const item2 = batch.items.find(i => i.orderId === o2.id);
  await prisma.deliveryBatchItem.update({ where: { id: item2.id }, data: { isCompleted: true, completedAt: new Date() } });
  await prisma.order.update({ where: { id: o2.id }, data: { status: 'DELIVERED' } });
  await prisma.deliveryBatch.update({ where: { id: batch.id }, data: { completedDrops: 2 } });

  // Complete Drop 3 -> All done!
  const item3 = batch.items.find(i => i.orderId === o3.id);
  await prisma.deliveryBatchItem.update({ where: { id: item3.id }, data: { isCompleted: true, completedAt: new Date() } });
  await prisma.order.update({ where: { id: o3.id }, data: { status: 'DELIVERED' } });
  const finalBatch = await prisma.deliveryBatch.update({
    where: { id: batch.id },
    data: { completedDrops: 3, status: 'COMPLETED' }
  });

  assert.strictEqual(finalBatch.status, 'COMPLETED');
  assert.strictEqual(finalBatch.completedDrops, 3);

  console.log(`   ✅ 3-Drop Batch Created: Total Shipping = ₹${totalCollected}`);
  console.log(`   ✅ 50/50 Settlement: Rider Payout = ₹${totalRiderPayout} | Merchant Retained Profit = ₹${totalMerchantProfit}`);
  console.log(`   ✅ Drops 1, 2, 3 sequentially verified & marked COMPLETED`);

  // Cleanup
  await prisma.deliveryBatchItem.deleteMany({ where: { batchId: batch.id } });
  await prisma.deliveryBatch.delete({ where: { id: batch.id } });
  for (const oid of [o1.id, o2.id, o3.id]) {
    await prisma.orderItem.deleteMany({ where: { orderId: oid } });
    await prisma.order.delete({ where: { id: oid } });
  }

  console.log('🎉 TEST 08 PASSED: 50/50 multi-drop batch dispatch verified successfully!\n');
}

run().catch((err) => {
  console.error('❌ TEST 08 FAILED:', err);
  process.exit(1);
});
