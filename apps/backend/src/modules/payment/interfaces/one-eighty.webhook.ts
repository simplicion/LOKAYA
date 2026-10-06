import { Request, Response } from 'express';
import crypto from 'crypto';
import { PaymentService } from '../application/payment.service';

export class OneEightyWebhookHandler {
  /**
   * Verifies the cryptographic HMAC SHA-256 signature with 5-minute replay defense
   */
  static verifyWebhookSignature(rawBody: string, signature: string, timestamp: string, webhookSecret: string): boolean {
    if (!signature || !timestamp || !webhookSecret) return false;

    // 1. Replay attack defense (reject requests older than 5 minutes / 300 seconds)
    const currentTime = Math.floor(Date.now() / 1000);
    const parsedTimestamp = parseInt(timestamp, 10);
    if (isNaN(parsedTimestamp) || Math.abs(currentTime - parsedTimestamp) > 300) {
      console.warn(`[180 Pay Webhook] Rejected replay: timestamp difference ${Math.abs(currentTime - parsedTimestamp)}s > 300s`);
      return false;
    }

    // 2. Compute expected HMAC-SHA256 signature
    const signPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signPayload)
      .digest('hex');

    // 3. Constant-time comparison to prevent timing attacks
    const bufA = Buffer.from(signature);
    const bufB = Buffer.from(expectedSignature);
    if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
      return false;
    }

    return true;
  }

  static async handleWebhook(req: Request, res: Response): Promise<Response> {
    try {
      const signature = (req.headers['x-180-signature'] || req.headers['X-180-Signature']) as string;
      const timestamp = (req.headers['x-180-timestamp'] || req.headers['X-180-Timestamp']) as string;
      const webhookSecret = process.env.ONE_EIGHTY_WEBHOOK_SECRET || 'whsec_395b7ae5f46660beafd989aab48a63c45f5632a72252bec0';

      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      const isValid = this.verifyWebhookSignature(rawBody, signature, timestamp, webhookSecret);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid HMAC signature or expired timestamp' });
      }

      const event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
      console.log(`[180 Pay Webhook] Received verified event: ${event.event}`);

      switch (event.event) {
        case 'payment.captured':
        case 'payment.succeeded': {
          const { sessionId, transactionId, metadata } = event.data || {};
          const orderId = metadata?.orderId;
          await PaymentService.fulfill180Payment(sessionId, transactionId, orderId);
          console.log(`[180 Pay Webhook] Successfully fulfilled order for session: ${sessionId}`);
          break;
        }
        case 'subscription.created':
        case 'subscription.renewed':
          console.log('[180 Pay Webhook] Subscription event acknowledged:', event.data);
          break;
        case 'payment.failed':
          console.warn('[180 Pay Webhook] Payment failed event received:', event.data);
          break;
        default:
          console.log(`[180 Pay Webhook] Unhandled event type: ${event.event}`);
      }

      return res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('[180 Pay Webhook] Handler error:', error);
      return res.status(500).json({ error: error.message || 'Internal webhook error' });
    }
  }
}
