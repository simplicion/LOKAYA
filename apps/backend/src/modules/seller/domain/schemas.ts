import { z } from 'zod';

export const onboardSellerSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  upiId: z.string().optional(),
  gstNumber: z.string().optional(),
  category: z.string().optional(),
  landmark: z.string().optional(),
  businessType: z.string().optional(),
  aadharPanUrl: z.string().optional(),
  storefrontUrl: z.string().optional()
});

export const updateStoreProfileSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  bannerUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  themeColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  workingDays: z.array(z.number()).optional(),
  minimumOrder: z.number().optional(),
  acceptedPayments: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional()
});
