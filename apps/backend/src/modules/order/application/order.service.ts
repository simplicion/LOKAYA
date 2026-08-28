import { prisma, OrderStatus } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';

export class OrderService {
  
  static async createOrder(buyerId: string, storeId: string, items: Array<{ productId: string, variantId?: string, quantity: number }>) {
    // We execute everything in a single interactive transaction
    return await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsToCreate = [];

      // 1. Verify items and calculate total, while deducting stock securely
      for (const item of items) {
        // Fetch product to verify and get absolute sellingPrice
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

          // Deduct variant stock
          const updatedVariant = await tx.productVariant.update({
            where: { id: variant.id },
            data: { stockCount: { decrement: item.quantity } }
          });
          if (updatedVariant.stockCount < 0) {
             throw new AppError(`Insufficient stock for variant ${variant.id}`, 400);
          }
        } else {
          // Deduct base product stock
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

        // Add to running total
        totalAmount += (priceToCharge * item.quantity);

        // Prepare order item payload
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
      const order = await tx.order.create({
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

      return order;
    });
  }

  static async getOrder(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true, variant: true }
        },
        store: true,
        payment: true
      }
    });

    if (!order) throw new AppError('Order not found', 404);

    // Verify authorization: only the buyer or the store staff can view the order
    if (order.buyerId !== userId) {
      const isStoreUser = await prisma.storeUser.findUnique({ where: { userId_storeId: { userId, storeId: order.storeId } } });
      if (!isStoreUser) throw new AppError('Unauthorized access to order', 403);
    }

    return order;
  }

  static async updateOrderStatus(orderId: string, userId: string, status: OrderStatus) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true }
    });

    if (!order) throw new AppError('Order not found', 404);

    // Only store staff can update order status manually in this basic implementation
    const isStoreUser = await prisma.storeUser.findUnique({ where: { userId_storeId: { userId, storeId: order.storeId } } });
    if (!isStoreUser) {
       throw new AppError('Unauthorized: Only store staff can update status', 403);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: { product: true, variant: true }
        },
        store: true
      }
    });

    try {
      const { getIO } = require('../../../api/socket');
      const io = getIO();
      if (io) {
        io.to(`order_${orderId}`).emit('order_status_updated', updatedOrder);
      }
    } catch (e) {
      console.error('Socket emit failed (order status update)', e);
    }

    return updatedOrder;
  }
}
