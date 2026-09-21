const { registerDeliveryPartnerSchema } = require('../modules/delivery/domain/schemas');
const { DeliveryService } = require('../modules/delivery/application/delivery.service');
const { prisma } = require('@workspace/db');

async function runOnboardingValidationTests() {
  console.log('🧪 Testing Delivery Partner Onboarding Bug Fixes...');

  // Find or create a test user
  let user = await prisma.user.findFirst({
    where: { OR: [{ phone: '+919999888800' }, { email: 'testwalkerrider@lokaya.com' }] }
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
    const validatedWalker = registerDeliveryPartnerSchema.parse(walkerPayload);
    const res = await DeliveryService.onboardDeliveryPartner(user.id, validatedWalker);
    console.log('   ✅ WALKER Registration Success! Partner ID:', res.id);
    console.log('   ✅ Assigned vehicleType:', res.vehicleType, '| vehicleNumber:', res.vehicleNumber);
    console.log('   ✅ Base Fare:', res.baseFare, '| Per Km Rate:', res.perKmRate);
  } catch (err) {
    console.error('   ❌ WALKER Registration Failed:', err.message || err);
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
    const validatedBike = registerDeliveryPartnerSchema.parse(bikePayload);
    const res = await DeliveryService.onboardDeliveryPartner(user.id, validatedBike);
    console.log('   ✅ MOTORCYCLE Registration Success! Partner ID:', res.id);
    console.log('   ✅ Assigned vehicleType:', res.vehicleType, '| vehicleDocumentUrl:', res.vehicleDocumentUrl);
  } catch (err) {
    console.error('   ❌ MOTORCYCLE Registration Failed:', err.message || err);
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
