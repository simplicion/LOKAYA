const assert = require('assert');
const { FuelRateService } = require('../modules/delivery/application/fuel-rate.service');

async function run() {
  console.log('🧪 RUNNING TEST 11: Country Geo-Detection, Base Floor Currency Adaptation');

  // 1. Geographic Bounding Box Detection
  // Kathmandu, Nepal: lat 27.7172, lng 85.3240 -> NP
  const detectedNP = FuelRateService.detectCountry(27.7172, 85.3240);
  assert.strictEqual(detectedNP, 'NP', 'Kathmandu coords must detect Nepal (NP)');

  // Dhaka, Bangladesh: lat 23.8103, lng 90.4125 -> BD
  const detectedBD = FuelRateService.detectCountry(23.8103, 90.4125);
  assert.strictEqual(detectedBD, 'BD', 'Dhaka coords must detect Bangladesh (BD)');

  // New York, USA: lat 40.7128, lng -74.0060 -> US
  const detectedUS = FuelRateService.detectCountry(40.7128, -74.0060);
  assert.strictEqual(detectedUS, 'US', 'New York coords must detect USA (US)');

  // New Delhi, India: lat 28.6139, lng 77.2090 -> IN
  const detectedIN = FuelRateService.detectCountry(28.6139, 77.2090);
  assert.strictEqual(detectedIN, 'IN', 'Delhi coords must detect India (IN)');

  // Default fallback when coordinates null
  const defaultCountry = FuelRateService.detectCountry(undefined, undefined);
  assert.strictEqual(defaultCountry, 'IN');

  // 2. Base Delivery Floor per Country
  const npBench = await FuelRateService.getFuelBenchmark('NP');
  assert.strictEqual(npBench.minDeliveryFloor, 80, 'Nepal delivery floor must be NPR 80');

  const inBench = await FuelRateService.getFuelBenchmark('IN');
  assert.strictEqual(inBench.minDeliveryFloor, 50, 'India delivery floor must be INR 50');

  const usBench = await FuelRateService.getFuelBenchmark('US');
  assert.strictEqual(usBench.minDeliveryFloor, 3.50, 'USA delivery floor must be USD $3.50');

  console.log(`   ✅ Nepal Geo-Detection: (27.71, 85.32) -> ${detectedNP} (Base Floor: रू ${npBench.minDeliveryFloor})`);
  console.log(`   ✅ Bangladesh Geo-Detection: (23.81, 90.41) -> ${detectedBD}`);
  console.log(`   ✅ USA Geo-Detection: (40.71, -74.00) -> ${detectedUS} (Base Floor: $${usBench.minDeliveryFloor})`);
  console.log(`   ✅ India Geo-Detection: (28.61, 77.20) -> ${detectedIN} (Base Floor: ₹${inBench.minDeliveryFloor})`);

  console.log('🎉 TEST 11 PASSED: Country geo-detection & currency adaptation verified successfully!\n');
}

run().catch((err) => {
  console.error('❌ TEST 11 FAILED:', err);
  process.exit(1);
});
