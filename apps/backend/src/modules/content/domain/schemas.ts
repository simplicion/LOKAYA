import { z } from 'zod';

export const getPresignedUrlSchema = z.object({
  body: z.object({
    filename: z.string().min(1, 'Filename is required'),
    contentType: z.string().min(1, 'Content type is required')
  })
});

const mediaAssetSchema = z.object({
  url: z.string(),
  type: z.enum(['IMAGE', 'VIDEO'])
});

export const createPostSchema = z.object({
  body: z.object({
    caption: z.string().optional().nullable(),
    media: z.array(mediaAssetSchema).optional(),
    mediaIds: z.array(z.string().min(1)).optional(),
    productIds: z.array(z.string().min(1)).optional()
  }).refine(data => (data.media && data.media.length > 0) || (data.mediaIds && data.mediaIds.length > 0), {
    message: 'Either media or mediaIds is required',
    path: ['media']
  })
});

export const createReelSchema = z.object({
  body: z.object({
    caption: z.string().optional().nullable(),
    media: z.array(mediaAssetSchema).optional(),
    mediaIds: z.array(z.string().min(1)).optional(),
    productIds: z.array(z.string().min(1)).optional()
  }).refine(data => (data.media && data.media.length > 0) || (data.mediaIds && data.mediaIds.length > 0), {
    message: 'Either media or mediaIds is required',
    path: ['media']
  })
});

export const createStorySchema = z.object({
  body: z.object({
    storeId: z.string().min(1).optional(),
    mediaUrl: z.string().min(1, 'Media URL is required'),
    fileKey: z.string().optional(),
    mediaType: z.enum(['IMAGE', 'VIDEO']).default('IMAGE'),
    caption: z.string().max(500).optional().nullable(),
    productId: z.string().min(1).optional().nullable(),
    durationSec: z.number().int().min(1).max(60).default(5)
  })
});
