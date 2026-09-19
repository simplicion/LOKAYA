import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '@workspace/db';

export class RazorpayWebhookHandler {
  /**
   * Validates Razorpay Webhook HMAC-SHA256 signature
   */
  static verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
    if (!signature || !secret || !rawBody) return false;
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch (err) {
      console.error('[Razorpay Webhook] Signature verification failed:', err);
      return false;
    }
  }

  /**
   * Main Webhook Controller
   */
  static async handleWebhook(req: Request, res: Response) {
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'test_secret_lokaya';

    // Get raw body string for cryptographic signature check
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    // In production or test with secret, verify signature
    if (signature) {
      const isValid = RazorpayWebhookHandler.verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.warn('[Razorpay Webhook] ❌ Invalid webhook signature received');
        return res.status(400).json({ error: 'Invalid webhook signature', status: 'error' });
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.warn('[Razorpay Webhook] ❌ Missing x-razorpay-signature header in production');
      return res.status(400).json({ error: 'Missing x-razorpay-signature header', status: 'error' });
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const event = payload.event;
    console.log(`[Razorpay Webhook] 🔔 Received event: ${event} (ID: ${payload.payload?.payment?.entity?.id || payload.payload?.order?.entity?.id})`);

    try {
      if (event === 'payment.captured' || event === 'order.paid') {
        const paymentEntity = payload.payload?.payment?.entity;
        const orderEntity = payload.payload?.order?.entity;

        const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
        const razorpayPaymentId = paymentEntity?.id;

        if (!razorpayOrderId) {
          console.warn('[Razorpay Webhook] Webhook payload missing order_id');
          return res.status(200).json({ status: 'ignored', reason: 'Missing order_id' });
        }

        // Idempotency: Locate existing payment record in DB
        const existingPayment = await prisma.payment.findFirst({
          where: { providerOrderId: razorpayOrderId },
          include: { order: true },
        });

        if (!existingPayment) {
          console.warn(`[Razorpay Webhook] Payment with providerOrderId ${razorpayOrderId} not found in DB`);
          return res.status(200).json({ status: 'ignored', reason: 'Order not found in DB' });
        }

        // Check if already confirmed (Idempotency Guard)
        if (existingPayment.status === 'SUCCESS' && existingPayment.order.status !== 'PENDING') {
          console.log(`[Razorpay Webhook] Order ${existingPayment.orderId} is already CONFIRMED. Skipping duplicate processing.`);
          return res.status(200).json({ status: 'already_processed' });
        }

        // Atomically update Payment & Order status
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: 'SUCCESS',
              providerPaymentId: razorpayPaymentId || existingPayment.providerPaymentId,
              providerSignature: signature || existingPayment.providerSignature,
            },
          });

          await tx.subOrder.updateMany({
            where: { orderId: existingPayment.orderId },
            data: { status: 'CONFIRMED' },
          });

          const updatedOrder = await tx.order.update({
            where: { id: existingPayment.orderId },
            data: { status: 'CONFIRMED' },
            include: {
              items: true,
              store: true,
              subOrders: true,
            },
          });

          // Broadcast real-time Socket.IO notification to client
          try {
            const { getIO } = require('../../../api/socket');
            const io = getIO();
            if (io) {
              io.to(`order_${updatedOrder.id}`).emit('order_status_updated', updatedOrder);
              io.to(`store_${updatedOrder.storeId}`).emit('new_incoming_order', updatedOrder);
            }
          } catch (e) {
            // Socket not running in test mode
          }
        }, { timeout: 30000, maxWait: 10000 });

        console.log(`[Razorpay Webhook] ✅ Order ${existingPayment.orderId} successfully marked as CONFIRMED via Webhook.`);
        return res.status(200).json({ status: 'success', orderId: existingPayment.orderId });
      }

      if (event === 'payment.failed') {
        const paymentEntity = payload.payload?.payment?.entity;
        const razorpayOrderId = paymentEntity?.order_id;
        if (razorpayOrderId) {
          await prisma.payment.updateMany({
            where: { providerOrderId: razorpayOrderId },
            data: { status: 'FAILED' },
          });
        }
        return res.status(200).json({ status: 'recorded_failed' });
      }

      // Default acknowledgement for unhandled event types
      return res.status(200).json({ status: 'acknowledged', event });
    } catch (err: any) {
      console.error('[Razorpay Webhook] Error processing event:', err);
      return res.status(500).json({ error: 'Internal processing error' });
    }
  }
}
