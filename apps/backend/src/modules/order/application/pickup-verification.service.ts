import { prisma, OrderStatus, TransactionType, NotificationType } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';
import crypto from 'crypto';

export class PickupVerificationService {
  /**
   * Generates a secure 4-digit pickup OTP and an HMAC-signed QR token for an order.
   */
  static async generatePickupToken(orderId: string): Promise<{ otpCode: string; qrToken: string }> {
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const secret = process.env.JWT_SECRET || 'lokaya-pickup-secret';
    const qrToken = crypto.createHmac('sha256', secret).update(`${orderId}:${otpCode}`).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day validity

    await prisma.orderPickupOtp.upsert({
      where: { orderId },
      create: {
        orderId,
        otpCode,
        qrToken,
        expiresAt,
        isUsed: false
      },
      update: {
        otpCode,
        qrToken,
        expiresAt,
        isUsed: false
      }
    });

    return { otpCode, qrToken };
  }

  /**
   * Verifies the customer's pickup OTP or scanned QR code token and fulfills the order.
   */
  static async verifyAndFulfillPickup(
    orderId: string,
    sellerUserId: string,
    inputOtp?: string,
    inputQr?: string
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        pickupOtp: true,
        items: true,
        buyer: true
      }
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Verify seller ownership of store
    const isStoreStaff = await prisma.storeUser.findFirst({
      where: { userId: sellerUserId, storeId: order.storeId }
    });
    if (!isStoreStaff) {
      throw new AppError('Unauthorized: You do not manage this store', 403);
    }

    if (order.status === OrderStatus.DELIVERED) {
      return { success: true, message: 'Order is already marked as Delivered', order };
    }

    // Retrieve or auto-generate pickup token if missing
    let tokenRecord = order.pickupOtp;
    if (!tokenRecord) {
      const generated = await this.generatePickupToken(orderId);
      tokenRecord = await prisma.orderPickupOtp.findUnique({ where: { orderId } });
    }

    if (!tokenRecord) {
      throw new AppError('Could not initialize pickup verification for this order', 500);
    }

    if (tokenRecord.isUsed) {
      throw new AppError('Pickup code has already been used for fulfillment', 400);
    }

    let isMatch = false;

    // Check OTP match (matches order deliveryOtp, tokenRecord otpCode, or universal test fallback '1234' in dev mode)
    if (inputOtp) {
      const cleanInput = inputOtp.trim();
      if (
        (order.deliveryOtp && cleanInput === order.deliveryOtp.trim()) ||
        (tokenRecord && cleanInput === tokenRecord.otpCode.trim()) ||
        (process.env.NODE_ENV !== 'production' && cleanInput === '1234')
      ) {
        isMatch = true;
      }
    }

    // Check QR Token match (or orderId included in payload)
    if (inputQr && (tokenRecord?.qrToken === inputQr.trim() || inputQr.trim() === orderId || inputQr.includes(orderId))) {
      isMatch = true;
    }

    if (!isMatch) {
      throw new AppError('Invalid OTP code. Please request customer for current 4-digit code.', 400);
    }

    // Transactional fulfillment: Order status -> DELIVERED, token used -> true, financial credit -> ledger
    const fulfilledOrder = await prisma.$transaction(async (tx) => {
      // 1. Mark token as used if present
      if (tokenRecord) {
        await tx.orderPickupOtp.update({
          where: { orderId },
          data: { isUsed: true }
        });
      }

      // 2. Mark order as DELIVERED
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { 
          status: OrderStatus.DELIVERED,
          deliveredAt: new Date()
        },
        include: {
          items: true,
          buyer: true,
          store: true
        }
      });

      // 3. If a delivery partner was assigned, mark assignment completed and free rider
      if (order.deliveryPartnerId) {
        await tx.deliveryAssignment.updateMany({
          where: { orderId, deliveryPartnerId: order.deliveryPartnerId },
          data: { status: 'DELIVERED' as any, deliveredAt: new Date() }
        });
        await tx.deliveryPartner.update({
          where: { id: order.deliveryPartnerId },
          data: { isBusy: false }
        });
      }

      // 4. Post CREDIT entry to Seller Transaction Ledger
      await tx.sellerTransaction.create({
        data: {
          storeId: order.storeId,
          orderId,
          title: `Order #${orderId.slice(0, 8)} Pickup Completed`,
          amount: order.totalAmount,
          type: TransactionType.CREDIT,
          description: `Customer pickup verified successfully via OTP`
        }
      });

      // 5. Create in-app seller notification
      await tx.sellerNotification.create({
        data: {
          storeId: order.storeId,
          type: NotificationType.ORDER,
          title: `Order #${orderId.slice(0, 8)} Delivered`,
          message: `${order.buyer?.name || 'Customer'} has picked up ${order.items.length} items.`,
          linkUrl: `/seller/orders/details?id=${orderId}`
        }
      });

      return updated;
    }, { maxWait: 15000, timeout: 30000 });

    // Broadcast WebSocket event
    try {
      const { getIO } = require('../../../api/socket');
      const io = getIO();
      if (io) {
        io.to(`order_${orderId}`).emit('order_status_updated', fulfilledOrder);
        io.to(`store_${order.storeId}`).emit('seller_order_fulfilled', fulfilledOrder);
      }
    } catch (e) {
      console.warn('Socket broadcast skipped:', e);
    }

    return {
      success: true,
      message: 'Pickup verified and order fulfilled successfully',
      order: fulfilledOrder
    };
  }
}
