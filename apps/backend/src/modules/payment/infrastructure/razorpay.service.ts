import Razorpay from 'razorpay';
import crypto from 'crypto';
import { AppError } from '../../../shared/errors/AppError';

let razorpayInstance: any;

const getRazorpay = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });
  }
  return razorpayInstance;
};

export class RazorpayService {
  static async createOrder(amount: number, receipt: string) {
    try {
      const options = {
        amount: Math.round(amount * 100), // convert to paise
        currency: 'INR',
        receipt
      };
      const order = await getRazorpay().orders.create(options);
      return order;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw new AppError('Failed to create payment order with provider', 500);
    }
  }

  static verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  }
}
