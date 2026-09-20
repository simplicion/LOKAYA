const assert = require('assert');
const { FuelRateService } = require('../modules/delivery/application/fuel-rate.service');

async function run() {
  console.log('🧪 RUNNING TEST 01: Fuel Rate Benchmarks & Vehicle Rate Floor Protection');

  // 1. Verify Country Benchmarks exist and have valid properties
  const inBenchmark = await FuelRateService.getFuelBenchmark('IN');
  assert.strictEqual(inBenchmark.countryCode, 'IN');
  assert.strictEqual(inBenchmark.currency, 'INR');
  assert.strictEqual(inBenchmark.minDeliveryFloor, 50);
  assert(inBenchmark.fuelPricePerLiter > 0, 'India fuel price must be positive');
  assert(inBenchmark.standardBikeMileage === 50, 'Standard bike mileage should be 50 km/L');
  assert(inBenchmark.standardScooterMileage === 40, 'Standard scooter mileage should be 40 km/L');

  const npBenchmark = await FuelRateService.getFuelBenchmark('NP');
  assert.strictEqual(npBenchmark.countryCode, 'NP');
  assert.strictEqual(npBenchmark.currency, 'NPR');
  assert.strictEqual(npBenchmark.minDeliveryFloor, 80);

  const usBenchmark = await FuelRateService.getFuelBenchmark('US');
  assert.strictEqual(usBenchmark.countryCode, 'US');
  assert.strictEqual(usBenchmark.currency, 'USD');
  assert.strictEqual(usBenchmark.minDeliveryFloor, 3.50);

  // 2. Verify Dynamic Rate Floor calculation for different vehicles
  const bikeFloorIN = FuelRateService.calculateMinimumRateFloor('MOTORCYCLE', inBenchmark);
  const scooterFloorIN = FuelRateService.calculateMinimumRateFloor('SCOOTER', inBenchmark);
  const bicycleFloorIN = FuelRateService.calculateMinimumRateFloor('BICYCLE', inBenchmark);
  const walkerFloorIN = FuelRateService.calculateMinimumRateFloor('WALKER', inBenchmark);

  // Scooter (40 km/L) has higher fuel cost per km than bike (50 km/L)
  assert(scooterFloorIN >= bikeFloorIN, `Scooter floor (${scooterFloorIN}) should be >= Bike floor (${bikeFloorIN})`);
  // Bicycle and Walker get labor protection equal to standard motorcycle baseline
  assert.strictEqual(bicycleFloorIN, bikeFloorIN, 'Bicycle floor should equal motorcycle floor');
  assert.strictEqual(walkerFloorIN, bikeFloorIN, 'Walker floor should equal motorcycle floor');

  console.log(`   ✅ India (INR): Bike Floor = ₹${bikeFloorIN}/km, Scooter Floor = ₹${scooterFloorIN}/km`);
  console.log(`   ✅ Nepal (NPR): Min Floor = रू ${npBenchmark.minDeliveryFloor}`);
  console.log(`   ✅ USA (USD): Min Floor = $${usBenchmark.minDeliveryFloor}`);
  console.log('🎉 TEST 01 PASSED: Fuel benchmarks and vehicle rate floors verified successfully!\n');
}

run().catch((err) => {
  console.error('❌ TEST 01 FAILED:', err);
  process.exit(1);
});
