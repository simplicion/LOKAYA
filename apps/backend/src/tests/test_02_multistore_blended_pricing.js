const assert = require('assert');
const { FuelRateService } = require('../modules/delivery/application/fuel-rate.service');

async function run() {
  console.log('🧪 RUNNING TEST 02: Multi-Store Blended Average Delivery Pricing Engine');

  const benchmark = await FuelRateService.getFuelBenchmark('IN');

  // Case 1: Single store 4km away
  const singleStore = FuelRateService.calculateMultiStoreBlendedFee(
    [{ distanceKm: 4.0, isDeliveryIncluded: false }],
    benchmark
  );
  assert(singleStore.deliveryFee >= 50, 'Delivery fee must respect ₹50 minimum floor');
  assert.strictEqual(singleStore.blendedDistanceKm, 4.0);

  // Case 2: Multi-store cart (Store A: 6km, Store B: 10km) -> Blended avg distance = (6 + 10)/2 = 8km
  const multiStore = FuelRateService.calculateMultiStoreBlendedFee(
    [
      { distanceKm: 6.0, isDeliveryIncluded: false },
      { distanceKm: 10.0, isDeliveryIncluded: false }
    ],
    benchmark
  );

  assert.strictEqual(multiStore.blendedDistanceKm, 8.0, 'Blended distance should be 8.0 km');
  assert.strictEqual(multiStore.totalStores, 2);
  assert(multiStore.standaloneSum > multiStore.deliveryFee, 'Blended pricing must save customer money vs separate deliveries');
  assert(multiStore.savings > 0, `Customer savings should be positive, got ₹${multiStore.savings}`);

  // Case 3: Free delivery product from one store (Store A: 5km free, Store B: 8km paid) -> Only Store B counted
  const mixedStores = FuelRateService.calculateMultiStoreBlendedFee(
    [
      { distanceKm: 5.0, isDeliveryIncluded: true },
      { distanceKm: 8.0, isDeliveryIncluded: false }
    ],
    benchmark
  );
  assert.strictEqual(mixedStores.blendedDistanceKm, 8.0, 'Should only average payable stores');
  assert.strictEqual(mixedStores.payableStoresCount, 1);

  // Case 4: All stores free delivery
  const allFree = FuelRateService.calculateMultiStoreBlendedFee(
    [
      { distanceKm: 5.0, isDeliveryIncluded: true },
      { distanceKm: 8.0, isDeliveryIncluded: true }
    ],
    benchmark
  );
  assert.strictEqual(allFree.deliveryFee, 0, 'All free delivery items should result in ₹0 shipping fee');
  assert.strictEqual(allFree.isFreeDelivery, true);

  console.log(`   ✅ 2-Store Cart: Blended Distance = ${multiStore.blendedDistanceKm}km, Fee = ₹${multiStore.deliveryFee}, Savings = ₹${multiStore.savings}`);
  console.log(`   ✅ Free Delivery Handling: Fee = ₹${allFree.deliveryFee}`);
  console.log('🎉 TEST 02 PASSED: Multi-store blended pricing engine verified successfully!\n');
}

run().catch((err) => {
  console.error('❌ TEST 02 FAILED:', err);
  process.exit(1);
});
