const assert = require('assert');
const crypto = require('crypto');
const { OneEightyWebhookHandler } = require('../apps/backend/dist/modules/payment/interfaces/one-eighty.webhook');

console.log('=== LOKAYA 180 CORE INTEGRATION TEST SUITE ===\n');

const testSecret = 'whsec_395b7ae5f46660beafd989aab48a63c45f5632a72252bec0';
const samplePayload = JSON.stringify({
  event: 'payment.captured',
  data: {
    sessionId: '180_sess_test_123',
    transactionId: 'txn_one_eighty_999',
    amount: 1500,
    currency: 'NPR',
    metadata: {
      orderId: 'order_uuid_test_456'
    }
  }
});

// TEST 1: Authentic HMAC SHA-256 signature verification
console.log('--- TEST 1: Authentic Webhook Signature Verification ---');
const currentTimestamp = Math.floor(Date.now() / 1000).toString();
const validSignature = crypto
  .createHmac('sha256', testSecret)
  .update(`${currentTimestamp}.${samplePayload}`)
  .digest('hex');

const isVerifiedValid = OneEightyWebhookHandler.verifyWebhookSignature(
  samplePayload,
  validSignature,
  currentTimestamp,
  testSecret
);
assert.strictEqual(isVerifiedValid, true, 'Authentic 180 Pay signature must pass verification');
console.log('PASSED: Authentic 180 Pay webhook signature verified successfully.\n');

// TEST 2: Tampered payload or signature rejection
console.log('--- TEST 2: Tampered Signature Rejection ---');
const fakeSignature = 'badf00dbadf00dbadf00dbadf00dbadf00dbadf00dbadf00dbadf00dbadf00d';
const isVerifiedFake = OneEightyWebhookHandler.verifyWebhookSignature(
  samplePayload,
  fakeSignature,
  currentTimestamp,
  testSecret
);
assert.strictEqual(isVerifiedFake, false, 'Tampered or forged signature must be rejected');
console.log('PASSED: Forged signature rejected.\n');

// TEST 3: Replay attack defense (timestamp older than 300s)
console.log('--- TEST 3: 5-Minute Replay Attack Defense ---');
const expiredTimestamp = (Math.floor(Date.now() / 1000) - 305).toString(); // 305 seconds ago
const expiredSignature = crypto
  .createHmac('sha256', testSecret)
  .update(`${expiredTimestamp}.${samplePayload}`)
  .digest('hex');

const isVerifiedExpired = OneEightyWebhookHandler.verifyWebhookSignature(
  samplePayload,
  expiredSignature,
  expiredTimestamp,
  testSecret
);
assert.strictEqual(isVerifiedExpired, false, 'Replay attack with timestamp > 300s must be strictly rejected');
console.log('PASSED: Replay attack with expired timestamp was strictly rejected.\n');

console.log('=== ALL 180 CORE TESTS COMPLETED WITH 100% SUCCESS ===');
