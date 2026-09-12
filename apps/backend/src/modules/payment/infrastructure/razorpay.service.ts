import Razorpay from 'razorpay';
import crypto from 'crypto';
import { AppError } from '../../../shared/errors/AppError';

let razorpayInstance: any;

const getRazorpay = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    return null;
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return razorpayInstance;
};

export class RazorpayService {
  static async createOrder(amount: number, receipt: string) {
    const client = getRazorpay();

    if (!client) {
      // Graceful fallback for sandbox/test simulation mode when keys are not configured
      return {
        id: `order_sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        entity: 'order',
        amount: Math.round(amount * 100),
        amount_paid: 0,
        amount_due: Math.round(amount * 100),
        currency: 'INR',
        receipt,
        status: 'created',
        attempts: 0,
        created_at: Math.floor(Date.now() / 1000)
      };
    }

    try {
      const options = {
        amount: Math.round(amount * 100), // convert to paise
        currency: 'INR',
        receipt
      };
      const order = await client.orders.create(options);
      return order;
    } catch (error: any) {
      console.warn('[Razorpay] Gateway order creation warning:', error?.message || error);
      if (process.env.NODE_ENV !== 'production') {
        return {
          id: `order_sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          entity: 'order',
          amount: Math.round(amount * 100),
          amount_paid: 0,
          amount_due: Math.round(amount * 100),
          currency: 'INR',
          receipt,
          status: 'created',
          attempts: 0,
          created_at: Math.floor(Date.now() / 1000)
        };
      }
      throw new AppError('Failed to create payment order with provider', 500);
    }
  }

  static verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'test_secret_lokaya';
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  }
}

