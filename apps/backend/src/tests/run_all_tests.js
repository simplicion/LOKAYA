const { execSync } = require('child_process');
const path = require('path');

const TEST_FILES = [
  'test_01_fuel_benchmarks_and_floors.js',
  'test_02_multistore_blended_pricing.js',
  'test_03_buyer_fee_and_seller_commission.js',
  'test_04_offline_partner_assignment.js',
  'test_05_rider_inbox_and_acceptance.js',
  'test_06_store_pickup_otp_handshake.js',
  'test_07_customer_handover_otp_handshake.js',
  'test_08_multidrop_batch_50_50_dispatch.js',
  'test_09_customer_8_stage_tracking.js',
  'test_10_edge_cases_and_security.js',
  'test_11_currency_and_geo_localization.js',
];

async function runMasterTestSuite() {
  console.log('========================================================================');
  console.log('🚀 LOKAYA SENIOR PRINCIPAL ARCHITECT: EXHAUSTIVE 11-SUITE VERIFICATION');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  for (const file of TEST_FILES) {
    const filePath = path.join(__dirname, file);
    try {
      execSync(`npx ts-node -T "${filePath}"`, { stdio: 'inherit' });
      passed++;
    } catch (e) {
      console.error(`❌ SUITE FAILED: ${file}`);
      failed++;
    }
  }

  console.log('========================================================================');
  console.log(`📊 MASTER AUDIT SUMMARY:`);
  console.log(`   Total Test Suites Executed: ${TEST_FILES.length}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✨ 100% PRODUCTION INTEGRITY VERIFIED ACROSS ALL 11 TEST SUITES!');
  }
}

runMasterTestSuite();
