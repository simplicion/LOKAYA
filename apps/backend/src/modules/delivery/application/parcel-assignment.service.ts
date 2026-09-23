import { prisma, DeliveryPartnerStatus, PartnerRequestStatus, DeliveryAssignmentStatus, FulfillmentType } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';
import { FuelRateService, FuelBenchmarkData } from './fuel-rate.service';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export class ParcelAssignmentService {
  /**
   * Calculates the great-circle distance between two geographic coordinates using the Haversine formula (in kilometers).
   */
  static calculateDistanceKm(coord1: LocationCoordinates, coord2: LocationCoordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);

    const lat1 = this.toRadians(coord1.latitude);
    const lat2 = this.toRadians(coord2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c * 10) / 10;
  }

  private static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Calculates dynamic order delivery economics: Store-to-Customer distance, live fuel benchmarks, and customer delivery fee.
   */
  static async getOrderDeliveryEconomics(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: { select: { id: true, latitude: true, longitude: true, name: true, city: true } },
        buyer: { select: { id: true, latitude: true, longitude: true, name: true } },
        subOrders: true
      }
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const storeLat = order.store.latitude || 28.6139;
    const storeLng = order.store.longitude || 77.2090;
    const buyerLat = order.buyer.latitude || (storeLat + 0.045); // default ~5km away
    const buyerLng = order.buyer.longitude || (storeLng + 0.045);

    const distanceKm = this.calculateDistanceKm(
      { latitude: storeLat, longitude: storeLng },
      { latitude: buyerLat, longitude: buyerLng }
    );

    const countryCode = FuelRateService.detectCountry(storeLat, storeLng);
    const benchmark = await FuelRateService.getFuelBenchmark(countryCode);

    const feeCalculation = FuelRateService.calculateDeliveryFee(distanceKm, benchmark);

    return {
      orderId,
      storeId: order.store.id,
      distanceKm: feeCalculation.distanceKm,
      twoWayDistanceKm: feeCalculation.twoWayDistanceKm,
      benchmarkDeliveryFee: feeCalculation.deliveryFee,
      customerPaidShippingFee: order.shippingFee || feeCalculation.deliveryFee,
      isLongDistance: feeCalculation.isLongDistance,
      fuelPricePerLiter: feeCalculation.fuelPricePerLiter,
      standardBikeMileage: feeCalculation.standardBikeMileage,
      fuelCostPerKm: feeCalculation.fuelCostPerKm,
      estimatedFuelExpense: feeCalculation.estimatedFuelCost,
      estimatedLaborPayout: feeCalculation.estimatedLaborCost,
      laborPercentage: feeCalculation.laborPercentage,
      currency: benchmark.currency,
      currencySymbol: benchmark.currencySymbol,
      benchmark
    };
  }

  /**
   * Smart Engine: Finds and scores available delivery partners for a store order.
   * Priority 1: Store-partnered riders within operating radius.
   * Priority 2: General Lokaya delivery partners sorted by pickup distance.
   */
  static async findBestRiderForOrder(orderId: string, storeId: string, maxRadiusKm = 15) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { latitude: true, longitude: true, name: true, city: true }
    });

    const storeLat = store?.latitude || 28.6139;
    const storeLng = store?.longitude || 77.2090;

    // 1. Query online, approved, non-busy delivery partners who have not previously rejected this order
    const candidates = await prisma.deliveryPartner.findMany({
      where: {
        status: DeliveryPartnerStatus.APPROVED,
        isOnline: true,
        isBusy: false,
        assignments: {
          none: {
            orderId,
            status: DeliveryAssignmentStatus.REJECTED
          }
        }
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true, avatarUrl: true, latitude: true, longitude: true }
        },
        partnerStores: {
          where: { storeId, status: PartnerRequestStatus.ACCEPTED }
        }
      }
    });

    if (candidates.length === 0) {
      return null;
    }

    // 2. Score and rank candidates
    const scoredCandidates = candidates.map((rider) => {
      const riderLat = rider.currentLatitude || rider.user.latitude || storeLat;
      const riderLng = rider.currentLongitude || rider.user.longitude || storeLng;

      const distanceToStoreKm = this.calculateDistanceKm(
        { latitude: storeLat, longitude: storeLng },
        { latitude: riderLat, longitude: riderLng }
      );

      const isStorePartner = rider.partnerStores.length > 0;
      
      // Ranking score: Lower score is better
      // Store partner gets a significant distance equivalent bonus (-5km equivalent)
      let score = distanceToStoreKm;
      if (isStorePartner) {
        score -= 5.0;
      }
      // Higher rating gives a slight boost
      score -= (rider.rating - 4.0) * 0.5;

      return {
        rider,
        distanceToStoreKm: Math.round(distanceToStoreKm * 10) / 10,
        isStorePartner,
        score
      };
    });

    // 3. Filter within acceptable search radius and sort by score ascending
    const viableCandidates = scoredCandidates
      .filter((c) => c.distanceToStoreKm <= maxRadiusKm)
      .sort((a, b) => a.score - b.score);

    if (viableCandidates.length === 0) {
      return scoredCandidates.sort((a, b) => a.score - b.score)[0] || null;
    }

    return viableCandidates[0];
  }

  /**
   * Automatically assigns a delivery partner to an order using the parcel assigning engine.
   */
  static async autoAssignOrder(orderId: string, storeId: string, deliveryFee?: number) {
    const economics = await this.getOrderDeliveryEconomics(orderId);
    const finalDeliveryFee = deliveryFee !== undefined ? deliveryFee : economics.benchmarkDeliveryFee;

    const match = await this.findBestRiderForOrder(orderId, storeId);

    if (!match) {
      return {
        assigned: false,
        message: 'No available delivery partners are currently online near the store location.'
      };
    }

    const rider = match.rider;

    // Calculate rider quote based on rider's custom perKmRate and 2-way round trip distance
    const riderRate = (rider as any).perKmRate || economics.benchmark.standardPerKmRate;
    const riderBaseFare = (rider as any).baseFare || 40;
    const calculatedRiderQuote = Math.max(riderBaseFare, Math.round(economics.twoWayDistanceKm * riderRate));
    const effectiveFee = deliveryFee !== undefined ? deliveryFee : calculatedRiderQuote;

    // Transactional reservation to prevent race conditions
    const assignment = await prisma.$transaction(async (tx) => {
      // 1. Lock rider status
      await tx.deliveryPartner.update({
        where: { id: rider.id },
        data: { isBusy: true }
      });

      // 2. Create delivery assignment
      const newAssignment = await tx.deliveryAssignment.create({
        data: {
          orderId,
          deliveryPartnerId: rider.id,
          status: DeliveryAssignmentStatus.ASSIGNED,
          deliveryFee: effectiveFee
        }
      });

      // 3. Update order with fulfillment details
      await tx.order.update({
        where: { id: orderId },
        data: {
          fulfillmentType: FulfillmentType.LOKAYA_AUTO,
          deliveryPartnerId: rider.id
        }
      });

      // 4. Update SubOrder shipping settlements
      const subOrder = await tx.subOrder.findFirst({
        where: { orderId, storeId }
      });

      if (subOrder) {
        const shippingCollected = (subOrder as any).shippingCollected || economics.customerPaidShippingFee;
        const shippingMerchantProfit = Math.round((shippingCollected - effectiveFee) * 100) / 100;

        await (tx.subOrder as any).update({
          where: { id: subOrder.id },
          data: {
            shippingCollected,
            shippingPaidToRider: effectiveFee,
            shippingMerchantProfit
          }
        });
      }

      return newAssignment;
    }, { timeout: 30000, maxWait: 10000 });

    // Notify rider via WebSockets and FCM
    try {
      const storeRecord = await prisma.store.findUnique({ where: { id: storeId }, select: { name: true } });
      const { FcmService } = require('../../notification/application/fcm.service');
      FcmService.notifyRiderDeliveryAssigned(rider.userId, orderId, {
        storeName: storeRecord?.name || 'Partner Store',
        earning: effectiveFee
      }).catch((err: any) => console.warn('[FCM] Rider assignment push error:', err));

      const { getIO } = require('../../../api/socket');
      const io = getIO();
      if (io) {
        io.to(`rider_${rider.userId}`).emit('delivery_assigned', {
          assignmentId: assignment.id,
          orderId,
          distanceKm: match.distanceToStoreKm,
          isStorePartner: match.isStorePartner,
          deliveryFee: effectiveFee
        });
      }
    } catch (e) {
      console.warn('[Socket]: Assignment notification skipped', e);
    }

    return {
      assigned: true,
      assignment,
      rider: {
        id: rider.id,
        name: rider.user.name,
        phone: rider.user.phone,
        vehicleType: rider.vehicleType,
        vehicleNumber: rider.vehicleNumber,
        distanceKm: match.distanceToStoreKm,
        isStorePartner: match.isStorePartner,
        deliveryFee: effectiveFee
      }
    };
  }

  /**
   * Manually assigns an order to a specific partnered delivery partner chosen by the seller.
   */
  static async assignToPartnerRider(orderId: string, storeId: string, deliveryPartnerId: string, deliveryFee?: number) {
    const economics = await this.getOrderDeliveryEconomics(orderId);

    // Validate partner connection
    const partnerRel = await prisma.storeDeliveryPartner.findUnique({
      where: {
        storeId_deliveryPartnerId: { storeId, deliveryPartnerId }
      },
      include: {
        deliveryPartner: {
          include: { user: true }
        }
      }
    });

    if (!partnerRel || partnerRel.status !== PartnerRequestStatus.ACCEPTED) {
      throw new AppError('The selected delivery partner is not an accepted partner of this store', 400);
    }

    const rider = partnerRel.deliveryPartner;

    // Calculate rider quote based on rider's custom rate
    const riderRate = (rider as any).perKmRate || 8.0;
    const riderBaseFare = (rider as any).baseFare || 40.0;
    const calculatedRiderQuote = Math.max(riderBaseFare, Math.round(economics.twoWayDistanceKm * riderRate));
    const effectiveFee = deliveryFee !== undefined ? deliveryFee : calculatedRiderQuote;

    const assignment = await prisma.$transaction(async (tx) => {
      await tx.deliveryPartner.update({
        where: { id: rider.id },
        data: { isBusy: true }
      });

      const newAssignment = await tx.deliveryAssignment.create({
        data: {
          orderId,
          deliveryPartnerId: rider.id,
          status: DeliveryAssignmentStatus.ASSIGNED,
          deliveryFee: effectiveFee
        }
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          fulfillmentType: FulfillmentType.LOKAYA_PARTNER,
          deliveryPartnerId: rider.id
        }
      });

      // Update SubOrder shipping settlements
      const subOrder = await tx.subOrder.findFirst({
        where: { orderId, storeId }
      });

      if (subOrder) {
        const shippingCollected = (subOrder as any).shippingCollected || economics.customerPaidShippingFee;
        const shippingMerchantProfit = Math.round((shippingCollected - effectiveFee) * 100) / 100;

        await (tx.subOrder as any).update({
          where: { id: subOrder.id },
          data: {
            shippingCollected,
            shippingPaidToRider: effectiveFee,
            shippingMerchantProfit
          }
        });
      }

      // Ensure OrderPickupOtp and deliveryOtp exist
      const existingOtp = await tx.orderPickupOtp.findUnique({ where: { orderId } });
      if (!existingOtp) {
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        await tx.orderPickupOtp.create({
          data: {
            orderId,
            otpCode,
            qrToken: `QR-${orderId.slice(0, 8)}-${otpCode}`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        });
      }

      const existingOrder = await tx.order.findUnique({ where: { id: orderId } });
      if (!existingOrder?.deliveryOtp) {
        const dOtp = Math.floor(1000 + Math.random() * 9000).toString();
        await tx.order.update({
          where: { id: orderId },
          data: { deliveryOtp: dOtp }
        });
      }

      return newAssignment;
    }, { timeout: 30000, maxWait: 10000 });

    try {
      const storeRecord = await prisma.store.findUnique({ where: { id: storeId }, select: { name: true } });
      const { FcmService } = require('../../notification/application/fcm.service');
      FcmService.notifyRiderDeliveryAssigned(rider.userId, orderId, {
        storeName: storeRecord?.name || 'Partner Store',
        earning: effectiveFee
      }).catch((err: any) => console.warn('[FCM] Rider assignment push error:', err));

      const { getIO } = require('../../../api/socket');
      const io = getIO();
      if (io) {
        io.to(`rider_${rider.userId}`).emit('delivery_assigned', {
          assignmentId: assignment.id,
          orderId,
          deliveryFee: effectiveFee,
          assignedByStore: true
        });
        io.to(`order_${orderId}`).emit('order_status_updated', {
          orderId,
          assignmentStatus: DeliveryAssignmentStatus.ASSIGNED,
          deliveryPartner: {
            id: rider.id,
            name: rider.user.name,
            phone: rider.user.phone,
            vehicleType: rider.vehicleType,
            vehicleNumber: rider.vehicleNumber
          }
        });
      }
    } catch (e) {
      console.warn('[Socket]: Assignment notification skipped', e);
    }

    return {
      assigned: true,
      assignment,
      rider: {
        id: rider.id,
        name: rider.user.name,
        phone: rider.user.phone,
        vehicleType: rider.vehicleType,
        vehicleNumber: rider.vehicleNumber,
        deliveryFee: effectiveFee,
        shippingProfit: Math.round((economics.customerPaidShippingFee - effectiveFee) * 100) / 100
      }
    };
  }
}
