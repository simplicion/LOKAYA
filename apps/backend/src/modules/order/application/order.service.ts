import { prisma, OrderStatus, NotificationType } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';
import { PickupVerificationService } from './pickup-verification.service';

export class OrderService {
  
  static async createOrder(buyerId: string, storeId: string, items: Array<{ productId: string, variantId?: string, quantity: number }>) {
    // We execute everything in a single interactive transaction
    const order = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsToCreate = [];

      // 1. Verify items and calculate total, while deducting stock securely
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || !product.isActive) {
          throw new AppError(`Product ${item.productId} is unavailable`, 400);
        }
        if (product.storeId !== storeId) {
          throw new AppError(`Product ${item.productId} does not belong to the selected store`, 400);
        }

        let priceToCharge = product.sellingPrice;
        let skuToUse = product.sku;

        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (!variant || variant.productId !== item.productId) {
            throw new AppError(`Variant ${item.variantId} is invalid`, 400);
          }
          priceToCharge = variant.price;
          skuToUse = variant.sku;

          const updatedVariant = await tx.productVariant.update({
            where: { id: variant.id },
            data: { stockCount: { decrement: item.quantity } }
          });
          if (updatedVariant.stockCount < 0) {
             throw new AppError(`Insufficient stock for variant ${variant.id}`, 400);
          }
        } else {
          const updatedProduct = await tx.product.update({
            where: { id: product.id },
            data: { stockCount: { decrement: item.quantity } }
          });
          if (updatedProduct.stockCount < 0) {
             throw new AppError(`Insufficient stock for product ${product.id}`, 400);
          }
        }

        // Log the inventory deduction
        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            change: -item.quantity,
            reason: 'ORDER_PLACED'
          }
        });

        totalAmount += (priceToCharge * item.quantity);

        orderItemsToCreate.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          priceAt: priceToCharge,
          productName: product.name,
          sku: skuToUse
        });
      }

      // 2. Create the actual order
      const newOrder = await tx.order.create({
        data: {
          buyerId,
          storeId,
          totalAmount,
          status: 'PENDING',
          items: {
            create: orderItemsToCreate
          }
        },
        include: {
          items: {
            include: { product: true, variant: true }
          },
          store: true
        }
      });

      // Clear the user's cart after successful order creation
      const cart = await tx.cart.findFirst({ where: { userId: buyerId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return newOrder;
    }, { maxWait: 15000, timeout: 30000 });

    // 3. Generate secure pickup verification tokens (OTP + QR)
    try {
      await PickupVerificationService.generatePickupToken(order.id);
    } catch (e) {
      console.error('Failed to initialize pickup token for order:', e);
    }

    // 4. Create in-app notification for the seller
    try {
      await prisma.sellerNotification.create({
        data: {
          storeId,
          type: NotificationType.ORDER,
          title: `New Order Received #${order.id.slice(0, 8)}`,
          message: `You have received a new order for ${order.items.length} items (₹${order.totalAmount}).`,
          linkUrl: `/seller/orders/details?id=${order.id}`
        }
      });
    } catch (e) {
      console.warn('Notification creation failed:', e);
    }

    return order;
  }

  /**
   * Retrieve orders belonging to a store with tab filtering, search, and pagination.
   */
  static async getStoreOrders(
    storeId: string,
    userId: string,
    query: { tab?: string; search?: string; page?: number; limit?: number }
  ) {
    // Verify authorization
    const isStoreUser = await prisma.storeUser.findUnique({
      where: { userId_storeId: { userId, storeId } }
    });
    if (!isStoreUser) {
      throw new AppError('Unauthorized: You do not manage this store', 403);
    }

    const { tab = 'All', search = '', page = 1, limit = 50 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build status filter based on active tab in UI
    let statusFilter: any = undefined;
    const tabLower = tab.toLowerCase();

    if (tabLower === 'new') {
      statusFilter = { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED] };
    } else if (tabLower === 'preparing') {
      statusFilter = { in: [OrderStatus.PROCESSING, OrderStatus.PACKED] };
    } else if (tabLower === 'completed') {
      statusFilter = { in: [OrderStatus.DELIVERED] };
    } else if (tabLower === 'cancelled') {
      statusFilter = { in: [OrderStatus.CANCELLED, OrderStatus.RETURNED, OrderStatus.REFUNDED] };
    }

    // Search filter
    const searchFilter: any = search
      ? {
          OR: [
            { id: { contains: search, mode: 'insensitive' } },
            { buyer: { name: { contains: search, mode: 'insensitive' } } },
            { buyer: { phone: { contains: search, mode: 'insensitive' } } }
          ]
        }
      : {};

    const where = {
      storeId,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...searchFilter
    };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: {
            select: { id: true, name: true, phone: true, avatarUrl: true }
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, imageUrl: true }
              }
            }
          },
          payment: true,
          pickupOtp: true
        }
      })
    ]);

    // Format orders exactly matching frontend expectations
    const formattedOrders = orders.map(order => {
      const isToday = new Date(order.createdAt).toDateString() === new Date().toDateString();
      const timeLabel = isToday
        ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });

      // Map backend OrderStatus to UI Status
      let uiStatus = 'New';
      if (order.status === OrderStatus.PROCESSING) uiStatus = 'Preparing';
      else if (order.status === OrderStatus.PACKED) uiStatus = 'Ready';
      else if (order.status === OrderStatus.DELIVERED) uiStatus = 'Completed';
      else if (order.status === OrderStatus.CANCELLED) uiStatus = 'Cancelled';

      return {
        id: order.id,
        customerName: order.buyer?.name || 'Customer',
        phone: order.buyer?.phone || '+91 Not provided',
        itemsCount: order.items.reduce((acc, i) => acc + i.quantity, 0),
        total: order.totalAmount,
        status: uiStatus,
        rawStatus: order.status,
        timeLabel,
        paymentMethod: order.payment?.provider === 'RAZORPAY' ? 'Prepaid (UPI/Card)' : 'Cash on Pickup',
        pickupTime: isToday ? `Today, ${timeLabel}` : timeLabel,
        pickupOtp: order.pickupOtp?.otpCode || '',
        items: order.items.map(item => ({
          id: item.id,
          name: item.productName || item.product?.name || 'Item',
          qty: item.quantity,
          price: item.priceAt,
          image: item.product?.imageUrl || null
        }))
      };
    });

    return {
      orders: formattedOrders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  }

  static async getOrder(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true, variant: true }
        },
        store: true,
        payment: true,
        buyer: {
          select: { id: true, name: true, phone: true, avatarUrl: true }
        },
        pickupOtp: true
      }
    });

    if (!order) throw new AppError('Order not found', 404);

    // Verify authorization: only the buyer or the store staff can view the order
    if (order.buyerId !== userId) {
      const isStoreUser = await prisma.storeUser.findUnique({ where: { userId_storeId: { userId, storeId: order.storeId } } });
      if (!isStoreUser) throw new AppError('Unauthorized access to order', 403);
    }

    const isToday = new Date(order.createdAt).toDateString() === new Date().toDateString();
    const timeLabel = isToday
      ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });

    let uiStatus = 'New';
    if (order.status === OrderStatus.PROCESSING) uiStatus = 'Preparing';
    else if (order.status === OrderStatus.PACKED) uiStatus = 'Ready';
    else if (order.status === OrderStatus.DELIVERED) uiStatus = 'Completed';
    else if (order.status === OrderStatus.CANCELLED) uiStatus = 'Cancelled';

    return {
      id: order.id,
      customerName: order.buyer?.name || 'Customer',
      phone: order.buyer?.phone || '+91 Not provided',
      itemsCount: order.items.reduce((acc, i) => acc + i.quantity, 0),
      total: order.totalAmount,
      status: uiStatus,
      rawStatus: order.status,
      timeLabel,
      paymentMethod: order.payment?.provider === 'RAZORPAY' ? 'Prepaid (UPI/Card)' : 'Cash on Pickup',
      pickupTime: isToday ? `Today, ${timeLabel}` : timeLabel,
      pickupOtp: order.pickupOtp?.otpCode || '',
      qrToken: order.pickupOtp?.qrToken || '',
      items: order.items.map(item => ({
        id: item.id,
        name: item.productName || item.product?.name || 'Item',
        qty: item.quantity,
        price: item.priceAt,
        image: item.product?.imageUrl || null
      })),
      buyer: order.buyer,
      store: order.store
    };
  }

  static async updateOrderStatus(orderId: string, userId: string, status: OrderStatus | string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true, buyer: true, items: true }
    });

    if (!order) throw new AppError('Order not found', 404);

    const isStoreUser = await prisma.storeUser.findUnique({ where: { userId_storeId: { userId, storeId: order.storeId } } });
    if (!isStoreUser) {
       throw new AppError('Unauthorized: Only store staff can update status', 403);
    }

    // Map UI status string if passed
    let resolvedStatus = status as OrderStatus;
    if (status === 'Preparing') resolvedStatus = OrderStatus.PROCESSING;
    else if (status === 'Ready') resolvedStatus = OrderStatus.PACKED;
    else if (status === 'Completed') resolvedStatus = OrderStatus.DELIVERED;
    else if (status === 'Cancelled') resolvedStatus = OrderStatus.CANCELLED;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: resolvedStatus },
      include: {
        items: {
          include: { product: true, variant: true }
        },
        store: true,
        buyer: true
      }
    });

    // Create In-App Notification if status is PACKED / Ready
    if (resolvedStatus === OrderStatus.PACKED) {
      await prisma.sellerNotification.create({
        data: {
          storeId: order.storeId,
          type: NotificationType.ORDER,
          title: `Order #${orderId.slice(0, 8)} Marked Ready`,
          message: `Customer has been notified for in-store pickup.`,
          linkUrl: `/seller/orders/details?id=${orderId}`
        }
      });
    }

    try {
      const { getIO } = require('../../../api/socket');
      const io = getIO();
      if (io) {
        io.to(`order_${orderId}`).emit('order_status_updated', updatedOrder);
      }
    } catch (e) {
      console.warn('Socket emit failed (order status update)', e);
    }

    return updatedOrder;
  }
}
