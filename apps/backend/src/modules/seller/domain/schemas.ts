import { z } from 'zod';

export const onboardSellerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    address: z.string().default("Address not provided"),
    contactPhone: z.string().min(10),
    aadhaarFrontUrl: z.string().url().optional(),
    aadhaarBackUrl: z.string().url().optional(),
    panCardUrl: z.string().url().optional(),
    aadharPanUrl: z.string().url().optional(),
    gstOrLicenseUrl: z.string().url().optional().or(z.literal('')),
    shopPhotos: z.array(z.string().url()).max(4).optional().default([])
  })
});

export const updateStoreProfileSchema = z.object({
  body: z.object({
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
  })
});
