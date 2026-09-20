import { prisma, BatchDispatchStatus, DeliveryAssignmentStatus, FulfillmentType, OrderStatus } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';
import { FuelRateService } from './fuel-rate.service';
import { ParcelAssignmentService } from './parcel-assignment.service';

export interface BatchItemCalculation {
  orderId: string;
  subOrderId?: string;
  customerName: string;
  deliveryAddress: string;
  shippingCollected: number;
  riderShare: number;
  merchantShare: number;
  isFirstDrop: boolean;
  dropSequence: number;
  itemsCount: number;
  orderTotal: number;
}

export interface BatchEconomicsResult {
  storeId: string;
  totalDrops: number;
  totalShippingCollected: number;
  totalRiderPayout: number;
  totalMerchantProfit: number;
  drops: BatchItemCalculation[];
}

export class BatchDispatchService {
  /**
   * Retrieves all orders for a store that are packed and ready for dispatch, clustered by area/pincode.
   */
  static async getStoreReadyOrdersForDispatch(storeId: string) {
    const orders = await prisma.order.findMany({
      where: {
        storeId,
        status: { in: [OrderStatus.PACKED, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.PENDING] },
        deliveryAddress: { not: null },
        batchItems: { none: { batch: { status: { in: ['PENDING', 'ACCEPTED', 'IN_TRANSIT'] } } } }
      },
      include: {
        buyer: { select: { id: true, name: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true, costPrice: true, isDeliveryIncluded: true } }
          }
        },
        subOrders: {
          where: { storeId }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group orders by locality/pincode extracted from delivery address
    const clustersMap = new Map<string, typeof orders>();

    for (const order of orders) {
      const address = order.deliveryAddress || '';
      // Extract pincode (e.g. 6 digits) or city/zone keyword
      const pincodeMatch = address.match(/\b\d{6}\b/);
      const zoneKey = pincodeMatch ? `Pin: ${pincodeMatch[0]}` : (address.split(',').slice(-2)[0]?.trim() || 'Local Area');

      if (!clustersMap.has(zoneKey)) {
        clustersMap.set(zoneKey, []);
      }
      clustersMap.get(zoneKey)!.push(order);
    }

    const clusters = Array.from(clustersMap.entries()).map(([zone, zoneOrders]) => ({
      zone,
      ordersCount: zoneOrders.length,
      totalShippingCollected: zoneOrders.reduce((sum, o) => sum + (o.shippingFee || 50), 0),
      orders: zoneOrders.map((o: any) => ({
        id: o.id,
        subOrderId: o.subOrders?.[0]?.id,
        customerName: o.customerName || o.buyer?.name || 'Customer',
        customerPhone: o.customerPhone || o.buyer?.phone || '',
        deliveryAddress: o.deliveryAddress,
        status: o.status,
        shippingFee: o.shippingFee || 50,
        totalAmount: o.totalAmount,
        itemsCount: o.items?.length || 0,
        firstItemImage: o.items?.[0]?.product?.imageUrl || null,
        firstItemName: o.items?.[0]?.product?.name || o.items?.[0]?.productName || 'Order Package',
        createdAt: o.createdAt
      }))
    }));

    return {
      storeId,
      totalReadyOrders: orders.length,
      clusters
    };
  }

  /**
   * Calculates the 50/50 Multi-Drop financial sharing breakdown for a given list of order IDs.
   * Drop 1: Rider gets 100% of shipping.
   * Drops 2..N: Shipping is split 50% to Rider and 50% to Merchant.
   */
  static async calculateBatchEconomics(storeId: string, orderIds: string[]): Promise<BatchEconomicsResult> {
    if (!orderIds || orderIds.length === 0) {
      throw new AppError('No order IDs provided for batch calculation', 400);
    }

    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        storeId
      },
      include: {
        buyer: { select: { name: true, phone: true } },
        subOrders: { where: { storeId } },
        items: true
      }
    });

    if (orders.length === 0) {
      throw new AppError('No matching store orders found', 404);
    }

    // Sort orders by shippingFee descending so the largest customer payment serves as Drop 1 base
    const sortedOrders = [...orders].sort((a, b) => (b.shippingFee || 50) - (a.shippingFee || 50));

    let totalShippingCollected = 0;
    let totalRiderPayout = 0;
    let totalMerchantProfit = 0;

    const drops: BatchItemCalculation[] = sortedOrders.map((order: any, idx: number) => {
      const shippingCollected = order.shippingFee || 50;
      const isFirstDrop = idx === 0;

      let riderShare = 0;
      let merchantShare = 0;

      if (isFirstDrop) {
        // Drop 1: 100% to Rider, 0% to Merchant
        riderShare = shippingCollected;
        merchantShare = 0;
      } else {
        // Drops 2..N: 50% to Rider, 50% to Merchant
        riderShare = Math.round(shippingCollected * 0.50 * 100) / 100;
        merchantShare = Math.round(shippingCollected * 0.50 * 100) / 100;
      }

      totalShippingCollected += shippingCollected;
      totalRiderPayout += riderShare;
      totalMerchantProfit += merchantShare;

      return {
        orderId: order.id,
        subOrderId: order.subOrders?.[0]?.id,
        customerName: order.customerName || order.buyer?.name || 'Customer',
        deliveryAddress: order.deliveryAddress || 'Customer Address',
        shippingCollected,
        riderShare,
        merchantShare,
        isFirstDrop,
        dropSequence: idx + 1,
        itemsCount: order.items?.length || 0,
        orderTotal: order.totalAmount
      };
    });

    return {
      storeId,
      totalDrops: sortedOrders.length,
      totalShippingCollected: Math.round(totalShippingCollected * 100) / 100,
      totalRiderPayout: Math.round(totalRiderPayout * 100) / 100,
      totalMerchantProfit: Math.round(totalMerchantProfit * 100) / 100,
      drops
    };
  }

  /**
   * Creates a consolidated DeliveryBatch in database and assigns it to a delivery partner.
   */
  static async createBatchDispatch(
    storeId: string, 
    orderIds: string[], 
    fulfillmentType: 'LOKAYA_AUTO' | 'LOKAYA_PARTNER' | 'SELF_DELIVERY' = 'LOKAYA_PARTNER',
    deliveryPartnerId?: string
  ) {
    const economics = await this.calculateBatchEconomics(storeId, orderIds);

    let assignedPartnerId: string | null = deliveryPartnerId || null;

    if (fulfillmentType === 'LOKAYA_AUTO' && !assignedPartnerId) {
      // Find best nearby partner rider for the store
      const match = await ParcelAssignmentService.findBestRiderForOrder(orderIds[0], storeId);
      if (match) {
        assignedPartnerId = match.rider.id;
      }
    }

    // Execute atomic transaction for batch creation and suborder updates
    const batch = await prisma.$transaction(async (tx) => {
      const newBatch = await (tx as any).deliveryBatch.create({
        data: {
          storeId,
          deliveryPartnerId: assignedPartnerId,
          status: 'PENDING',
          totalDrops: economics.totalDrops,
          completedDrops: 0,
          totalShippingCollected: economics.totalShippingCollected,
          totalRiderPayout: economics.totalRiderPayout,
          totalMerchantProfit: economics.totalMerchantProfit
        }
      });

      // Create DeliveryBatchItem for each order & update SubOrder settlement records
      for (const drop of economics.drops) {
        const order = await tx.order.findUnique({
          where: { id: drop.orderId },
          select: { deliveryOtp: true }
        });

        await (tx as any).deliveryBatchItem.create({
          data: {
            batchId: newBatch.id,
            orderId: drop.orderId,
            subOrderId: drop.subOrderId,
            dropSequence: drop.dropSequence,
            shippingCollected: drop.shippingCollected,
            riderShare: drop.riderShare,
            merchantShare: drop.merchantShare,
            isFirstDrop: drop.isFirstDrop,
            customerOtp: order?.deliveryOtp || '1234'
          }
        });

        // Update SubOrder with 50/50 multi-drop settlement
        if (drop.subOrderId) {
          await tx.subOrder.update({
            where: { id: drop.subOrderId },
            data: {
              shippingPaidToRider: drop.riderShare,
              shippingMerchantProfit: drop.merchantShare
            }
          });
        }

        // Update Order status
        await tx.order.update({
          where: { id: drop.orderId },
          data: {
            status: OrderStatus.SHIPPED,
            fulfillmentType: fulfillmentType as any,
            deliveryPartnerId: assignedPartnerId
          }
        });

        // If rider is assigned, create assignment record
        if (assignedPartnerId) {
          await tx.deliveryAssignment.create({
            data: {
              orderId: drop.orderId,
              deliveryPartnerId: assignedPartnerId,
              status: DeliveryAssignmentStatus.ASSIGNED,
              deliveryFee: drop.riderShare
            }
          });
        }
      }

      if (assignedPartnerId) {
        await tx.deliveryPartner.update({
          where: { id: assignedPartnerId },
          data: { isBusy: true }
        });
      }

      return newBatch;
    }, { timeout: 30000, maxWait: 10000 });

    return {
      batchId: batch.id,
      assignedPartnerId,
      economics
    };
  }

  /**
   * Rider verifies OTP for an individual drop within a batch.
   */
  static async verifyBatchDropOtp(batchId: string, orderId: string, otp: string, partnerId: string) {
    const batchItem = await (prisma as any).deliveryBatchItem.findFirst({
      where: {
        batchId,
        orderId
      },
      include: {
        batch: true,
        order: true
      }
    });

    if (!batchItem) {
      throw new AppError('Drop item not found in batch', 404);
    }

    if (batchItem.isCompleted) {
      throw new AppError('This drop has already been completed', 400);
    }

    const actualOtp = batchItem.customerOtp || batchItem.order.deliveryOtp;
    if (actualOtp && actualOtp !== otp) {
      throw new AppError('Invalid customer delivery OTP code', 400);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Mark batch item completed
      await (tx as any).deliveryBatchItem.update({
        where: { id: batchItem.id },
        data: {
          isCompleted: true,
          completedAt: new Date()
        }
      });

      // 2. Mark order completed
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt: new Date()
        }
      });

      if (batchItem.subOrderId) {
        await tx.subOrder.update({
          where: { id: batchItem.subOrderId },
          data: { status: OrderStatus.DELIVERED }
        });
      }

      // 3. Increment batch completed drops
      const updatedBatch = await (tx as any).deliveryBatch.update({
        where: { id: batchId },
        data: {
          completedDrops: { increment: 1 }
        }
      });

      // 4. If all drops completed, complete batch and release rider
      const isAllDone = updatedBatch.completedDrops >= updatedBatch.totalDrops;
      if (isAllDone) {
        await (tx as any).deliveryBatch.update({
          where: { id: batchId },
          data: { status: 'COMPLETED' }
        });

        await tx.deliveryPartner.update({
          where: { id: partnerId },
          data: {
            isBusy: false,
            totalDeliveries: { increment: updatedBatch.totalDrops },
            totalEarnings: { increment: updatedBatch.totalRiderPayout }
          }
        });
      }

      return {
        success: true,
        isAllBatchCompleted: isAllDone,
        completedDrops: updatedBatch.completedDrops,
        totalDrops: updatedBatch.totalDrops
      };
    }, { timeout: 30000, maxWait: 10000 });
  }

  /**
   * Retrieves the currently active multi-drop delivery batch for a delivery partner.
   */
  static async getActiveBatchForPartner(userId: string) {
    const partner = await prisma.deliveryPartner.findFirst({
      where: {
        OR: [
          { userId },
          { id: userId }
        ]
      }
    });

    if (!partner) {
      return null;
    }

    const activeBatch = await (prisma as any).deliveryBatch.findFirst({
      where: {
        deliveryPartnerId: partner.id,
        status: { in: ['PENDING', 'ACCEPTED', 'IN_TRANSIT'] }
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            address: true,
            contactPhone: true,
            latitude: true,
            longitude: true
          }
        },
        items: {
          include: {
            order: {
              include: {
                buyer: { select: { name: true, phone: true } },
                items: {
                  include: {
                    product: { select: { name: true, imageUrl: true } }
                  }
                }
              }
            }
          },
          orderBy: { dropSequence: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!activeBatch) {
      return null;
    }

    return {
      id: activeBatch.id,
      storeId: activeBatch.storeId,
      store: activeBatch.store,
      status: activeBatch.status,
      totalDrops: activeBatch.totalDrops,
      completedDrops: activeBatch.completedDrops,
      totalShippingCollected: activeBatch.totalShippingCollected,
      totalRiderPayout: activeBatch.totalRiderPayout,
      totalMerchantProfit: activeBatch.totalMerchantProfit,
      drops: activeBatch.items.map((item: any) => ({
        id: item.id,
        orderId: item.orderId,
        subOrderId: item.subOrderId,
        dropSequence: item.dropSequence,
        shippingCollected: item.shippingCollected,
        riderShare: item.riderShare,
        merchantShare: item.merchantShare,
        isFirstDrop: item.isFirstDrop,
        isCompleted: item.isCompleted,
        completedAt: item.completedAt,
        customerName: item.order?.customerName || item.order?.buyer?.name || 'Customer',
        customerPhone: item.order?.customerPhone || item.order?.buyer?.phone || '',
        deliveryAddress: item.order?.deliveryAddress || 'Customer Address',
        orderTotal: item.order?.totalAmount,
        itemsCount: item.order?.items?.length || 0,
        firstItemName: item.order?.items?.[0]?.product?.name || item.order?.items?.[0]?.productName || 'Package',
        firstItemImage: item.order?.items?.[0]?.product?.imageUrl || null
      }))
    };
  }

  /**
   * Rider updates the status of the entire batch (e.g. ACCEPTED, IN_TRANSIT).
   */
  static async updateBatchStatus(batchId: string, status: string, userId: string) {
    const batch = await (prisma as any).deliveryBatch.findUnique({
      where: { id: batchId }
    });

    if (!batch) {
      throw new AppError('Delivery batch not found', 404);
    }

    const updated = await (prisma as any).deliveryBatch.update({
      where: { id: batchId },
      data: { status: status as any }
    });

    // If IN_TRANSIT, update orders status to OUT_FOR_DELIVERY
    if (status === 'IN_TRANSIT') {
      const items = await (prisma as any).deliveryBatchItem.findMany({
        where: { batchId }
      });
      for (const it of items) {
        if (!it.isCompleted) {
          await prisma.order.update({
            where: { id: it.orderId },
            data: { status: OrderStatus.OUT_FOR_DELIVERY, outForDeliveryAt: new Date() }
          });
        }
      }
    }

    return updated;
  }
}

