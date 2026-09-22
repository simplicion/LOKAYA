import { z } from 'zod';

export const onboardSellerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Store name is required'),
    address: z.string().optional().default(""),
    contactPhone: z.string().min(4, 'Contact phone number required').optional().or(z.literal('')),
    category: z.string().optional().nullable(),
    // Universal Corporate KYC Documents
    ownerIdFrontUrl: z.string().optional().nullable().or(z.literal('')),
    ownerIdBackUrl: z.string().optional().nullable().or(z.literal('')),
    ownerPhotoUrl: z.string().optional().nullable().or(z.literal('')),
    businessDocUrl: z.string().optional().nullable().or(z.literal('')),
    // Legacy mapping support
    aadhaarFrontUrl: z.string().optional().nullable().or(z.literal('')),
    aadhaarBackUrl: z.string().optional().nullable().or(z.literal('')),
    panCardUrl: z.string().optional().nullable().or(z.literal('')),
    aadharPanUrl: z.string().optional().nullable().or(z.literal('')),
    gstOrLicenseUrl: z.string().optional().nullable().or(z.literal('')),
    shopPhotos: z.array(z.string()).optional().default([]),
    // Live Location & Country Details
    latitude: z.union([z.number(), z.string()]).optional().nullable(),
    longitude: z.union([z.number(), z.string()]).optional().nullable(),
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
