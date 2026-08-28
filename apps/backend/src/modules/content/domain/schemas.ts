import { z } from 'zod';

export const getPresignedUrlSchema = z.object({
  body: z.object({
    filename: z.string().min(1, 'Filename is required'),
    contentType: z.string().min(1, 'Content type is required')
  })
});

const mediaAssetSchema = z.object({
  url: z.string().url(),
  type: z.enum(['IMAGE', 'VIDEO'])
});

export const createPostSchema = z.object({
  body: z.object({
    caption: z.string().optional().nullable(),
    media: z.array(mediaAssetSchema).min(1, 'At least one media asset is required'),
    productIds: z.array(z.string().uuid()).optional()
  })
});

export const createReelSchema = z.object({
  body: z.object({
    caption: z.string().optional().nullable(),
    media: z.array(mediaAssetSchema).min(1, 'At least one media asset is required').max(1, 'Reels can only have one video'),
    productIds: z.array(z.string().uuid()).optional()
  })
});
