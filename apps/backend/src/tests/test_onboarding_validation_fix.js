const axios = require('axios');
const { prisma } = require('@workspace/db');

const API_BASE = 'http://localhost:4002/api/v1';

async function runOnboardingValidationTests() {
  console.log('🧪 Testing Delivery Partner Onboarding Bug Fixes...');

  // Find or create a test user
  let user = await prisma.user.findFirst({
    where: { phone: '+919999888800' }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Test Walker Rider',
        phone: '+919999888800',
        email: 'testwalkerrider@lokaya.com'
      }
    });
  }

  // Clean up any existing delivery partner profile for this user
  await prisma.deliveryPartner.deleteMany({
    where: { userId: user.id }
  });

  require('dotenv').config({ path: 'apps/backend/.env' });
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { id: user.id, phone: user.phone, role: 'USER' },
    process.env.JWT_SECRET || 'cce165b61b8a327dba615226ec9d266e4401434b552aa7b36eb5125e378ac0a0',
    { expiresIn: '1h' }
  );

  const authHeaders = { Authorization: `Bearer ${token}` };

  console.log('\n--- Case 1: Testing WALKER Onboarding (Exact screenshot payload) ---');
  const walkerPayload = {
    name: 'PRINCE',
    age: 24,
    gender: 'Male', // Title case
    phone: '+916205170591',
    email: 'qseriousy@gmail.com',
    vehicleType: 'WALKER', // WALKER mode
    vehicleNumber: '', // No vehicle number plate
    vehicleDocumentUrl: '', // No vehicle documents
    vehiclePhotoUrl: '',
    selfieUrl: 'https://lh3.googleusercontent.com/test-selfie.jpg',
    identityDocumentType: 'GOVERNMENT_ID',
    identityDocumentUrl: 'http://localhost:4002/api/v1/media/test-id.jpg',
    locationArea: 'Delhi Central Hub',
    latitude: 28.6139,
    longitude: 77.209
  };

  try {
    const res = await axios.post(`${API_BASE}/delivery/register`, walkerPayload, { headers: authHeaders });
    console.log('   ✅ WALKER Registration Success! Status:', res.status, '| Partner ID:', res.data.id);
    console.log('   ✅ Assigned vehicleType:', res.data.vehicleType, '| vehicleNumber:', res.data.vehicleNumber);
    console.log('   ✅ Base Fare:', res.data.baseFare, '| Per Km Rate:', res.data.perKmRate);
  } catch (err) {
    console.error('   ❌ WALKER Registration Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Clean up
  await prisma.deliveryPartner.deleteMany({
    where: { userId: user.id }
  });

  console.log('\n--- Case 2: Testing MOTORCYCLE Onboarding with Vehicle Paper (RC) ---');
  const bikePayload = {
    name: 'PRINCE BIKE',
    age: 25,
    gender: 'Male',
    phone: '+916205170591',
    vehicleType: 'MOTORCYCLE',
    vehicleNumber: 'RC_UPLOADED',
    vehicleDocumentUrl: 'http://localhost:4002/api/v1/media/rc-doc.jpg',
    vehiclePhotoUrl: 'http://localhost:4002/api/v1/media/bike-photo.jpg',
    selfieUrl: 'https://lh3.googleusercontent.com/test-selfie.jpg',
    identityDocumentType: 'GOVERNMENT_ID',
    identityDocumentUrl: 'http://localhost:4002/api/v1/media/test-id.jpg',
    locationArea: 'Delhi Central Hub',
    latitude: 28.6139,
    longitude: 77.209
  };

  try {
    const res = await axios.post(`${API_BASE}/delivery/register`, bikePayload, { headers: authHeaders });
    console.log('   ✅ MOTORCYCLE Registration Success! Status:', res.status, '| Partner ID:', res.data.id);
    console.log('   ✅ Assigned vehicleType:', res.data.vehicleType, '| vehicleDocumentUrl:', res.data.vehicleDocumentUrl);
  } catch (err) {
    console.error('   ❌ MOTORCYCLE Registration Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Clean up
  await prisma.deliveryPartner.deleteMany({
    where: { userId: user.id }
  });

  console.log('\n🎉 ALL ONBOARDING VALIDATION & VEHICLE DOCUMENT TESTS PASSED!');
  process.exit(0);
}

runOnboardingValidationTests();
