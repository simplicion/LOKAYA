import { prisma } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';
import { RazorpayService } from '../infrastructure/razorpay.service';
import { CurrencyService } from '../../common/currency.service';
import { OrderService } from '../../order/application/order.service';

export class PaymentService {
  
  static async createPaymentSession(userId: string, orderId: string, amount: number) {
    // 1. Verify order exists, belongs to user, and fetch associated store info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        subOrders: {
          include: {
            store: true
          }
        }
      }
    });

    if (!order) throw new AppError('Order not found', 404);
    if (order.buyerId !== userId) throw new AppError('Unauthorized', 403);
    if (order.status !== 'PENDING') throw new AppError('Order is no longer pending payment', 400);

    // 2. Create Razorpay order
    const razorpayOrder = await RazorpayService.createOrder(amount, `receipt_${orderId}`);

    // 4. Save payment intent in DB (upsert if retry)
    const payment = await prisma.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        amount,
        provider: 'RAZORPAY',
        status: 'PENDING',
        providerOrderId: razorpayOrder.id,
      },
      update: {
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

      // 3. Update Order and child SubOrders
      await tx.subOrder.updateMany({
        where: { orderId: systemOrderId },
        data: { status: 'CONFIRMED' }
      });

      const updatedOrder = await tx.order.update({
        where: { id: systemOrderId },
        data: { status: 'CONFIRMED' },
        include: {
          items: true,
          store: true,
          subOrders: true
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
    }, { timeout: 30000, maxWait: 10000 });
  }

  static async create180PaymentSession(userId: string, orderId: string, amount: number, currency: string = 'NPR') {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        subOrders: {
          include: {
            store: true
          }
        }
      }
    });

    if (!order) throw new AppError('Order not found', 404);
    if (order.buyerId !== userId) throw new AppError('Unauthorized', 403);
    if (order.status !== 'PENDING') throw new AppError('Order is no longer pending payment', 400);

    const sessionId = `180_sess_${orderId}_${Date.now()}`;

    const payment = await prisma.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        amount,
        currency,
        provider: 'ONE_EIGHTY',
        status: 'PENDING',
        providerOrderId: sessionId,
      },
      update: {
        amount,
        currency,
        provider: 'ONE_EIGHTY',
        status: 'PENDING',
        providerOrderId: sessionId,
      }
    });

    return { payment, sessionId, amount, currency, orderId };
  }

  static async fulfill180Payment(sessionId: string, transactionId: string, metadataOrderId?: string) {
    return await prisma.$transaction(async (tx) => {
      let payment = await tx.payment.findFirst({
        where: {
          OR: [
            { providerOrderId: sessionId },
            ...(metadataOrderId ? [{ orderId: metadataOrderId }] : [])
          ]
        }
      });

      if (!payment) {
        throw new AppError('Payment record not found for 180 session ' + sessionId, 404);
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          providerPaymentId: transactionId || sessionId
        }
      });

      await tx.subOrder.updateMany({
        where: { orderId: payment.orderId },
        data: { status: 'CONFIRMED' }
      });

      const updatedOrder = await tx.order.update({
        where: { id: payment.orderId },
        data: { status: 'CONFIRMED' },
        include: {
          items: true,
          store: true,
          subOrders: true
        }
      });

      try {
        const { getIO } = require('../../../api/socket');
        const io = getIO();
        if (io) {
          io.to(`order_${updatedOrder.id}`).emit('order_status_updated', updatedOrder);
        }
      } catch (e) {
        console.error('Socket emit failed for 180 payment confirmation', e);
      }

      return { success: true, order: updatedOrder };
    }, { timeout: 30000, maxWait: 10000 });
  }
}

