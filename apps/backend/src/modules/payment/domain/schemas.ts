import { z } from 'zod';

export const createRazorpayOrderSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    amount: z.number().positive(),
  })
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
    system_order_id: z.string().uuid()
  })
});
