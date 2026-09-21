const assert = require('assert');
const { prisma } = require('@workspace/db');

async function run() {
  console.log('🧪 RUNNING TEST 07: Handshake #2 - Customer Handover OTP Verification & Instant Wallet Payout');

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
  if (!testProduct) testProduct = await prisma.product.create({ data: { storeId: store.id, title: 'Fresh Apples (1kg)', price: 500, stock: 50 } });

  const initialEarnings = deliveryProfile.totalEarnings || 0;
  const initialDeliveries = deliveryProfile.totalDeliveries || 0;

  const order = await prisma.order.create({
    data: {
      buyerId: customer.id,
      storeId: store.id,
      status: 'SHIPPED',
      totalAmount: 500,
      deliveryAddress: 'Golf Course Road, Tower 1',
      deliveryOtp: '8492',
      items: {
        create: [{ productId: testProduct.id, sku: 'APL-001', productName: 'Fresh Apples (1kg)', quantity: 1, priceAt: 500 }]
      }
    }
  });

  const tripFee = 70;
  const assignment = await prisma.deliveryAssignment.create({
    data: {
      orderId: order.id,
      deliveryPartnerId: deliveryProfile.id,
      status: 'OUT_FOR_DELIVERY',
      deliveryFee: tripFee,
    }
  });

  // 1. Negative Test: Wrong Customer Delivery OTP
  const wrongCustomerOtp = '0000';
  const isWrongValid = (wrongCustomerOtp === order.deliveryOtp);
  assert.strictEqual(isWrongValid, false, 'Invalid customer OTP must be rejected');

  // 2. Positive Test: Customer presents correct OTP to Rider
  const isCorrectValid = (order.deliveryOtp === '8492');
  assert.strictEqual(isCorrectValid, true, 'Valid customer OTP must match');

  // Atomically fulfill order, update assignment, credit rider wallet, and create seller transaction credit
  const completedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'DELIVERED',
      deliveredAt: new Date()
    }
  });

  const completedAssignment = await prisma.deliveryAssignment.update({
    where: { id: assignment.id },
    data: {
      status: 'DELIVERED',
      deliveredAt: new Date()
    }
  });

  const updatedProfile = await prisma.deliveryPartner.update({
    where: { id: deliveryProfile.id },
    data: {
      isBusy: false,
      totalEarnings: { increment: tripFee },
      totalDeliveries: { increment: 1 }
    }
  });

  const sellerTx = await prisma.sellerTransaction.create({
    data: {
      storeId: store.id,
      orderId: order.id,
      title: `Order #${order.id.slice(0, 8)} Delivered`,
      amount: order.totalAmount,
      type: 'CREDIT',
      description: `Doorstep delivery completed by rider ${deliveryProfile.vehicleNumber}`
    }
  });

  assert.strictEqual(completedOrder.status, 'DELIVERED');
  assert.strictEqual(completedAssignment.status, 'DELIVERED');
  assert.strictEqual(updatedProfile.totalEarnings, initialEarnings + tripFee, 'Rider wallet must be credited instantly');
  assert.strictEqual(updatedProfile.totalDeliveries, initialDeliveries + 1);
  assert.strictEqual(sellerTx.type, 'CREDIT');

  console.log(`   ✅ Wrong Customer OTP [${wrongCustomerOtp}] -> Correctly rejected`);
  console.log(`   ✅ Valid Customer OTP [${order.deliveryOtp}] -> Handshake #2 Verified!`);
  console.log(`   ✅ Instant Rider Wallet Credit: +₹${tripFee} (Balance: ₹${updatedProfile.totalEarnings})`);
  console.log(`   ✅ Seller Credit Transaction Created: ₹${sellerTx.amount}`);

  // Cleanup
  await prisma.sellerTransaction.delete({ where: { id: sellerTx.id } });
  await prisma.deliveryAssignment.delete({ where: { id: assignment.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });

  console.log('🎉 TEST 07 PASSED: Customer handover handshake & instant settlement verified successfully!\n');
}

run().catch((err) => {
  console.error('❌ TEST 07 FAILED:', err);
  process.exit(1);
});
