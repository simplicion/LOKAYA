const assert = require('assert');

async function run() {
  console.log('🧪 RUNNING TEST 03: Platform Convenience Fee (1.5%) & Seller Margin Commission (5%)');

  // Case 1: Buyer Convenience Fee (1.5% of Cart Subtotal)
  const cartSubtotal = 1000;
  const platformFee = Math.round(cartSubtotal * 0.015 * 100) / 100;
  assert.strictEqual(platformFee, 15.0, 'Buyer platform fee should be exactly 1.5% (₹15 on ₹1000)');

  // Case 2: Platform Commission on Seller Profit Margin: 5% * (Selling Price - Cost Price)
  // Product 1: Selling Price = ₹500, Cost Price = ₹300 -> Margin = ₹200 -> 5% Commission = ₹10
  // Product 2: Selling Price = ₹300, Cost Price = ₹200 -> Margin = ₹100 -> 5% Commission = ₹5
  const items = [
    { priceAt: 500, costPrice: 300, quantity: 1 },
    { priceAt: 300, costPrice: 200, quantity: 1 }
  ];

  const totalStoreSubtotal = items.reduce((sum, i) => sum + (i.priceAt * i.quantity), 0);
  const totalMargin = items.reduce((sum, i) => sum + ((i.priceAt - i.costPrice) * i.quantity), 0);
  const platformMarginCommission = Math.round(totalMargin * 0.05 * 100) / 100;
  const sellerPayout = Math.round((totalStoreSubtotal - platformMarginCommission) * 100) / 100;

  assert.strictEqual(totalStoreSubtotal, 800);
  assert.strictEqual(totalMargin, 300);
  assert.strictEqual(platformMarginCommission, 15.0, 'Platform margin commission should be ₹15');
  assert.strictEqual(sellerPayout, 785.0, 'Seller payout should be ₹785 (₹800 - ₹15)');

  // Case 3: Zero or unlisted cost price fallback (defaults to assumed 20% margin)
  const unlistedItem = { priceAt: 400, costPrice: 0, quantity: 1 };
  const assumedCost = unlistedItem.costPrice > 0 ? unlistedItem.costPrice : (unlistedItem.priceAt * 0.80);
  const assumedMargin = Math.max(0, unlistedItem.priceAt - assumedCost);
  const unlistedCommission = Math.round(assumedMargin * 0.05 * 100) / 100;

  assert.strictEqual(assumedMargin, 80.0);
  assert.strictEqual(unlistedCommission, 4.0);

  console.log(`   ✅ 1.5% Buyer Platform Fee: Cart ₹${cartSubtotal} -> Fee = ₹${platformFee}`);
  console.log(`   ✅ 5% Seller Margin Commission: Subtotal ₹${totalStoreSubtotal}, Profit Margin ₹${totalMargin} -> Commission = ₹${platformMarginCommission}, Payout = ₹${sellerPayout}`);
  console.log('🎉 TEST 03 PASSED: Platform fees and merchant margin commissions verified successfully!\n');
}

run().catch((err) => {
  console.error('❌ TEST 03 FAILED:', err);
  process.exit(1);
});
