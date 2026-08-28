import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    quantity: z.number().int().positive().default(1)
  })
});

export const updateCartItemSchema = z.object({
  body: z.object({
    quantity: z.number().int().positive()
  })
});
