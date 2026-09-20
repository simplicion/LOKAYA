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

export const createManualOrderSchema = z.object({
  body: z.object({
    storeId: z.string().uuid('Valid store ID is required'),
    customerName: z.string().optional().nullable(),
    customerPhone: z.string().optional().nullable(),
    customerEmail: z.string().email().optional().nullable().or(z.literal('')),
    paymentMethod: z.string().default('CASH'),
    discountAmount: z.number().nonnegative().optional().default(0),
    notes: z.string().optional().nullable(),
    items: z.array(z.object({
      productId: z.string().uuid('Valid product ID is required'),
      variantId: z.string().uuid().optional().nullable(),
      quantity: z.number().int().positive('Quantity must be greater than 0'),
      customPrice: z.number().nonnegative().optional().nullable()
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



