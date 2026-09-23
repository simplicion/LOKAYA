import { prisma, OrderStatus, NotificationType } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';
import { PickupVerificationService } from './pickup-verification.service';
import { ShiprocketService } from '../infrastructure/shiprocket.service';
import { CurrencyService } from '../../common/currency.service';

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

        const itemCostPrice = (product as any).costPrice || 0;
        const itemIsDeliveryIncluded = (product as any).isDeliveryIncluded || false;

        const preparedItem = {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          priceAt: priceToCharge,
          costPrice: itemCostPrice,
          isDeliveryIncluded: itemIsDeliveryIncluded,
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

      // 1.5% Buyer Platform Convenience Fee
      const platformFee = Math.round(totalAmount * 0.015 * 100) / 100;

      // 2. Create the parent order
      const finalAmount = Math.max(0, Math.round((totalAmount - couponDiscount + platformFee + (extra?.shippingFee || 0)) * 100) / 100);
      const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const newOrder = await tx.order.create({
        data: {
          buyerId,
          storeId: primaryStoreId,
          totalAmount: finalAmount,
          status: 'PENDING',
          deliveryAddress: extra?.deliveryAddress || null,
          paymentMethod: extra?.paymentMethod || 'ONLINE',
          shippingFee: extra?.shippingFee || 0,
          platformFee,
          deliveryOtp
        }
      });

      // 3. Create child SubOrders for each merchant store & link OrderItems
      for (const [sId, sItems] of Array.from(storeItemsMap.entries())) {
        const storeSubtotal = sItems.reduce((acc: number, i: any) => acc + (i.priceAt * i.quantity), 0);
        
        // 5% Platform Commission on Seller Profit Margin: 5% * (Selling Price - Cost Price)
        const totalStoreProfitMargin = sItems.reduce((acc: number, i: any) => {
          const unitCost = i.costPrice > 0 ? i.costPrice : (i.priceAt * 0.80); // Default assumed 20% margin if costPrice unlisted
          const unitMargin = Math.max(0, i.priceAt - unitCost);
          return acc + (unitMargin * i.quantity);
        }, 0);

        const platformMarginCommission = Math.round(totalStoreProfitMargin * 0.05 * 100) / 100;
        const sellerPayoutAmount = Math.round((storeSubtotal - platformMarginCommission) * 100) / 100;

        const subOrder = await tx.subOrder.create({
          data: {
            orderId: newOrder.id,
            storeId: sId,
            status: 'PENDING',
            subtotal: storeSubtotal,
            commissionAmount: platformMarginCommission,
            platformMarginCommission,
            sellerPayoutAmount,
            shippingCollected: extra?.shippingFee || 0
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

    // 5. Automated Real-time Alerts: FCM Push + In-App Notifications + Socket.io Events
    try {
      const { FcmService } = require('../../notification/application/fcm.service');
      const { getIO } = require('../../../api/socket');
      let io: any = null;
      try { io = getIO(); } catch (e) {}

      // Collect stores involved
      const storeMap = new Map<string, { total: number; count: number }>();
      if (populatedOrder.subOrders && populatedOrder.subOrders.length > 0) {
        for (const sub of populatedOrder.subOrders) {
          storeMap.set(sub.storeId, { total: Number(sub.subtotal) || 0, count: sub.items?.length || 1 });
        }
      } else if (populatedOrder.storeId) {
        storeMap.set(populatedOrder.storeId, { total: Number(populatedOrder.totalAmount) || 0, count: populatedOrder.items?.length || 1 });
      }

      // Dispatch to each store seller
      storeMap.forEach((info, storeId) => {
        FcmService.notifySellerNewOrder(storeId, populatedOrder.id, {
          itemsCount: info.count,
          totalAmount: info.total,
          buyerName: (populatedOrder as any).buyer?.name
        }).catch((err: any) => console.warn('[FCM] Seller new order push error:', err));

        if (io) {
          io.to(`store_${storeId}`).emit('new_order', {
            orderId: populatedOrder.id,
            totalAmount: info.total,
            itemsCount: info.count,
            storeId
          });
        }
      });

      // Dispatch to customer/buyer
      if (populatedOrder.buyerId) {
        FcmService.notifyCustomerOrderPlaced(populatedOrder.buyerId, populatedOrder.id, {
          storeName: (populatedOrder.store as any)?.name || 'Lokaya Store',
          totalAmount: Number(populatedOrder.totalAmount) || 0,
          itemsCount: populatedOrder.items?.length || 1
        }).catch((err: any) => console.warn('[FCM] Buyer order placed push error:', err));

        if (io) {
          io.to(`user_${populatedOrder.buyerId}`).emit('order_placed', {
            orderId: populatedOrder.id,
            totalAmount: populatedOrder.totalAmount
          });
        }
      }
    } catch (e) {
      console.warn('Realtime notifications emit error on createOrder:', e);
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

      let resolvedPaymentMethod = 'Prepaid (Online)';
      if (order.payment?.provider === 'RAZORPAY') {
        resolvedPaymentMethod = 'Prepaid (Razorpay)';
      } else if (order.paymentMethod === 'COD' || order.paymentMethod?.toLowerCase() === 'cod') {
        resolvedPaymentMethod = 'Cash on Delivery (COD)';
      } else if (order.paymentMethod) {
        resolvedPaymentMethod = order.paymentMethod;
      }

      return {
        id: order.id,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        date: timeLabel,
        timeLabel,
        totalAmount: order.totalAmount,
        shippingFee: order.shippingFee,
        paymentMethod: resolvedPaymentMethod,
        rawPaymentMethod: order.paymentMethod,
        paymentStatus: order.payment?.status || (order.paymentMethod === 'COD' ? 'PAY_ON_DELIVERY' : 'PENDING'),
        payment: order.payment,
        status: order.status,
        deliveryAddress: order.deliveryAddress,
        estimatedDelivery: order.estimatedDelivery || (order.deliveryAddress ? 'Within 3 - 5 business days' : 'Ready for Pickup'),
        store: order.store ? {
          id: order.store.id,
          name: order.store.name,
          logoUrl: order.store.logoUrl,
          city: (order.store as any).city || null
        } : null,
        storeName: order.store?.name || 'Artisan Merchant Store',
        courierName: order.courierName,
        awbCode: order.awbCode,
        trackingUrl: order.trackingUrl,
        itemsCount: order.items.reduce((s, i) => s + i.quantity, 0),
        items: order.items.map(item => {
          const primaryMedia = item.product?.media?.find((m: any) => m.isPrimary)?.url;
          const firstImageMedia = item.product?.media?.find((m: any) => m.type === 'IMAGE')?.url;
          const firstMedia = item.product?.media?.[0]?.url;
          const imgUrl = primaryMedia || firstImageMedia || firstMedia || item.product?.imageUrl || '';
          const title = item.productName || item.product?.name || 'Product Item';
          return {
            id: item.id,
            productId: item.productId,
            productName: title,
            title: title,
            name: title,
            price: item.priceAt,
            priceAt: item.priceAt,
            quantity: item.quantity,
            image: imgUrl,
            imageUrl: imgUrl,
            variantName: item.variant?.name || null,
            variant: item.variant,
            product: item.product ? {
              id: item.product.id,
              name: item.product.name,
              imageUrl: item.product.imageUrl || imgUrl,
              media: item.product.media
            } : null
          };
        })
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

    // Search query
    const searchFilter = search
      ? {
          OR: [
            { id: { contains: search, mode: 'insensitive' as const } },
            { invoiceNumber: { contains: search, mode: 'insensitive' as const } },
            { customerName: { contains: search, mode: 'insensitive' as const } },
            { customerPhone: { contains: search, mode: 'insensitive' as const } },
            { buyer: { name: { contains: search, mode: 'insensitive' as const } } },
            { buyer: { phone: { contains: search, mode: 'insensitive' as const } } }
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
            select: { id: true, name: true, phone: true, avatarUrl: true, email: true }
          },
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
          pickupOtp: true,
          deliveryPartner: {
            include: {
              user: { select: { id: true, name: true, phone: true, avatarUrl: true } }
            }
          }
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
      else if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.OUT_FOR_DELIVERY) uiStatus = 'Shipped';
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

      const mappedItems = order.items.map(item => {
        const primaryMedia = item.product?.media?.find((m: any) => m.isPrimary)?.url;
        const firstMedia = item.product?.media?.[0]?.url;
        const imgUrl = primaryMedia || firstMedia || item.product?.imageUrl || null;
        return {
          id: item.id,
          productId: item.productId,
          name: item.productName || item.product?.name || 'Item',
          productName: item.productName || item.product?.name || 'Item',
          qty: item.quantity,
          quantity: item.quantity,
          price: item.priceAt,
          priceAt: item.priceAt,
          sku: item.sku || item.variant?.sku || item.product?.sku || '',
          variantName: item.variant?.name || null,
          image: imgUrl,
          product: item.product ? {
            ...item.product,
            imageUrl: imgUrl
          } : null
        };
      });

      return {
        id: order.id,
        customerName: order.customerName || order.buyer?.name || 'Customer',
        phone: order.customerPhone || order.buyer?.phone || '+91 Not provided',
        customerPhone: order.customerPhone || order.buyer?.phone || '',
        customerEmail: order.customerEmail || order.buyer?.email || '',
        itemsCount: order.items.reduce((acc, i) => acc + i.quantity, 0),
        total: order.totalAmount,
        totalAmount: order.totalAmount,
        discountAmount: order.discountAmount || 0,
        invoiceNumber: order.invoiceNumber || `INV-${new Date(order.createdAt).toISOString().slice(0, 10).replace(/-/g, '')}-${order.id.slice(0, 6).toUpperCase()}`,
        isManualBooking: Boolean(order.isManualBooking),
        notes: order.notes || null,
        shippingFee: order.shippingFee || 0,
        status: uiStatus,
        rawStatus: order.status,
        timeLabel,
        createdAt: order.createdAt,
        deliveryAddress: order.deliveryAddress,
        deliveryOtp: order.deliveryOtp,
        fulfillmentType: order.fulfillmentType,
        deliveryPartner: order.deliveryPartner ? {
          id: order.deliveryPartner.id,
          name: order.deliveryPartner.user.name,
          phone: order.deliveryPartner.user.phone,
          vehicleType: order.deliveryPartner.vehicleType,
          vehicleNumber: order.deliveryPartner.vehicleNumber,
          avatarUrl: order.deliveryPartner.user.avatarUrl
        } : null,
        paymentMethod: resolvedPaymentMethod,
        rawPaymentMethod: order.paymentMethod,
        pickupTime: isToday ? `Today, ${timeLabel}` : timeLabel,
        pickupOtp: order.pickupOtp?.otpCode || '',
        firstItemImage: mappedItems[0]?.image || null,
        firstItemName: mappedItems[0]?.name || 'Item',
        firstItemSku: mappedItems[0]?.sku || '',
        firstItemVariant: mappedItems[0]?.variantName || null,
        items: mappedItems
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
        pickupOtp: true,
        deliveryPartner: {
          include: {
            user: { select: { id: true, name: true, phone: true, avatarUrl: true } }
          }
        }
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
    else if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.OUT_FOR_DELIVERY) uiStatus = 'Shipped';
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
      customerName: order.customerName || order.buyer?.name || 'Customer',
      phone: order.customerPhone || order.buyer?.phone || '+91 Not provided',
      customerPhone: order.customerPhone || order.buyer?.phone || '',
      customerEmail: order.customerEmail || order.buyer?.email || '',
      itemsCount: order.items.reduce((acc, i) => acc + i.quantity, 0),
      total: order.totalAmount,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount || 0,
      invoiceNumber: order.invoiceNumber || `INV-${new Date(order.createdAt).toISOString().slice(0, 10).replace(/-/g, '')}-${order.id.slice(0, 6).toUpperCase()}`,
      isManualBooking: Boolean(order.isManualBooking),
      notes: order.notes || null,
      shippingFee: order.shippingFee || 0,
      platformFee: order.platformFee || 0,
      status: uiStatus,
      rawStatus: order.status,
      timeLabel,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      pickedUpAt: order.pickedUpAt,
      outForDeliveryAt: order.outForDeliveryAt,
      deliveredAt: order.deliveredAt,
      deliveryAddress: order.deliveryAddress,
      deliveryOtp: order.deliveryOtp,
      fulfillmentType: order.fulfillmentType,
      deliveryPartner: order.deliveryPartner ? {
        id: order.deliveryPartner.id,
        name: order.deliveryPartner.user.name,
        phone: order.deliveryPartner.user.phone,
        vehicleType: order.deliveryPartner.vehicleType,
        vehicleNumber: order.deliveryPartner.vehicleNumber,
        avatarUrl: order.deliveryPartner.user.avatarUrl
      } : null,
      estimatedDelivery: order.estimatedDelivery && !order.estimatedDelivery.toLowerCase().includes('hour') && !order.estimatedDelivery.toLowerCase().includes('express local') && !order.estimatedDelivery.includes('2-4') && !order.estimatedDelivery.includes('2 - 4') && !order.estimatedDelivery.includes('2 – 4') ? order.estimatedDelivery : (order.deliveryAddress ? '2-3 days' : 'Ready for Pickup'),
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

    // Edge case resilience: If order is cancelled, free any assigned delivery partner
    if (resolvedStatus === OrderStatus.CANCELLED && order.deliveryPartnerId) {
      await prisma.$transaction([
        prisma.deliveryAssignment.updateMany({
          where: { orderId: order.id, status: { notIn: ['DELIVERED', 'CANCELLED'] as any } },
          data: { status: 'CANCELLED' as any }
        }),
        prisma.deliveryPartner.update({
          where: { id: order.deliveryPartnerId },
          data: { isBusy: false }
        }),
        prisma.order.update({
          where: { id: order.id },
          data: { deliveryPartnerId: null }
        })
      ]);
    }

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

    // Automated Push Notification Trigger to Customer
    try {
      const { FcmService } = require('../../notification/application/fcm.service');
      FcmService.notifyOrderStatusChanged(orderId, resolvedStatus).catch((err: any) =>
        console.warn('[FCM] Order push dispatch error:', err)
      );
    } catch (e) {
      // ignore
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

    // Geo-Fulfillment Gate: Shiprocket 3PL is only available for stores registered in India
    if (!CurrencyService.isIndianEntity(order.store)) {
      throw new AppError(
        'Shiprocket 3PL logistics is only available for stores registered in India. For international stores (e.g. Nepal), please fulfill via local delivery or in-store pickup.',
        400
      );
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
   * Fetch customer tracking timeline and courier telemetry with 8-stage synchronized milestones.
   */
  static async getOrderTracking(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        store: true,
        payment: true,
        deliveryPartner: {
          include: {
            user: { select: { id: true, name: true, phone: true, avatarUrl: true } }
          }
        },
        deliveryAssignments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        pickupOtp: true
      }
    });

    if (!order) throw new AppError('Order not found', 404);

    const createdAt = order.createdAt;
    const updatedAt = order.updatedAt;
    const deliveryOtp = order.deliveryOtp || null;
    const latestAssignment = order.deliveryAssignments?.[0];
    const riderName = order.deliveryPartner?.user.name || 'Partner Rider';

    const isAssigned = Boolean(order.deliveryPartnerId || latestAssignment);
    const isAccepted = latestAssignment?.status === 'ACCEPTED' || ['ARRIVED_AT_STORE', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER', 'DELIVERED'].includes(latestAssignment?.status as string);
    const isDispatched = [OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(order.status as any) || ['PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER', 'DELIVERED'].includes(latestAssignment?.status as string);
    const isOutForDelivery = [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(order.status as any) || ['OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER', 'DELIVERED'].includes(latestAssignment?.status as string);
    const isArrivedAtDestination = ['ARRIVED_AT_CUSTOMER', 'DELIVERED'].includes(latestAssignment?.status as string) || order.status === OrderStatus.DELIVERED;
    const isDelivered = order.status === OrderStatus.DELIVERED || latestAssignment?.status === 'DELIVERED';

    // Format timestamps with human-readable dates and times
    const formatStepTime = (dt: Date | null | undefined, isComplete: boolean) => {
      if (!dt || !isComplete) return { timestamp: null, time: null, formattedDate: null, displayTime: null };
      const d = new Date(dt);
      if (isNaN(d.getTime())) return { timestamp: null, time: null, formattedDate: null, displayTime: null };
      
      const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        timestamp: d.toISOString(),
        time,
        formattedDate,
        displayTime: `${formattedDate}, ${time}`
      };
    };

    // Raw milestone events with exact dates
    const rawMilestones = [
      {
        status: 'ORDER_PLACED',
        title: 'Order Placed',
        description: 'Your order has been placed successfully on Lokaya.',
        completed: true,
        dt: createdAt
      },
      {
        status: 'CONFIRMED',
        title: 'Order Confirmed',
        description: order.payment?.status === 'SUCCESS' ? 'Prepaid payment verified via Razorpay.' : 'Cash on Delivery verified.',
        completed: order.status !== OrderStatus.PENDING,
        dt: order.payment?.createdAt || createdAt
      },
      {
        status: 'PACKED',
        title: 'Packed & Ready',
        description: `Items packed and sealed at ${order.store?.name || 'Merchant Store'}.`,
        completed: [OrderStatus.PACKED, OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(order.status as any) || isAssigned,
        dt: [OrderStatus.PACKED, OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(order.status as any) ? updatedAt : null
      },
      {
        status: 'ASSIGNED',
        title: order.deliveryPartner ? `Assigned to ${riderName}` : 'Awaiting Rider Assignment',
        description: order.deliveryPartner 
          ? `Order assigned to ${riderName} (${order.deliveryPartner.vehicleType} - ${order.deliveryPartner.vehicleNumber}).`
          : 'Store is assigning order to local delivery partner.',
        completed: isAssigned,
        dt: latestAssignment?.assignedAt || (isAssigned ? updatedAt : null)
      },
      {
        status: 'HEADING_TO_STORE',
        title: 'Rider Heading to Store',
        description: isAccepted 
          ? `${riderName} accepted the order and is driving to ${order.store?.name || 'the store'}.`
          : 'Waiting for rider to accept and start route.',
        completed: isAccepted,
        dt: latestAssignment?.acceptedAt || (isAccepted ? updatedAt : null)
      },
      {
        status: 'SHIPPED',
        title: 'Dispatched from Store',
        description: isDispatched
          ? `Store verified pickup OTP. Parcel handed over to ${riderName}.`
          : 'Rider will present pickup OTP to store merchant.',
        completed: isDispatched,
        dt: order.pickedUpAt || latestAssignment?.pickedUpAt || (isDispatched ? updatedAt : null)
      },
      {
        status: 'OUT_FOR_DELIVERY',
        title: 'Out for Delivery',
        description: isOutForDelivery
          ? `${riderName} is heading to your doorstep.`
          : 'Rider en route to delivery destination.',
        completed: isOutForDelivery,
        dt: order.outForDeliveryAt || latestAssignment?.outForDeliveryAt || (isOutForDelivery ? updatedAt : null)
      },
      {
        status: 'ARRIVED_AT_DESTINATION',
        title: 'Arrived at Destination',
        description: isArrivedAtDestination
          ? `${riderName} has arrived at your destination and is at your doorstep.`
          : `${riderName} will reach your destination shortly.`,
        completed: isArrivedAtDestination,
        dt: latestAssignment?.arrivedCustomerAt || (isArrivedAtDestination ? (order.deliveredAt || updatedAt) : null)
      },
      {
        status: 'DELIVERED',
        title: 'Delivered Successfully',
        description: isDelivered 
          ? 'Package delivered to your doorstep. Handover verified via OTP.'
          : 'Share your 4-digit Delivery OTP with rider upon arrival.',
        completed: isDelivered,
        dt: order.deliveredAt || latestAssignment?.deliveredAt || (isDelivered ? updatedAt : null)
      }
    ];

    // Find current active step index
    let currentActiveIdx = -1;
    for (let i = 0; i < rawMilestones.length; i++) {
      if (!rawMilestones[i].completed) {
        currentActiveIdx = i;
        break;
      }
    }
    if (currentActiveIdx === -1 && isDelivered) {
      currentActiveIdx = rawMilestones.length - 1;
    }

    // Build complete 8-milestone timeline with timestamps
    const timeline = rawMilestones.map((m, idx) => {
      const timeInfo = formatStepTime(m.dt, m.completed);
      return {
        status: m.status,
        title: m.title,
        description: m.description,
        completed: m.completed,
        isCurrent: idx === currentActiveIdx,
        timestamp: timeInfo.timestamp,
        time: timeInfo.time,
        formattedDate: timeInfo.formattedDate,
        displayTime: timeInfo.displayTime
      };
    });

    return {
      orderId: order.id,
      status: (latestAssignment?.status === 'ARRIVED_AT_CUSTOMER' && order.status !== OrderStatus.DELIVERED)
        ? 'ARRIVED_AT_CUSTOMER'
        : order.status,
      totalAmount: order.totalAmount,
      deliveryAddress: order.deliveryAddress,
      deliveryOtp,
      fulfillmentType: order.fulfillmentType,
      deliveryPartner: order.deliveryPartner ? {
        id: order.deliveryPartner.id,
        name: order.deliveryPartner.user.name,
        phone: order.deliveryPartner.user.phone,
        vehicleType: order.deliveryPartner.vehicleType,
        vehicleNumber: order.deliveryPartner.vehicleNumber,
        avatarUrl: order.deliveryPartner.user.avatarUrl
      } : null,
      courierName: (order as any).courierName,
      awbCode: (order as any).awbCode,
      shippingLabelUrl: (order as any).shippingLabelUrl,
      trackingUrl: (order as any).trackingUrl,
      estimatedDelivery: (order as any).estimatedDelivery && !(order as any).estimatedDelivery.toLowerCase().includes('hour') && !(order as any).estimatedDelivery.toLowerCase().includes('express local') && !(order as any).estimatedDelivery.includes('2-4') && !(order as any).estimatedDelivery.includes('2 - 4') && !(order as any).estimatedDelivery.includes('2 – 4') ? (order as any).estimatedDelivery : '2-3 days',
      storeName: order.store?.name,
      itemsCount: order.items.reduce((s, i) => s + i.quantity, 0),
      timeline
    };
  }

  static async createManualOrder(
    sellerUserId: string,
    payload: {
      storeId: string;
      customerName?: string | null;
      customerPhone?: string | null;
      customerEmail?: string | null;
      paymentMethod?: string;
      discountAmount?: number;
      notes?: string | null;
      items: Array<{
        productId: string;
        variantId?: string | null;
        quantity: number;
        customPrice?: number | null;
      }>;
    }
  ) {
    if (!payload.items || payload.items.length === 0) {
      throw new AppError('No items provided for manual booking', 400);
    }

    if (!payload.customerName || !payload.customerName.trim()) {
      throw new AppError('Customer name is required', 400);
    }

    // 1. Verify seller authorization for store
    const isStoreUser = await prisma.storeUser.findUnique({
      where: { userId_storeId: { userId: sellerUserId, storeId: payload.storeId } }
    });
    const requestingUser = await prisma.user.findUnique({
      where: { id: sellerUserId },
      select: { isSystemAdmin: true }
    });
    if (!isStoreUser && !requestingUser?.isSystemAdmin) {
      throw new AppError('Unauthorized: You can only book manual sales for your own store', 403);
    }

    // 2. Fetch store metadata
    const store = await prisma.store.findUnique({ where: { id: payload.storeId } });
    if (!store) throw new AppError('Store not found', 404);

    const isIndian = CurrencyService.isIndianEntity(store);
    const currency = isIndian ? 'INR' : 'NPR';
    const currencySymbol = isIndian ? '₹' : 'रू';

    // 3. Atomically validate products, deduct inventory, and create records
    const orderResult = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const preparedItems: Array<{
        productId: string;
        variantId?: string | null;
        quantity: number;
        priceAt: number;
        productName: string;
        sku: string;
        variantName?: string | null;
        image?: string | null;
      }> = [];

      for (const item of payload.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { media: true }
        });
        if (!product || product.storeId !== payload.storeId) {
          throw new AppError(`Product "${product?.name || item.productId}" does not belong to this store`, 400);
        }

        let priceToCharge = item.customPrice != null ? item.customPrice : product.sellingPrice;
        let skuToUse = product.sku;
        let variantName: string | null = null;

        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (!variant || variant.productId !== item.productId) {
            throw new AppError(`Variant ${item.variantId} is invalid for product "${product.name}"`, 400);
          }
          if (item.customPrice == null) {
            priceToCharge = variant.price;
          }
          skuToUse = variant.sku;
          variantName = variant.name;

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

        // Audit inventory deduction
        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            change: -item.quantity,
            reason: 'MANUAL_ORDER_SALE'
          }
        });

        const lineTotal = priceToCharge * item.quantity;
        subtotal += lineTotal;

        const primaryMedia = product.media?.find((m: any) => m.isPrimary)?.url || product.media?.[0]?.url || product.imageUrl || null;

        preparedItems.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          priceAt: priceToCharge,
          productName: product.name,
          sku: skuToUse,
          variantName,
          image: primaryMedia
        });
      }

      const discount = Math.max(0, Number(payload.discountAmount || 0));
      const totalAmount = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

      // Create Parent Order
      const newOrder = await tx.order.create({
        data: {
          buyerId: sellerUserId,
          storeId: payload.storeId,
          status: 'DELIVERED',
          totalAmount,
          shippingFee: 0,
          paymentMethod: payload.paymentMethod || 'CASH',
          deliveryAddress: 'Walk-in Customer / In-Store Sale',
          isManualBooking: true,
          customerName: payload.customerName?.trim() || 'Walk-in Customer',
          customerPhone: payload.customerPhone?.trim() || null,
          customerEmail: payload.customerEmail?.trim() || null,
          discountAmount: discount,
          invoiceNumber,
          notes: payload.notes?.trim() || null
        }
      });

      // Create Child SubOrder
      const subOrder = await tx.subOrder.create({
        data: {
          orderId: newOrder.id,
          storeId: payload.storeId,
          status: 'DELIVERED',
          subtotal: totalAmount,
          commissionAmount: 0,
          sellerPayoutAmount: totalAmount,
          invoiceNumber
        }
      });

      // Create Order Items
      for (const it of preparedItems) {
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

      // Create Completed Payment Record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          amount: totalAmount,
          currency,
          status: 'SUCCESS',
          provider: payload.paymentMethod || 'CASH',
          providerPaymentId: `manual_${newOrder.id.slice(0, 8)}`
        }
      });

      // Record in Seller Financial Ledger
      await tx.sellerTransaction.create({
        data: {
          storeId: payload.storeId,
          orderId: newOrder.id,
          title: `In-Store POS Sale #${newOrder.id.slice(0, 8).toUpperCase()}`,
          amount: totalAmount,
          type: 'CREDIT',
          description: `Manual In-Store POS Sale (${invoiceNumber})`
        }
      });

      return {
        order: newOrder,
        subOrder,
        items: preparedItems,
        subtotal,
        discount,
        totalAmount,
        invoiceNumber,
        currency,
        currencySymbol,
        store
      };
    }, { maxWait: 15000, timeout: 30000 });

    // 4. Asynchronously send email invoice if email was provided
    if (payload.customerEmail && payload.customerEmail.includes('@')) {
      try {
        const { EmailService } = require('../../notification/application/email.service');
        const emailService = new EmailService();
        emailService.sendInvoiceEmail(payload.customerEmail.trim(), {
          invoiceNumber: orderResult.invoiceNumber,
          orderId: orderResult.order.id,
          orderDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          storeName: store.name,
          storeAddress: store.address ? `${store.address}${store.city ? `, ${store.city}` : ''}${store.state ? `, ${store.state}` : ''}` : undefined,
          storePhone: store.contactPhone || undefined,
          storeGst: store.gstNumber || undefined,
          customerName: payload.customerName || 'Walk-in Customer',
          paymentMethod: payload.paymentMethod || 'CASH',
          items: orderResult.items.map(i => ({
            name: i.productName,
            variant: i.variantName || undefined,
            sku: i.sku,
            quantity: i.quantity,
            price: i.priceAt,
            total: i.priceAt * i.quantity
          })),
          subtotal: orderResult.subtotal,
          discountAmount: orderResult.discount,
          shippingFee: 0,
          totalAmount: orderResult.totalAmount,
          currencySymbol,
          isManualBooking: true
        }).catch((err: any) => console.warn('Failed to dispatch background invoice email:', err));
      } catch (err) {
        console.warn('Email dispatch init failed:', err);
      }
    }

    // 5. Emit real-time WebSocket event
    try {
      const { getIO } = require('../../../api/socket');
      const io = getIO();
      io.to(`store_${payload.storeId}`).emit('order_created', {
        orderId: orderResult.order.id,
        isManualBooking: true,
        totalAmount: orderResult.totalAmount,
        invoiceNumber: orderResult.invoiceNumber
      });
    } catch (e) {
      // socket fallback
    }

    return {
      success: true,
      message: 'Manual order created and stock updated successfully',
      orderId: orderResult.order.id,
      invoiceNumber: orderResult.invoiceNumber,
      totalAmount: orderResult.totalAmount,
      order: orderResult.order
    };
  }

  static async getOrderInvoice(orderId: string, userId: string) {
    const orderData = await this.getOrder(orderId, userId);
    const store = await prisma.store.findUnique({ where: { id: orderData.storeId } });
    if (!store) throw new AppError('Store not found', 404);

    const isIndian = CurrencyService.isIndianEntity(store);
    const currency = isIndian ? 'INR' : 'NPR';
    const currencySymbol = isIndian ? '₹' : 'रू';

    const itemsSubtotal = orderData.items.reduce((acc: number, it: any) => {
      const p = Number(it.price || it.priceAt || 0);
      const q = Number(it.qty || it.quantity || 1);
      return acc + (p * q);
    }, 0);

    const invoiceNumber = orderData.invoiceNumber || `INV-${new Date(orderData.createdAt).toISOString().slice(0, 10).replace(/-/g, '')}-${orderData.id.slice(0, 6).toUpperCase()}`;

    return {
      invoiceNumber,
      orderId: orderData.id,
      orderDate: new Date(orderData.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      store: {
        id: store.id,
        name: store.name,
        address: store.address,
        city: store.city,
        state: store.state,
        pincode: store.pincode,
        gstNumber: store.gstNumber,
        contactPhone: store.contactPhone,
        logoUrl: store.logoUrl,
        bannerUrl: store.bannerUrl
      },
      customer: {
        name: orderData.customerName || 'Walk-in Customer',
        phone: orderData.customerPhone || orderData.phone || '',
        email: orderData.customerEmail || '',
        address: orderData.deliveryAddress || 'Over-the-Counter / Walk-in'
      },
      payment: {
        method: orderData.paymentMethod,
        rawMethod: orderData.rawPaymentMethod,
        status: orderData.paymentStatus,
        currency,
        currencySymbol
      },
      isManualBooking: Boolean(orderData.isManualBooking),
      notes: orderData.notes || '',
      items: orderData.items.map((it: any, idx: number) => ({
        slNo: idx + 1,
        id: it.id,
        productId: it.productId,
        name: it.name || it.productName,
        sku: it.sku,
        variantName: it.variantName || null,
        image: it.image || null,
        quantity: it.quantity || it.qty || 1,
        unitPrice: Number(it.price || it.priceAt || 0),
        total: Number(it.price || it.priceAt || 0) * Number(it.quantity || it.qty || 1)
      })),
      pricing: {
        subtotal: itemsSubtotal,
        discountAmount: Number(orderData.discountAmount || 0),
        shippingFee: Number(orderData.shippingFee || 0),
        totalAmount: Number(orderData.totalAmount || orderData.total || itemsSubtotal),
        currency,
        currencySymbol
      }
    };
  }

  /**
   * Public Parcel Verification & Lost Parcel Rescue Desk
   * Unauthenticated callback for smartphone camera QR scans on physical parcel slips.
   */
  static async getPublicParcelVerification(orderId: string) {
    if (!orderId || typeof orderId !== 'string') {
      throw new AppError('Invalid order identifier', 400);
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { pickupToken: orderId },
          { id: { startsWith: orderId } }
        ]
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            contactPhone: true,
            address: true,
            logoUrl: true,
            city: true
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              include: {
                media: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            },
            variant: true
          }
        },
        payment: {
          select: {
            status: true,
            provider: true
          }
        },
        deliveryPartner: {
          include: {
            user: { select: { name: true, phone: true } }
          }
        }
      }
    });

    if (!order) {
      throw new AppError('Parcel not found or invalid QR code. If this is a lost parcel, please contact Lokaya customer support.', 404);
    }

    const isCod = 
      order.paymentMethod?.toLowerCase().includes('cash') || 
      order.paymentMethod?.toLowerCase().includes('cod') || 
      order.payment?.status !== 'SUCCESS';

    const shortId = order.id.slice(0, 8).toUpperCase();

    return {
      orderId: order.id,
      shortId,
      reference: `#LOK-${shortId}`,
      status: order.status,
      isDelivered: order.status === OrderStatus.DELIVERED,
      isDispatched: [OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(order.status as any),
      paymentMethod: isCod ? 'CASH ON DELIVERY (COD)' : 'PREPAID',
      isCod,
      collectAmount: isCod ? order.totalAmount : 0,
      totalAmount: order.totalAmount,
      currency: 'INR',
      currencySymbol: '₹',
      dispatchedAt: order.pickedUpAt || order.createdAt,
      createdAt: order.createdAt,
      store: {
        name: order.store?.name || 'Partner Merchant Store',
        address: order.store?.address || 'Store Location on Record',
        phone: order.store?.contactPhone || '+91 Support Line',
        city: order.store?.city || null
      },
      recipient: {
        name: order.customerName || order.buyer?.name || 'Customer',
        phone: order.customerPhone || order.buyer?.phone || 'Contact via Lokaya',
        deliveryAddress: order.deliveryAddress || 'Address on Record'
      },
      rider: order.deliveryPartner ? {
        name: order.deliveryPartner.user.name,
        phone: order.deliveryPartner.user.phone
      } : null,
      items: order.items.map(item => {
        const primaryImg = item.product?.media?.[0]?.url || item.product?.imageUrl || null;
        return {
          id: item.id,
          name: item.productName || item.product?.name || 'Item',
          sku: item.sku,
          variantName: item.variant?.name || null,
          quantity: item.quantity,
          image: primaryImg
        };
      }),
      platform: 'Lokaya Hyperlocal Delivery Network',
      supportPhone: '+91 80000 56529',
      supportEmail: 'support@lokaya.in'
    };
  }
}


