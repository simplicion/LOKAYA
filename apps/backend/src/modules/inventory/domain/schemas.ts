import { z } from 'zod';

export const adjustInventorySchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    variantId: z.string().uuid('Invalid variant ID').optional().nullable(),
    change: z.number().int('Change must be an integer').refine(val => val !== 0, {
      message: "Change cannot be zero",
    }),
    reason: z.string().min(1, 'Reason is required')
  })
});
