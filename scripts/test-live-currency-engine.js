/**
 * End-to-End Live Currency & Dynamic Location Engine Test Suite
 * Tests live endpoints, location detection, zero hardcoding, and currency formatting.
 */

const { CurrencyService } = require('../apps/backend/src/modules/common/currency.service');

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 LOKAYA LIVE DYNAMIC CURRENCY & GEOLOCATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  // TEST GROUP 1: Live Forex Rates Endpoint & Real API Fetching
  console.log('--- TEST GROUP 1: Live Forex Real Endpoint ---');
  const rates = await CurrencyService.getLiveRates('INR');
  assert(typeof rates === 'object' && Object.keys(rates).length > 5, 'Live Forex API successfully returns live multi-currency rates');
  assert(typeof rates.NPR === 'number' && rates.NPR > 1.5 && rates.NPR < 1.7, `Live NPR rate accurately reflects real Forex parity (Rate: ${rates.NPR})`);
  assert(typeof rates.USD === 'number' && rates.USD > 0.005 && rates.USD < 0.02, `Live USD rate accurately reflects real Forex parity (Rate: ${rates.USD})`);
  assert(typeof rates.EUR === 'number' && rates.EUR > 0.005 && rates.EUR < 0.02, `Live EUR rate accurately reflects real Forex parity (Rate: ${rates.EUR})`);

  // TEST GROUP 2: Real-time Currency Conversion Endpoint Logic
  console.log('\n--- TEST GROUP 2: Real-time Currency Conversion Calculations ---');
  const convNpr = await CurrencyService.convert(1500, 'INR', 'NPR');
  assert(convNpr.convertedAmount === 2400, `₹1,500 INR converts to exact NPR amount: रू ${convNpr.convertedAmount} (Rate: ${convNpr.exchangeRate})`);

  const convMrp = await CurrencyService.convert(2000, 'INR', 'NPR');
  assert(convMrp.convertedAmount === 3200, `₹2,000 INR MRP converts to exact NPR amount: रू ${convMrp.convertedAmount}`);

  const convUsd = await CurrencyService.convert(1500, 'INR', 'USD');
  assert(convUsd.convertedAmount > 14 && convUsd.convertedAmount < 18, `₹1,500 INR converts to USD: $${convUsd.convertedAmount}`);

  // TEST GROUP 3: Strict Currency Symbol Standardization (Zero Ambiguity)
  console.log('\n--- TEST GROUP 3: Universal Currency Symbols Resolution ---');
  const nprSymbol = CurrencyService.getCurrencySymbol('NPR', 'NP');
  assert(nprSymbol === 'रू', `NPR resolves to official Nepali Rupee symbol 'रू' (Got: '${nprSymbol}') - NEVER ambiguous 'Rs'`);

  const inrSymbol = CurrencyService.getCurrencySymbol('INR', 'IN');
  assert(inrSymbol === '₹', `INR resolves to official Indian Rupee symbol '₹' (Got: '${inrSymbol}')`);

  const usdSymbol = CurrencyService.getCurrencySymbol('USD', 'US');
  assert(usdSymbol === '$', `USD resolves to '$' (Got: '${usdSymbol}')`);

  const eurSymbol = CurrencyService.getCurrencySymbol('EUR', 'DE');
  assert(eurSymbol === '€', `EUR resolves to '€' (Got: '${eurSymbol}')`);

  const gbpSymbol = CurrencyService.getCurrencySymbol('GBP', 'GB');
  assert(gbpSymbol === '£', `GBP resolves to '£' (Got: '${gbpSymbol}')`);

  const aedSymbol = CurrencyService.getCurrencySymbol('AED', 'AE');
  assert(aedSymbol === 'AED', `AED resolves to 'AED' (Got: '${aedSymbol}')`);

  // TEST GROUP 4: Mathematical Country Flag Generation
  console.log('\n--- TEST GROUP 4: Dynamic Unicode Flag Derivation ---');
  assert(CurrencyService.getCountryFlag('NP') === '🇳🇵', `ISO 'NP' mathematically resolves to flag '🇳🇵'`);
  assert(CurrencyService.getCountryFlag('IN') === '🇮🇳', `ISO 'IN' mathematically resolves to flag '🇮🇳'`);
  assert(CurrencyService.getCountryFlag('US') === '🇺🇸', `ISO 'US' mathematically resolves to flag '🇺🇸'`);
  assert(CurrencyService.getCountryFlag('GB') === '🇬🇧', `ISO 'GB' mathematically resolves to flag '🇬🇧'`);

  // TEST GROUP 5: Dynamic IP Geolocation Detection Engine
  console.log('\n--- TEST GROUP 5: Live IP Geolocation Detection Cascade ---');
  const localDetect = await CurrencyService.detectLocation();
  assert(localDetect && localDetect.countryCode === 'NP', `Local development environment detects country 'NP' (${localDetect.country})`);
  assert(localDetect && localDetect.currency === 'NPR', `Local development environment detects currency 'NPR'`);
  assert(localDetect && localDetect.currencySymbol === 'रू', `Local development environment sets symbol 'रू'`);

  console.log('\n================================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}% SUCCESS)`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test suite failure:', err);
  process.exit(1);
});
