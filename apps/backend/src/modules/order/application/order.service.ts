import { prisma, OrderStatus, NotificationType } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';
import { PickupVerificationService } from './pickup-verification.service';
import { ShiprocketService } from '../infrastructure/shiprocket.service';

export class OrderService {
  
  static async createOrder(
    buyerId: string, 
    storeId: string | undefined, 
    items: Array<{ productId: string, variantId?: string, quantity: number }>,
    extra?: { deliveryAddress?: string; paymentMethod?: string; shippingFee?: number }
  ) {
    if (!items || items.length === 0) {
      throw new AppError('No items provided for order', 400);
    }

    // We execute everything in a single interactive transaction
    const order = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      // Map of storeId -> Array of prepared item objects
      const storeItemsMap = new Map<string, Array<any>>();

      // 1. Verify items and calculate total, while deducting stock securely
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || !product.isActive) {
          throw new AppError(`Product "${product?.name || item.productId}" is currently unavailable`, 400);
        }

        const itemStoreId = product.storeId;
        let priceToCharge = product.sellingPrice;
        let skuToUse = product.sku;

        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (!variant || variant.productId !== item.productId) {
            throw new AppError(`Variant ${item.variantId} is invalid for product "${product.name}"`, 400);
          }
          priceToCharge = variant.price;
          skuToUse = variant.sku;

          const updatedVariant = await tx.productVariant.update({
            where: { id: variant.id },
            data: { stockCount: { decrement: item.quantity } }
          });
          if (updatedVariant.stockCount < 0) {
             throw new AppError(`Insufficient stock for "${product.name} - ${variant.name}" (${item.quantity} requested, ${variant.stockCount} available)`, 400);
          }
        } else {
          const updatedProduct = await tx.product.update({
            where: { id: product.id },
            data: { stockCount: { decrement: item.quantity } }
          });
          if (updatedProduct.stockCount < 0) {
             throw new AppError(`Insufficient stock for "${product.name}" (${item.quantity} requested, ${product.stockCount} available)`, 400);
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

        const preparedItem = {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          priceAt: priceToCharge,
          productName: product.name,
          sku: skuToUse,
          storeId: itemStoreId
        };

        if (!storeItemsMap.has(itemStoreId)) {
          storeItemsMap.set(itemStoreId, []);
        }
        storeItemsMap.get(itemStoreId)!.push(preparedItem);
      }

      // Primary storeId for the parent order record
      const firstStoreEntry = Array.from(storeItemsMap.keys())[0];
      const primaryStoreId: string = storeId || firstStoreEntry || '';
      // Check if user has an active cart with an applied coupon
      let couponDiscount = 0;
      const userCart = await tx.cart.findFirst({
        where: { userId: buyerId },
        include: { coupon: true }
      });

      if (userCart?.coupon && userCart.coupon.isActive) {
        const coupon = userCart.coupon;
        const isNotExpired = !coupon.validUntil || coupon.validUntil >= new Date();
        const withinUsageLimit = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
        const meetsMinCart = !coupon.minCartValue || totalAmount >= coupon.minCartValue;

        if (isNotExpired && withinUsageLimit && meetsMinCart) {
          if (coupon.discountType === 'PERCENTAGE') {
            couponDiscount = (totalAmount * coupon.discountValue) / 100;
            if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
              couponDiscount = coupon.maxDiscount;
            }
          } else {
            couponDiscount = Math.min(coupon.discountValue, totalAmount);
          }
          couponDiscount = Math.round(couponDiscount * 100) / 100;

          // Atomically increment coupon usage
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } }
          });
        }
      }

      // 2. Create the parent order
      const finalAmount = Math.max(0, Math.round((totalAmount - couponDiscount + (extra?.shippingFee || 0)) * 100) / 100);
      const newOrder = await tx.order.create({
        data: {
          buyerId,
          storeId: primaryStoreId,
          totalAmount: finalAmount,
          status: 'PENDING',
          deliveryAddress: extra?.deliveryAddress || null,
          paymentMethod: extra?.paymentMethod || 'ONLINE',
          shippingFee: extra?.shippingFee || 0,
        }
      });

      // 3. Create child SubOrders for each merchant store & link OrderItems
      for (const [sId, sItems] of Array.from(storeItemsMap.entries())) {
        const storeSubtotal = sItems.reduce((acc: number, i: any) => acc + (i.priceAt * i.quantity), 0);
        // 8% Platform Take-Rate Commission
        const commissionAmount = Math.round(storeSubtotal * 0.08 * 100) / 100;
        // 92% Net Seller Payout Amount
        const sellerPayoutAmount = Math.round((storeSubtotal - commissionAmount) * 100) / 100;

        const subOrder = await tx.subOrder.create({
          data: {
            orderId: newOrder.id,
            storeId: sId,
            status: 'PENDING',
            subtotal: storeSubtotal,
            commissionAmount,
            sellerPayoutAmount
          }
        });

        // Create the OrderItems linked to both parent Order and child SubOrder
        for (const it of sItems) {
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              subOrderId: subOrder.id,
              productId: it.productId,
              variantId: it.variantId,
              quantity: it.quantity,
              priceAt: it.priceAt,
              productName: it.productName,
              sku: it.sku
            }
          });
        }
      }

      // Clear the user's cart and reset applied coupon after successful order creation
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
        await tx.cart.update({
          where: { id: userCart.id },
          data: { couponId: null }
        });
      }

      return newOrder;
    }, { maxWait: 30000, timeout: 60000 });

    // Fetch order with full subOrders, items, and store populated outside the write transaction
    const populatedOrder = await prisma.order.findUnique({
      where: { id: (order as any).id },
      include: {
        items: {
          include: { product: true, variant: true }
        },
        subOrders: {
          include: { store: true, items: true }
        },
        store: true
      }
    });

    if (!populatedOrder) throw new AppError('Failed to finalize order creation', 500);

    // 4. Generate secure pickup verification tokens (OTP + QR)
    try {
      await PickupVerificationService.generatePickupToken(populatedOrder.id);
    } catch (e) {
      console.error('Failed to initialize pickup token for order:', e);
    }

    // 5. Create in-app notification for each store owner
    for (const subOrder of populatedOrder.subOrders || []) {
      try {
        await prisma.sellerNotification.create({
          data: {
            storeId: subOrder.storeId,
            type: NotificationType.ORDER,
            title: `New Order Received #${populatedOrder.id.slice(0, 8)}`,
            message: `You have received a new order for ${subOrder.items?.length || 1} items (₹${subOrder.subtotal}).`,
            linkUrl: `/seller/orders/details?id=${populatedOrder.id}`
          }
        });
      } catch (e) {
        console.warn('Notification creation failed for store:', subOrder.storeId, e);
      }
    }

    return populatedOrder;
  }

  /**
   * Retrieve all orders placed by a buyer with complete real database relations.
   */
  static async getUserOrders(userId: string) {
    const orders = await prisma.order.findMany({
      where: { buyerId: userId },
      include: {
        items: {
          include: {
            product: {
              include: { media: true }
            },
            variant: true
          }
        },
        store: true,
        subOrders: {
          include: { store: true, items: true }
        },
        payment: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return orders.map(order => {
      const isToday = new Date(order.createdAt).toDateString() === new Date().toDateString();
      const timeLabel = isToday
        ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

      return {
        id: order.id,
        date: timeLabel,
        totalAmount: order.totalAmount,
        shippingFee: order.shippingFee,
        paymentMethod: order.payment?.provider || order.paymentMethod || 'Online',
        status: order.status,
        estimatedDelivery: order.estimatedDelivery || '3 - 5 business days',
        storeName: order.store?.name,
        courierName: order.courierName,
        awbCode: order.awbCode,
        trackingUrl: order.trackingUrl,
        itemsCount: order.items.reduce((s, i) => s + i.quantity, 0),
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          title: item.productName,
          price: item.priceAt,
          quantity: item.quantity,
          image: item.product?.media?.[0]?.url || item.product?.imageUrl || '',
          variantName: item.variant?.name || null
        }))
      };
    });
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
          include: { 
            product: {
              include: { media: true }
            }, 
            variant: true 
          }
        },
        store: true,
        payment: true,
        buyer: {
          select: { id: true, name: true, phone: true, avatarUrl: true, email: true, isSystemAdmin: true }
        },
        pickupOtp: true
      }
    });

    if (!order) throw new AppError('Order not found', 404);

    // Verify authorization: only the buyer, store staff, or system admin can view the order
    if (order.buyerId !== userId) {
      const isStoreUser = await prisma.storeUser.findUnique({ where: { userId_storeId: { userId, storeId: order.storeId } } });
      const requestingUser = await prisma.user.findUnique({ where: { id: userId }, select: { isSystemAdmin: true } });
      if (!isStoreUser && !requestingUser?.isSystemAdmin) {
        throw new AppError('Unauthorized access to order', 403);
      }
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

    let resolvedPaymentMethod = 'Cash on Pickup';
    if (order.payment?.provider === 'RAZORPAY') {
      resolvedPaymentMethod = 'Prepaid (UPI/Card)';
    } else if (order.paymentMethod === 'COD' || order.paymentMethod?.toLowerCase() === 'cod') {
      resolvedPaymentMethod = order.deliveryAddress ? 'Cash on Delivery (COD)' : 'Cash on Pickup';
    } else if (order.paymentMethod) {
      resolvedPaymentMethod = order.paymentMethod;
    }

    return {
      id: order.id,
      buyerId: order.buyerId,
      storeId: order.storeId,
      customerName: order.buyer?.name || 'Customer',
      phone: order.buyer?.phone || '+91 Not provided',
      itemsCount: order.items.reduce((acc, i) => acc + i.quantity, 0),
      total: order.totalAmount,
      totalAmount: order.totalAmount,
      shippingFee: order.shippingFee || 0,
      status: uiStatus,
      rawStatus: order.status,
      timeLabel,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      deliveryAddress: order.deliveryAddress,
      estimatedDelivery: order.estimatedDelivery || (order.deliveryAddress ? 'Within 2 - 4 hours (Express Local)' : 'Ready for Pickup'),
      awbCode: order.awbCode,
      courierName: order.courierName,
      trackingUrl: order.trackingUrl,
      paymentMethod: resolvedPaymentMethod,
      rawPaymentMethod: order.paymentMethod,
      payment: order.payment,
      paymentStatus: order.payment?.status || (order.paymentMethod === 'COD' ? 'PAY_ON_DELIVERY' : 'PENDING'),
      pickupTime: isToday ? `Today, ${timeLabel}` : timeLabel,
      pickupOtp: order.pickupOtp?.otpCode || '',
      qrToken: order.pickupOtp?.qrToken || '',
      items: order.items.map(item => {
        const primaryMedia = item.product?.media?.find((m: any) => m.isPrimary)?.url;
        const firstMedia = item.product?.media?.[0]?.url;
        const imgUrl = primaryMedia || firstMedia || item.product?.imageUrl || null;
        return {
          id: item.id,
          productId: item.productId,
          name: item.productName || item.product?.name || 'Item',
          productName: item.productName || item.product?.name || 'Item',
          title: item.productName || item.product?.name || 'Item',
          qty: item.quantity,
          quantity: item.quantity,
          price: item.priceAt,
          priceAt: item.priceAt,
          sku: item.sku,
          image: imgUrl,
          variantName: item.variant?.name || null,
          variant: item.variant,
          product: item.product ? {
            ...item.product,
            imageUrl: imgUrl
          } : null
        };
      }),
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

    // Keep child SubOrder in sync
    await prisma.subOrder.updateMany({
      where: { orderId: orderId, storeId: order.storeId },
      data: { status: resolvedStatus }
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

  /**
   * Dispatch an order with Shiprocket 3PL Logistics:
   * Registers pickup, books courier, generates AWB, and creates printable shipping label.
   */
  static async dispatchShipment(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        items: true,
        buyer: true
      }
    });

    if (!order) throw new AppError('Order not found', 404);

    // Verify user manages this store
    const isStoreUser = await prisma.storeUser.findUnique({
      where: { userId_storeId: { userId, storeId: order.storeId } }
    });
    if (!isStoreUser) {
      throw new AppError('Unauthorized: You do not manage this store', 403);
    }

    // Call Shiprocket Logistics
    const shipmentResult = await ShiprocketService.createShipmentOrder({
      id: order.id,
      totalAmount: order.totalAmount,
      paymentMethod: (order as any).paymentMethod,
      items: order.items.map(i => ({
        productName: i.productName,
        sku: i.sku,
        quantity: i.quantity,
        priceAt: i.priceAt
      })),
      buyer: order.buyer,
      deliveryAddress: order.deliveryAddress,
      store: order.store
    });

    // Update order with 3PL tracking details
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.SHIPPED,
        shiprocketOrderId: shipmentResult.shiprocketOrderId,
        shiprocketShipmentId: shipmentResult.shipmentId,
        awbCode: shipmentResult.awbCode,
        courierName: shipmentResult.courierName,
        shippingLabelUrl: shipmentResult.shippingLabelUrl,
        trackingUrl: shipmentResult.trackingUrl,
        estimatedDelivery: '3 - 5 Business Days'
      },
      include: {
        items: true,
        store: true,
        buyer: true
      }
    });

    // Update child SubOrder with tracking details as well
    await prisma.subOrder.updateMany({
      where: { orderId: orderId, storeId: order.storeId },
      data: {
        status: OrderStatus.SHIPPED,
        shiprocketOrderId: shipmentResult.shiprocketOrderId,
        shiprocketShipmentId: shipmentResult.shipmentId,
        awbCode: shipmentResult.awbCode,
        courierName: shipmentResult.courierName,
        shippingLabelUrl: shipmentResult.shippingLabelUrl,
        trackingUrl: shipmentResult.trackingUrl,
      }
    });

    // Emit live socket update
    try {
      const { getIO } = require('../../../api/socket');
      const io = getIO();
      if (io) {
        io.to(`order_${orderId}`).emit('order_status_updated', updated);
      }
    } catch (e) {
      console.warn('Socket emit failed (dispatch shipment)', e);
    }

    return updated;
  }

  /**
   * Fetch customer tracking timeline and courier telemetry.
   */
  static async getOrderTracking(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        store: true,
        payment: true
      }
    });

    if (!order) throw new AppError('Order not found', 404);

    const createdAt = order.createdAt;
    const updatedAt = order.updatedAt;

    // Build timeline milestones
    const timeline = [
      {
        status: 'ORDER_PLACED',
        title: 'Order Placed',
        description: 'Your order has been received by Lokaya.',
        completed: true,
        timestamp: createdAt
      },
      {
        status: 'CONFIRMED',
        title: 'Order Confirmed',
        description: order.payment?.status === 'SUCCESS' ? 'Prepaid payment verified via Razorpay.' : 'Cash on Delivery confirmed.',
        completed: order.status !== OrderStatus.PENDING,
        timestamp: createdAt
      },
      {
        status: 'PACKED',
        title: 'Packed & Ready',
        description: `Packed at ${order.store?.name || 'Merchant Store'}.`,
        completed: [OrderStatus.PACKED, OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(order.status as any),
        timestamp: [OrderStatus.PACKED, OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(order.status as any) ? updatedAt : null
      },
      {
        status: 'SHIPPED',
        title: 'Picked Up by Courier',
        description: (order as any).courierName 
          ? `In transit with ${(order as any).courierName} (AWB: ${(order as any).awbCode || 'Pending'})` 
          : 'Package awaiting courier pickup.',
        completed: [OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(order.status as any),
        timestamp: [OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(order.status as any) ? updatedAt : null
      },
      {
        status: 'OUT_FOR_DELIVERY',
        title: 'Out for Delivery',
        description: 'Courier executive is out for delivery in your area.',
        completed: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(order.status as any),
        timestamp: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(order.status as any) ? updatedAt : null
      },
      {
        status: 'DELIVERED',
        title: 'Delivered',
        description: 'Package delivered to your doorstep.',
        completed: order.status === OrderStatus.DELIVERED,
        timestamp: order.status === OrderStatus.DELIVERED ? updatedAt : null
      }
    ];

    return {
      orderId: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      deliveryAddress: order.deliveryAddress,
      courierName: (order as any).courierName,
      awbCode: (order as any).awbCode,
      shippingLabelUrl: (order as any).shippingLabelUrl,
      trackingUrl: (order as any).trackingUrl,
      estimatedDelivery: (order as any).estimatedDelivery || 'Within 3 - 5 business days',
      storeName: order.store?.name,
      itemsCount: order.items.reduce((s, i) => s + i.quantity, 0),
      timeline
    };
  }
}

