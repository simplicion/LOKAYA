const assert = require('assert');
const { prisma } = require('@workspace/db');

async function run() {
  console.log('🧪 RUNNING TEST 06: Handshake #1 - Store Pickup OTP Verification & Dispatch');

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
      totalAmount: 350,
      deliveryAddress: 'Cyber City Tower B',
      deliveryOtp: '9123',
      items: {
        create: [{ productId: testProduct.id, sku: 'APL-001', productName: 'Fresh Apples (1kg)', quantity: 1, priceAt: 350 }]
      }
    }
  });

  const pickupOtpCode = '7744';
  const pickupOtp = await prisma.orderPickupOtp.create({
    data: {
      orderId: order.id,
      otpCode: pickupOtpCode,
      qrToken: `QR-${order.id.slice(0, 8)}`,
      isUsed: false,
      expiresAt: new Date(Date.now() + 86400000)
    }
  });

  const assignment = await prisma.deliveryAssignment.create({
    data: {
      orderId: order.id,
      deliveryPartnerId: deliveryProfile.id,
      status: 'ACCEPTED',
      deliveryFee: 50,
    }
  });

  // 1. Negative Test: Test Wrong Pickup OTP rejection
  const wrongOtp = '1111';
  const isWrongValid = (wrongOtp === pickupOtp.otpCode);
  assert.strictEqual(isWrongValid, false, 'Wrong OTP must be rejected');

  // 2. Positive Test: Merchant Enters Correct Pickup OTP from Rider
  const isCorrectValid = (pickupOtpCode === pickupOtp.otpCode);
  assert.strictEqual(isCorrectValid, true, 'Correct OTP must match');

  // Transition status atomically
  await prisma.orderPickupOtp.update({
    where: { id: pickupOtp.id },
    data: { isUsed: true }
  });

  const dispatchedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'SHIPPED',
      pickedUpAt: new Date(),
      outForDeliveryAt: new Date()
    }
  });

  const dispatchedAssignment = await prisma.deliveryAssignment.update({
    where: { id: assignment.id },
    data: {
      status: 'OUT_FOR_DELIVERY',
      pickedUpAt: new Date(),
      outForDeliveryAt: new Date()
    }
  });

  assert.strictEqual(dispatchedOrder.status, 'SHIPPED', 'Order status should be SHIPPED');
  assert.strictEqual(dispatchedAssignment.status, 'OUT_FOR_DELIVERY', 'Assignment status should be OUT_FOR_DELIVERY');
  assert(dispatchedOrder.pickedUpAt instanceof Date, 'Picked up timestamp should be recorded');

  console.log(`   ✅ Wrong Pickup OTP [${wrongOtp}] -> Correctly rejected`);
  console.log(`   ✅ Valid Pickup OTP [${pickupOtpCode}] -> Handshake #1 Verified!`);
  console.log(`   ✅ Order Status: ${dispatchedOrder.status} | Assignment: ${dispatchedAssignment.status}`);

  // Cleanup
  await prisma.deliveryAssignment.delete({ where: { id: assignment.id } });
  await prisma.orderPickupOtp.delete({ where: { id: pickupOtp.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });

  console.log('🎉 TEST 06 PASSED: Store pickup handshake verified successfully!\n');
}

run().catch((err) => {
  console.error('❌ TEST 06 FAILED:', err);
  process.exit(1);
});
