import { prisma } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';
import { RazorpayService } from '../infrastructure/razorpay.service';
import { OrderService } from '../../order/application/order.service';

export class PaymentService {
  
  static async createPaymentSession(userId: string, orderId: string, amount: number) {
    // 1. Verify order exists and belongs to user
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('Order not found', 404);
    if (order.buyerId !== userId) throw new AppError('Unauthorized', 403);
    if (order.status !== 'PENDING') throw new AppError('Order is no longer pending payment', 400);

    // 2. Create Razorpay order
    const razorpayOrder = await RazorpayService.createOrder(amount, `receipt_${orderId}`);

    // 3. Save payment intent in DB
    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount,
        provider: 'RAZORPAY',
        status: 'PENDING',
        providerOrderId: razorpayOrder.id,
      }
    });

    return { payment, razorpayOrder };
  }

  static async verifyPaymentSignature(
    razorpayOrderId: string, 
    razorpayPaymentId: string, 
    razorpaySignature: string, 
    systemOrderId: string,
    userId: string
  ) {
    // 1. Verify signature
    const isValid = RazorpayService.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      throw new AppError('Invalid payment signature', 400);
    }

    return await prisma.$transaction(async (tx) => {
      // 2. Update Payment record
      const payment = await tx.payment.findFirst({
        where: { orderId: systemOrderId, providerOrderId: razorpayOrderId }
      });

      if (!payment) {
        throw new AppError('Payment record not found', 404);
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          providerPaymentId: razorpayPaymentId
        }
      });

      // 3. Update Order status to CONFIRMED as per user request
      const updatedOrder = await tx.order.update({
        where: { id: systemOrderId },
        data: { status: 'CONFIRMED' },
        include: {
          items: { include: { product: true, variant: true } },
          store: true
        }
      });

      // 4. Emit Socket event for real-time update
      try {
        const { getIO } = require('../../../api/socket');
        const io = getIO();
        if (io) {
          io.to(`order_${updatedOrder.id}`).emit('order_status_updated', updatedOrder);
        }
      } catch (e) {
        console.error('Socket emit failed for payment confirmation', e);
      }

      return { success: true, order: updatedOrder };
    });
  }
}
