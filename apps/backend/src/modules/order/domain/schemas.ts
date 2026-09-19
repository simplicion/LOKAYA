import { z } from 'zod';
import { OrderStatus } from '@workspace/db';

export const createOrderSchema = z.object({
  body: z.object({
    storeId: z.string().uuid().optional(),
    deliveryAddress: z.string().optional().nullable(),
    paymentMethod: z.string().optional().nullable(),
    shippingFee: z.number().optional().nullable(),
    items: z.array(z.object({
      productId: z.string().uuid(),
      variantId: z.string().uuid().optional().nullable(),
      quantity: z.number().int().positive()
    })).min(1, 'Order must contain at least one item')
  })
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.union([
      z.nativeEnum(OrderStatus),
      z.enum(['New', 'Preparing', 'Ready', 'Completed', 'Cancelled', 'CONFIRMED', 'PROCESSING', 'PACKED', 'DELIVERED', 'OUT_FOR_DELIVERY'])
    ])
  })
});
