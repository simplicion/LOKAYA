import { z } from 'zod';

export const registerDeliveryPartnerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().int().min(18, 'Must be at least 18 years old').max(80, 'Invalid age'),
  gender: z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
  ),
  phone: z.string().min(7, 'Valid phone number required'),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationArea: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
  vehicleType: z.enum(['BICYCLE', 'MOTORCYCLE', 'SCOOTER', 'EV', 'CAR', 'VAN', 'WALKER']).default('MOTORCYCLE'),
  vehicleNumber: z.string().optional().or(z.literal('')),
  perKmRate: z.number().optional(),
  baseFare: z.number().optional(),
  // KYC & Vehicle uploads
  selfieUrl: z.string().url('Valid selfie photo URL required'),
  identityDocumentType: z.string().default('GOVERNMENT_ID'),
  identityDocumentUrl: z.string().url('Valid government ID document URL required'),
  vehiclePhotoUrl: z.string().url('Valid vehicle photo URL required').optional().or(z.literal('')),
  vehicleDocumentUrl: z.string().url('Valid vehicle document URL required').optional().or(z.literal(''))
});

export const updateDeliveryLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  locationArea: z.string().optional()
});

export const toggleDeliveryOnlineSchema = z.object({
  isOnline: z.boolean()
});

export const sendStorePartnerRequestSchema = z.object({
  storeId: z.string().uuid('Valid store ID required'),
  notes: z.string().optional()
});

export const respondStorePartnerRequestSchema = z.object({
  requestId: z.string().uuid('Valid request ID required'),
  status: z.enum(['ACCEPTED', 'REJECTED'])
});

export const dispatchOrderFulfillmentSchema = z.object({
  fulfillmentType: z.enum(['LOKAYA_AUTO', 'LOKAYA_PARTNER', 'SELF_DELIVERY']),
  deliveryPartnerId: z.string().uuid().optional()
});

export const verifyDeliveryOtpSchema = z.object({
  otp: z.string().length(4, '4-digit OTP required')
});

export const updateAssignmentStatusSchema = z.object({
  status: z.enum([
    'ACCEPTED',
    'ARRIVED_AT_STORE',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
    'ARRIVED_AT_CUSTOMER',
    'REJECTED',
    'CANCELLED'
  ])
});
