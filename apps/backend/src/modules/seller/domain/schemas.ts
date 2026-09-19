import { z } from 'zod';

export const onboardSellerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    address: z.string().optional().default(""),
    contactPhone: z.string().min(5),
    category: z.string().optional().nullable(),
    // Universal Corporate KYC Documents
    ownerIdFrontUrl: z.string().url().optional(),
    ownerIdBackUrl: z.string().url().optional(),
    ownerPhotoUrl: z.string().url().optional(),
    businessDocUrl: z.string().url().optional().or(z.literal('')),
    // Legacy mapping support
    aadhaarFrontUrl: z.string().url().optional(),
    aadhaarBackUrl: z.string().url().optional(),
    panCardUrl: z.string().url().optional(),
    aadharPanUrl: z.string().url().optional(),
    gstOrLicenseUrl: z.string().url().optional().or(z.literal('')),
    shopPhotos: z.array(z.string().url()).max(4).optional().default([]),
    // Live Location & Country Details
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    country: z.string().optional().nullable(),
    countryCode: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    currency: z.string().optional().nullable(),
    currencySymbol: z.string().optional().nullable(),
  })
});

export const updateStoreProfileSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    contactPhone: z.string().optional(),
    isActive: z.boolean().optional(),
    openingTime: z.string().optional(),
    closingTime: z.string().optional(),
    bannerUrl: z.string().optional().nullable(),
    logoUrl: z.string().optional().nullable(),
    themeColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    workingDays: z.array(z.number()).optional(),
    minimumOrder: z.number().optional(),
    acceptedPayments: z.array(z.string()).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    address: z.string().optional()
  })
});
