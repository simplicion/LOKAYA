import { 
  prisma, 
  DeliveryPartnerStatus, 
  PartnerRequestStatus, 
  DeliveryAssignmentStatus, 
  OrderStatus, 
  TransactionType, 
  NotificationType,
  FulfillmentType 
} from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';
import { ParcelAssignmentService } from './parcel-assignment.service';
import { FuelRateService } from './fuel-rate.service';
import { PlatformConfigService } from '../../common/platform-config.service';

export class DeliveryService {
  /**
   * Onboards a user as a Lokaya Delivery Partner with 4 KYC documents and live location.
   */
  static async onboardDeliveryPartner(userId: string, data: any) {
    // Role Exclusivity Check: Single Operational Role Rule
    const existingStoreUser = await prisma.storeUser.findFirst({
      where: { userId }
    });
    if (existingStoreUser) {
      throw new AppError(
        'You are already registered as a Store Merchant/Seller. Under Lokaya single-role policy, please use a separate account to register as a Delivery Partner.',
        400
      );
    }

    // Mandatory Rider Personal & Location Details
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      throw new AppError('Full legal name is mandatory', 400);
    }
    const parsedAge = Number(data.age);
    if (!data.age || isNaN(parsedAge) || parsedAge < 18 || parsedAge > 100) {
      throw new AppError('Age is mandatory and must be at least 18 years old', 400);
    }
    if (!data.gender || typeof data.gender !== 'string' || !data.gender.trim()) {
      throw new AppError('Gender is mandatory', 400);
    }
    const cleanPhone = (data.phone || '').toString().trim();
    const phoneDigits = cleanPhone.replace(/\D/g, '');
    if (!cleanPhone || phoneDigits.length < 8) {
      throw new AppError('A valid mobile phone number is mandatory', 400);
    }
    if (!data.locationArea || typeof data.locationArea !== 'string' || !data.locationArea.trim()) {
      throw new AppError('Operating base location area is mandatory', 400);
    }

    const existing = await prisma.deliveryPartner.findUnique({
      where: { userId }
    });

    const operatingCountry = (data.countryCode || FuelRateService.detectCountry(data.latitude, data.longitude)).toUpperCase();
    const benchmark = await FuelRateService.getFuelBenchmark(operatingCountry);
    const vehicleType = data.vehicleType || 'MOTORCYCLE';
    const minFloor = FuelRateService.calculateMinimumRateFloor(vehicleType, benchmark);

    const perKmRate = data.perKmRate !== undefined ? Math.max(minFloor, Number(data.perKmRate)) : Math.max(minFloor, benchmark.standardPerKmRate / 2);
    const baseFare = data.baseFare !== undefined ? Math.max(20, Number(data.baseFare)) : benchmark.minDeliveryFloor;

    const vehicleNumber = data.vehicleNumber?.trim() || (vehicleType === 'WALKER' ? 'WALKER' : vehicleType === 'BICYCLE' ? 'BICYCLE' : 'NOT_REQUIRED');
    const vehiclePhotoUrl = data.vehiclePhotoUrl || data.selfieUrl || '';
    const vehicleDocumentUrl = data.vehicleDocumentUrl || 'NOT_REQUIRED';
    const normalizedGender = typeof data.gender === 'string' ? data.gender.toUpperCase() : 'MALE';

    const detectedCity = data.city || null;
    const detectedState = data.state || null;
    const detectedCountry = data.country || null;
    const detectedCurrency = data.currency || benchmark.currency || null;
    const detectedCurrencySymbol = data.currencySymbol || benchmark.currencySymbol || null;

    const locationSummary = detectedCountry
      ? `${detectedCountry} (${operatingCountry}) · Currency: ${detectedCurrency || ''} (${detectedCurrencySymbol || ''})`
      : null;

    const resolvedLocationArea = data.locationArea || [detectedCity, detectedState, detectedCountry].filter(Boolean).join(', ') || locationSummary || null;

    // Dynamic Onboarding Policy: Fast-track auto-approval vs strict KYC verification
    const config = await PlatformConfigService.getOnboardingConfig();
    const shouldAutoApprove = !config.requireRiderDocs || config.autoApproveRider;
    const initialStatus = shouldAutoApprove ? DeliveryPartnerStatus.APPROVED : DeliveryPartnerStatus.PENDING;

    if (existing) {
      if (existing.status === DeliveryPartnerStatus.REJECTED) {
        // Allow re-submission
        return await prisma.deliveryPartner.update({
          where: { userId },
          data: {
            status: initialStatus,
            vehicleType,
            vehicleNumber,
            vehiclePhotoUrl,
            vehicleDocumentUrl,
            selfieUrl: data.selfieUrl,
            identityDocumentType: data.identityDocumentType || 'GOVERNMENT_ID',
            identityDocumentUrl: data.identityDocumentUrl,
            currentLatitude: data.latitude,
            currentLongitude: data.longitude,
            locationArea: resolvedLocationArea,
            perKmRate,
            baseFare,
            operatingCountry,
            rejectionReason: null
          },
          include: { user: true }
        });
      }
      return existing;
    }

    // Update user profile info
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        age: data.age,
        gender: normalizedGender,
        phone: data.phone,
        latitude: data.latitude,
        longitude: data.longitude,
        city: detectedCity || undefined,
        state: detectedState || undefined,
        locationArea: resolvedLocationArea || undefined
      }
    });

    // Create delivery partner profile
    const partner = await prisma.deliveryPartner.create({
      data: {
        userId,
        status: initialStatus,
        vehicleType,
        vehicleNumber,
        vehiclePhotoUrl,
        vehicleDocumentUrl,
        selfieUrl: data.selfieUrl,
        identityDocumentType: data.identityDocumentType || 'GOVERNMENT_ID',
        identityDocumentUrl: data.identityDocumentUrl,
        currentLatitude: data.latitude,
        currentLongitude: data.longitude,
        locationArea: resolvedLocationArea,
        perKmRate,
        baseFare,
        operatingCountry,
        isOnline: false,
        isBusy: false
      },
      include: { user: true }
    });

    return partner;
  }

  /**
   * Gets the delivery partner profile for the logged in user along with metrics.
   */
  static async getMyDeliveryProfile(userId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, name: true, phone: true, email: true, avatarUrl: true }
        },
        partnerStores: {
          include: {
            store: {
              select: { id: true, name: true, logoUrl: true, address: true, city: true }
            }
          }
        },
        _count: {
          select: { assignments: true, partnerStores: true }
        }
      }
    });

    if (!partner) {
      return null;
    }

    // Compute today's stats
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayAssignments = await prisma.deliveryAssignment.findMany({
      where: {
        deliveryPartnerId: partner.id,
        status: DeliveryAssignmentStatus.DELIVERED,
        deliveredAt: { gte: startOfToday }
      }
    });

    const todayEarnings = todayAssignments.reduce((sum, a) => sum + (a.deliveryFee || 0), 0);
    const todayTrips = todayAssignments.length;

    return {
      ...partner,
      stats: {
        todayEarnings,
        todayTrips,
        totalDeliveries: partner.totalDeliveries,
        totalEarnings: partner.totalEarnings,
        rating: partner.rating,
        partnerStoresCount: partner.partnerStores.filter(p => p.status === PartnerRequestStatus.ACCEPTED).length
      }
    };
  }

  /**
   * Toggles the online availability of the delivery partner.
   */
  static async toggleOnline(userId: string, isOnline: boolean) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId }
    });

    if (!partner) {
      throw new AppError('Delivery partner account not found', 404);
    }

    if (isOnline && partner.status !== DeliveryPartnerStatus.APPROVED) {
      throw new AppError('Your account is pending verification. You can go online once approved by admin.', 403);
    }

    const updated = await prisma.deliveryPartner.update({
      where: { userId },
      data: { isOnline }
    });

    return updated;
  }

  /**
   * Updates the real-time geographic position of the delivery partner.
   */
  static async updateLocation(userId: string, latitude: number, longitude: number, locationArea?: string) {
    const partner = await prisma.deliveryPartner.update({
      where: { userId },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        locationArea: locationArea || undefined,
        lastLocationUpdate: new Date()
      }
    });

    return partner;
  }

  /**
   * Gets all incoming/queued delivery tasks (status ASSIGNED) for the delivery partner.
   * Works whether the partner is currently online or offline.
   */
  static async getIncomingTasks(userId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId }
    });

    if (!partner) {
      return [];
    }

    const assignments = await prisma.deliveryAssignment.findMany({
      where: {
        deliveryPartnerId: partner.id,
        status: DeliveryAssignmentStatus.ASSIGNED
      },
      include: {
        order: {
          include: {
            store: true,
            buyer: {
              select: { id: true, name: true, phone: true, avatarUrl: true, latitude: true, longitude: true, locationArea: true }
            },
            items: true,
            pickupOtp: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const order = assignment.order;
        if (!order) return assignment;

        const storeLat = order.store?.latitude || 28.6139;
        const storeLng = order.store?.longitude || 77.2090;
        const buyerLat = order.buyer?.latitude || (storeLat + 0.045);
        const buyerLng = order.buyer?.longitude || (storeLng + 0.045);

        const distanceKm = ParcelAssignmentService.calculateDistanceKm(
          { latitude: storeLat, longitude: storeLng },
          { latitude: buyerLat, longitude: buyerLng }
        );
        const twoWayDistanceKm = Math.round(distanceKm * 2 * 10) / 10;
        const countryCode = FuelRateService.detectCountry(storeLat, storeLng);
        const benchmark = await FuelRateService.getFuelBenchmark(countryCode);

        const fuelCostPerKm = Math.round((benchmark.fuelPricePerLiter / benchmark.standardBikeMileage) * 100) / 100;
        const estimatedFuelCost = Math.round(twoWayDistanceKm * fuelCostPerKm * 10) / 10;
        const payout = assignment.deliveryFee || 50;
        const estimatedLaborPayout = Math.max(0, Math.round((payout - estimatedFuelCost) * 10) / 10);
        const laborPercentage = payout > 0 ? Math.round((estimatedLaborPayout / payout) * 100) : 0;

        return {
          ...assignment,
          economics: {
            distanceKm,
            twoWayDistanceKm,
            fuelPricePerLiter: benchmark.fuelPricePerLiter,
            standardBikeMileage: benchmark.standardBikeMileage,
            fuelCostPerKm,
            estimatedFuelCost,
            estimatedLaborPayout,
            laborPercentage,
            currency: benchmark.currency,
            currencySymbol: benchmark.currencySymbol
          }
        };
      })
    );

    return enriched;
  }

  /**
   * Gets the current active delivery task for the delivery partner.
   */
  static async getActiveTask(userId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId }
    });

    if (!partner) {
      return null;
    }

    const assignment = await prisma.deliveryAssignment.findFirst({
      where: {
        deliveryPartnerId: partner.id,
        status: {
          in: [
            DeliveryAssignmentStatus.ASSIGNED,
            DeliveryAssignmentStatus.ACCEPTED,
            DeliveryAssignmentStatus.ARRIVED_AT_STORE,
            DeliveryAssignmentStatus.PICKED_UP,
            DeliveryAssignmentStatus.OUT_FOR_DELIVERY,
            DeliveryAssignmentStatus.ARRIVED_AT_CUSTOMER
          ]
        }
      },
      include: {
        order: {
          include: {
            store: true,
            buyer: {
              select: { id: true, name: true, phone: true, avatarUrl: true, latitude: true, longitude: true, locationArea: true }
            },
            items: true,
            pickupOtp: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!assignment || !assignment.order) {
      return assignment;
    }

    const order = assignment.order;
    const storeLat = order.store?.latitude || 28.6139;
    const storeLng = order.store?.longitude || 77.2090;
    const buyerLat = order.buyer?.latitude || (storeLat + 0.045);
    const buyerLng = order.buyer?.longitude || (storeLng + 0.045);

    const distanceKm = ParcelAssignmentService.calculateDistanceKm(
      { latitude: storeLat, longitude: storeLng },
      { latitude: buyerLat, longitude: buyerLng }
    );
    const twoWayDistanceKm = Math.round(distanceKm * 2 * 10) / 10;
    const countryCode = FuelRateService.detectCountry(storeLat, storeLng);
    const benchmark = await FuelRateService.getFuelBenchmark(countryCode);

    const fuelCostPerKm = Math.round((benchmark.fuelPricePerLiter / benchmark.standardBikeMileage) * 100) / 100;
    const estimatedFuelCost = Math.round(twoWayDistanceKm * fuelCostPerKm * 10) / 10;
    const payout = assignment.deliveryFee || 50;
    const estimatedLaborPayout = Math.max(0, Math.round((payout - estimatedFuelCost) * 10) / 10);
    const laborPercentage = payout > 0 ? Math.round((estimatedLaborPayout / payout) * 100) : 0;

    return {
      ...assignment,
      economics: {
        distanceKm,
        twoWayDistanceKm,
        fuelPricePerLiter: benchmark.fuelPricePerLiter,
        standardBikeMileage: benchmark.standardBikeMileage,
        fuelCostPerKm,
        estimatedFuelCost,
        estimatedLaborPayout,
        laborPercentage,
        currency: benchmark.currency,
        currencySymbol: benchmark.currencySymbol
      }
    };
  }

  /**
   * Verifies the 4-digit Store Pickup OTP presented by the rider to the merchant.
   * Handshake #1: Merchant verifies pickup code, transitions order to SHIPPED / OUT_FOR_DELIVERY.
   */
  static async verifyStorePickup(orderId: string, sellerUserId: string, otp: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        pickupOtp: true,
        deliveryPartner: {
          include: { user: true }
        },
        items: true,
        buyer: true
      }
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Verify seller authorization
    const isStoreStaff = await prisma.storeUser.findFirst({
      where: { storeId: order.storeId, userId: sellerUserId }
    });
    if (!isStoreStaff) {
      throw new AppError('Unauthorized: You do not manage this store', 403);
    }

    // Validate OTP against order.pickupOtp or universal test fallback '1234'
    const expectedOtp = order.pickupOtp?.otpCode || '1234';
    const isValid = 
      (otp && otp.trim() === expectedOtp.trim()) ||
      (process.env.NODE_ENV !== 'production' && otp?.trim() === '1234');

    if (!isValid) {
      throw new AppError('Invalid Store Pickup OTP. Please ask the delivery rider for their 4-digit pickup code.', 400);
    }

    const now = new Date();

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Mark pickup OTP as used
      if (order.pickupOtp) {
        await tx.orderPickupOtp.update({
          where: { orderId },
          data: { isUsed: true }
        });
      }

      // 2. Update Order status to SHIPPED / OUT_FOR_DELIVERY (fast direct update)
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.SHIPPED,
          pickedUpAt: now,
          outForDeliveryAt: now
        }
      });

      // 3. Keep SubOrder status in sync
      await tx.subOrder.updateMany({
        where: { orderId, storeId: order.storeId },
        data: { status: OrderStatus.SHIPPED }
      });

      // 4. Update DeliveryAssignment status to OUT_FOR_DELIVERY
      if (order.deliveryPartnerId) {
        await tx.deliveryAssignment.updateMany({
          where: {
            orderId,
            deliveryPartnerId: order.deliveryPartnerId,
            status: { notIn: [DeliveryAssignmentStatus.DELIVERED, DeliveryAssignmentStatus.CANCELLED] }
          },
          data: {
            status: DeliveryAssignmentStatus.OUT_FOR_DELIVERY,
            pickedUpAt: now,
            outForDeliveryAt: now
          }
        });
      }

      return {
        ...order,
        ...updated,
        status: OrderStatus.SHIPPED,
        pickedUpAt: now,
        outForDeliveryAt: now
      };
    }, {
      timeout: 30000,
      maxWait: 10000
    });

    // Broadcast WebSocket updates to Buyer, Seller, and Rider
    try {
      const { getIO } = require('../../../api/socket');
      const io = getIO();
      if (io) {
        io.to(`order_${orderId}`).emit('order_status_updated', {
          orderId,
          status: OrderStatus.SHIPPED,
          assignmentStatus: DeliveryAssignmentStatus.OUT_FOR_DELIVERY,
          pickedUpAt: now
        });
        io.to(`store_${order.storeId}`).emit('seller_order_dispatched', updatedOrder);
        if (order.deliveryPartner?.userId) {
          io.to(`rider_${order.deliveryPartner.userId}`).emit('pickup_verified_by_merchant', {
            orderId,
            status: DeliveryAssignmentStatus.OUT_FOR_DELIVERY
          });
        }
      }
    } catch (e) {
      console.warn('[Socket]: Store pickup broadcast skipped', e);
    }

    return {
      success: true,
      message: 'Store pickup verified successfully! Parcel handed over to delivery partner.',
      order: updatedOrder
    };
  }

  /**
   * Accepts an assigned delivery task.
   */
  static async acceptAssignment(assignmentId: string, userId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId }
    });
    if (!partner) throw new AppError('Unauthorized delivery partner', 403);

    const assignment = await prisma.deliveryAssignment.findUnique({
      where: { id: assignmentId },
      include: { order: true }
    });

    if (!assignment || assignment.deliveryPartnerId !== partner.id) {
      throw new AppError('Assignment not found or not assigned to you', 404);
    }

    const [updated] = await prisma.$transaction([
      prisma.deliveryAssignment.update({
        where: { id: assignmentId },
        data: {
          status: DeliveryAssignmentStatus.ACCEPTED,
          acceptedAt: new Date()
        },
        include: {
          order: {
            include: { store: true, buyer: true, items: true, pickupOtp: true }
          }
        }
      }),
      prisma.deliveryPartner.update({
        where: { id: partner.id },
        data: { isBusy: true }
      })
    ]);

    // Broadcast real-time update to customer tracking
    try {
      const { getIO } = require('../../../api/socket');
      const io = getIO();
      if (io) {
        io.to(`order_${assignment.orderId}`).emit('order_status_updated', {
          orderId: assignment.orderId,
          assignmentStatus: DeliveryAssignmentStatus.ACCEPTED,
          deliveryPartner: {
            id: partner.id,
            name: partner.vehicleNumber,
            vehicleType: partner.vehicleType
          }
        });
      }
    } catch (e) {
      console.warn('[Socket]: Accept assignment broadcast skipped', e);
    }

    return updated;
  }

  /**
   * Updates status of an active task (Arrived at store, Picked up, Out for delivery, Arrived at customer, Rejected).
   */
  static async updateTaskStatus(assignmentId: string, userId: string, newStatus: DeliveryAssignmentStatus) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId }
    });
    if (!partner) throw new AppError('Unauthorized delivery partner', 403);

    const assignment = await prisma.deliveryAssignment.findUnique({
      where: { id: assignmentId },
      include: { order: true }
    });

    if (!assignment || assignment.deliveryPartnerId !== partner.id) {
      throw new AppError('Assignment not found', 404);
    }

    if (newStatus === DeliveryAssignmentStatus.REJECTED) {
      // Rider rejected task: free the rider and re-assign order
      await prisma.$transaction([
        prisma.deliveryAssignment.update({
          where: { id: assignmentId },
          data: { status: DeliveryAssignmentStatus.REJECTED }
        }),
        prisma.deliveryPartner.update({
          where: { id: partner.id },
          data: { isBusy: false }
        }),
        prisma.order.update({
          where: { id: assignment.orderId },
          data: { deliveryPartnerId: null }
        })
      ]);

      // Re-trigger auto assignment for the order in background
      ParcelAssignmentService.autoAssignOrder(assignment.orderId, assignment.order.storeId).catch(console.error);

      return { success: true, message: 'Assignment declined' };
    }

    const updateData: any = { status: newStatus };
    const orderUpdateData: any = {};

    if (newStatus === DeliveryAssignmentStatus.ARRIVED_AT_STORE) {
      updateData.arrivedStoreAt = new Date();
    } else if (newStatus === DeliveryAssignmentStatus.PICKED_UP) {
      updateData.pickedUpAt = new Date();
      orderUpdateData.status = OrderStatus.SHIPPED;
      orderUpdateData.pickedUpAt = new Date();
    } else if (newStatus === DeliveryAssignmentStatus.OUT_FOR_DELIVERY) {
      updateData.outForDeliveryAt = new Date();
      orderUpdateData.status = OrderStatus.OUT_FOR_DELIVERY;
      orderUpdateData.outForDeliveryAt = new Date();
    } else if (newStatus === DeliveryAssignmentStatus.ARRIVED_AT_CUSTOMER) {
      updateData.arrivedCustomerAt = new Date();
    }

    const [updatedAssignment] = await prisma.$transaction([
      prisma.deliveryAssignment.update({
        where: { id: assignmentId },
        data: updateData,
        include: {
          order: {
            include: { store: true, buyer: true, items: true }
          }
        }
      }),
      ...(Object.keys(orderUpdateData).length > 0
        ? [
            prisma.order.update({
              where: { id: assignment.orderId },
              data: orderUpdateData
            })
          ]
        : [])
    ]);

    // Broadcast socket update
    try {
      const { getIO } = require('../../../api/socket');
      const io = getIO();
      if (io) {
        io.to(`order_${assignment.orderId}`).emit('order_status_updated', {
          orderId: assignment.orderId,
          status: orderUpdateData.status || assignment.order.status,
          assignmentStatus: newStatus
        });
      }
    } catch (e) {
      console.warn('[Socket]: Status update skipped', e);
    }

    return updatedAssignment;
  }

  /**
   * Verifies the customer's 4-digit Delivery OTP and marks the order as DELIVERED.
   */
  static async verifyDeliveryOtp(orderId: string, riderUserId: string, otp: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: riderUserId }
    });
    if (!partner) throw new AppError('Unauthorized delivery partner', 403);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        buyer: true,
        items: true,
        pickupOtp: true
      }
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status === OrderStatus.DELIVERED) {
      return { success: true, message: 'Order is already marked as Delivered', order };
    }

    // Verify OTP code matches order's deliveryOtp or pickupOtp or dev fallback '1234'
    const expectedOtp = order.deliveryOtp || order.pickupOtp?.otpCode;
    const isOtpValid = 
      (expectedOtp && otp.trim() === expectedOtp.trim()) ||
      (process.env.NODE_ENV !== 'production' && otp.trim() === '1234');

    if (!isOtpValid) {
      throw new AppError('Invalid Delivery OTP. Please ask the customer for their 4-digit delivery code.', 400);
    }

    const assignment = await prisma.deliveryAssignment.findFirst({
      where: {
        orderId,
        deliveryPartnerId: partner.id
      }
    });

    const deliveryFee = assignment?.deliveryFee || 50; // Dynamic delivery earnings per trip

    // Complete fulfillment atomically
    const fulfilledResult = await prisma.$transaction(async (tx) => {
      // 1. Update Order Status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt: new Date()
        },
        include: { store: true, buyer: true, items: true }
      });

      // 2. Update Delivery Assignment
      await tx.deliveryAssignment.updateMany({
        where: {
          orderId,
          deliveryPartnerId: partner.id
        },
        data: {
          status: DeliveryAssignmentStatus.DELIVERED,
          deliveredAt: new Date()
        }
      });

      // 3. Update Rider Stats
      await tx.deliveryPartner.update({
        where: { id: partner.id },
        data: {
          isBusy: false,
          totalDeliveries: { increment: 1 },
          totalEarnings: { increment: deliveryFee }
        }
      });

      // 4. Create Seller Transaction Credit
      await tx.sellerTransaction.create({
        data: {
          storeId: order.storeId,
          orderId,
          title: `Order #${orderId.slice(0, 8)} Delivered via Lokaya Rider`,
          amount: order.totalAmount,
          type: TransactionType.CREDIT,
          description: `Delivered by partner rider ${partner.vehicleType} (${partner.vehicleNumber}) verified with OTP`
        }
      });

      // 5. Send notification to store
      await tx.sellerNotification.create({
        data: {
          storeId: order.storeId,
          type: NotificationType.ORDER,
          title: `Order #${orderId.slice(0, 8)} Delivered`,
          message: `Package successfully delivered to ${order.buyer?.name || 'Customer'}.`,
          linkUrl: `/seller/orders/details?id=${orderId}`
        }
      });

      return updatedOrder;
    }, {
      timeout: 30000,
      maxWait: 10000
    });

    // Broadcast socket event
    try {
      const { getIO } = require('../../../api/socket');
      const io = getIO();
      if (io) {
        io.to(`order_${orderId}`).emit('order_status_updated', fulfilledResult);
        io.to(`store_${order.storeId}`).emit('seller_order_fulfilled', fulfilledResult);
        io.to(`rider_${riderUserId}`).emit('delivery_completed', { orderId, earnings: deliveryFee });
      }
    } catch (e) {
      console.warn('[Socket]: Completion broadcast skipped', e);
    }

    return {
      success: true,
      message: 'Delivery verified successfully! Payout credited to your earnings.',
      order: fulfilledResult
    };
  }

  /**
   * Rider sends a partnership request to a store.
   */
  static async sendStorePartnerRequest(riderUserId: string, storeId: string, notes?: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: riderUserId }
    });
    if (!partner) throw new AppError('Delivery partner profile not found', 404);

    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });
    if (!store) throw new AppError('Store not found', 404);

    const partnerRequest = await prisma.storeDeliveryPartner.upsert({
      where: {
        storeId_deliveryPartnerId: {
          storeId,
          deliveryPartnerId: partner.id
        }
      },
      create: {
        storeId,
        deliveryPartnerId: partner.id,
        status: PartnerRequestStatus.PENDING,
        initiatedBy: 'RIDER',
        notes
      },
      update: {
        status: PartnerRequestStatus.PENDING,
        initiatedBy: 'RIDER',
        notes
      },
      include: {
        store: {
          select: { id: true, name: true, logoUrl: true, address: true }
        }
      }
    });

    // Notify seller
    try {
      await prisma.sellerNotification.create({
        data: {
          storeId,
          type: NotificationType.SYSTEM,
          title: 'New Delivery Partner Request',
          message: `Rider ${partner.vehicleType} (${partner.vehicleNumber}) wants to partner with your store.`,
          linkUrl: '/seller/delivery-partners'
        }
      });
    } catch (e) {}

    return partnerRequest;
  }

  /**
   * For delivery partner: Retrieves their active partner stores and incoming/outgoing requests.
   */
  static async getRiderPartnerStores(riderUserId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: riderUserId }
    });
    if (!partner) throw new AppError('Delivery partner profile not found', 404);

    const partnerships = await prisma.storeDeliveryPartner.findMany({
      where: { deliveryPartnerId: partner.id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            bannerUrl: true,
            address: true,
            city: true,
            category: true,
            contactPhone: true,
            openingTime: true,
            closingTime: true,
            latitude: true,
            longitude: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const connectedStores = partnerships
      .filter(p => p.status === PartnerRequestStatus.ACCEPTED)
      .map(p => ({
        requestId: p.id,
        store: p.store,
        status: p.status,
        notes: p.notes,
        initiatedBy: p.initiatedBy,
        connectedAt: p.updatedAt
      }));

    // Requests sent by store runners to this rider
    const incomingRequests = partnerships
      .filter(p => p.status === PartnerRequestStatus.PENDING && p.initiatedBy === 'STORE')
      .map(p => ({
        requestId: p.id,
        store: p.store,
        status: p.status,
        notes: p.notes,
        initiatedBy: p.initiatedBy,
        requestedAt: p.createdAt
      }));

    // Requests sent by this rider to stores
    const outgoingRequests = partnerships
      .filter(p => p.status === PartnerRequestStatus.PENDING && p.initiatedBy === 'RIDER')
      .map(p => ({
        requestId: p.id,
        store: p.store,
        status: p.status,
        notes: p.notes,
        initiatedBy: p.initiatedBy,
        requestedAt: p.createdAt
      }));

    return {
      connectedStores,
      incomingRequests,
      outgoingRequests
    };
  }

  /**
   * For delivery partner: Responds to a store partnership request (ACCEPTED or REJECTED).
   */
  static async respondToStorePartnerRequestAsRider(
    riderUserId: string,
    requestId: string,
    status: 'ACCEPTED' | 'REJECTED'
  ) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: riderUserId },
      include: { user: true }
    });
    if (!partner) throw new AppError('Delivery partner profile not found', 404);

    const request = await prisma.storeDeliveryPartner.findUnique({
      where: { id: requestId },
      include: { store: true }
    });
    if (!request || request.deliveryPartnerId !== partner.id) {
      throw new AppError('Partner request not found or unauthorized', 404);
    }

    const updated = await prisma.storeDeliveryPartner.update({
      where: { id: requestId },
      data: {
        status: status === 'ACCEPTED' ? PartnerRequestStatus.ACCEPTED : PartnerRequestStatus.REJECTED
      },
      include: { store: true }
    });

    // Notify store seller
    try {
      await prisma.sellerNotification.create({
        data: {
          storeId: request.storeId,
          type: NotificationType.SYSTEM,
          title: status === 'ACCEPTED' ? 'Partner Request Accepted!' : 'Partner Request Declined',
          message: `${partner.user.name} (${partner.vehicleType}) has ${status === 'ACCEPTED' ? 'accepted your store partnership request' : 'declined the partnership request'}.`,
          linkUrl: '/seller/delivery-partners'
        }
      });
    } catch (e) {}

    return updated;
  }

  /**
   * For delivery partner: Disconnects from a partner store.
   */
  static async disconnectStoreAsRider(riderUserId: string, storeId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: riderUserId }
    });
    if (!partner) throw new AppError('Delivery partner profile not found', 404);

    await prisma.storeDeliveryPartner.deleteMany({
      where: {
        deliveryPartnerId: partner.id,
        storeId
      }
    });

    return { success: true, message: 'Store disconnected from your partners' };
  }

  /**
   * For seller: Lists pending and connected partner requests for their store.
   */
  static async getStorePartnerRequests(storeId: string, sellerUserId: string) {
    const isStaff = await prisma.storeUser.findFirst({
      where: { storeId, userId: sellerUserId }
    });
    if (!isStaff) throw new AppError('Unauthorized: You do not manage this store', 403);

    const requests = await prisma.storeDeliveryPartner.findMany({
      where: { storeId },
      include: {
        deliveryPartner: {
          include: {
            user: {
              select: { id: true, name: true, phone: true, avatarUrl: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return requests;
  }

  /**
   * For seller: Responds to a partner request (ACCEPTED or REJECTED).
   */
  static async respondToStorePartnerRequest(sellerUserId: string, requestId: string, status: 'ACCEPTED' | 'REJECTED') {
    const request = await prisma.storeDeliveryPartner.findUnique({
      where: { id: requestId },
      include: { store: true, deliveryPartner: true }
    });
    if (!request) throw new AppError('Partner request not found', 404);

    const isStaff = await prisma.storeUser.findFirst({
      where: { storeId: request.storeId, userId: sellerUserId }
    });
    if (!isStaff) throw new AppError('Unauthorized: You do not manage this store', 403);

    const updated = await prisma.storeDeliveryPartner.update({
      where: { id: requestId },
      data: {
        status: status === 'ACCEPTED' ? PartnerRequestStatus.ACCEPTED : PartnerRequestStatus.REJECTED
      },
      include: {
        deliveryPartner: {
          include: { user: true }
        }
      }
    });

    return updated;
  }

  /**
   * For seller: Lists all accepted delivery partners for store dispatch selector.
   */
  static async getStoreConnectedPartners(storeId: string) {
    const partners = await prisma.storeDeliveryPartner.findMany({
      where: {
        storeId,
        status: PartnerRequestStatus.ACCEPTED
      },
      include: {
        deliveryPartner: {
          include: {
            user: {
              select: { id: true, name: true, phone: true, avatarUrl: true }
            }
          }
        }
      }
    });

    return partners.map(p => ({
      id: p.deliveryPartner.id,
      name: p.deliveryPartner.user.name,
      phone: p.deliveryPartner.user.phone,
      avatarUrl: p.deliveryPartner.user.avatarUrl,
      vehicleType: p.deliveryPartner.vehicleType,
      vehicleNumber: p.deliveryPartner.vehicleNumber,
      isOnline: p.deliveryPartner.isOnline,
      isBusy: p.deliveryPartner.isBusy,
      rating: p.deliveryPartner.rating,
      totalDeliveries: p.deliveryPartner.totalDeliveries
    }));
  }

  /**
   * For delivery partner: Explores nearby registered stores with partner status.
   */
  static async getNearbyStoresForPartner(riderUserId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: riderUserId },
      include: {
        partnerStores: true
      }
    });

    const stores = await prisma.store.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        bannerUrl: true,
        address: true,
        city: true,
        category: true,
        openingTime: true,
        closingTime: true,
        latitude: true,
        longitude: true
      },
      take: 50
    });

    const partnerStoreMap = new Map(
      (partner?.partnerStores || []).map(p => [p.storeId, p.status])
    );

    return stores.map(s => ({
      ...s,
      partnershipStatus: partnerStoreMap.get(s.id) || 'NOT_REQUESTED'
    }));
  }

  /**
   * For delivery partner: Retrieves complete historical trip logs and payouts.
   */
  static async getDeliveryHistory(userId: string) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId }
    });
    if (!partner) return [];

    const assignments = await prisma.deliveryAssignment.findMany({
      where: {
        deliveryPartnerId: partner.id,
        status: { in: [DeliveryAssignmentStatus.DELIVERED, DeliveryAssignmentStatus.REJECTED, DeliveryAssignmentStatus.CANCELLED] }
      },
      include: {
        order: {
          include: {
            store: { select: { id: true, name: true, logoUrl: true, address: true, city: true } },
            buyer: { select: { id: true, name: true, phone: true } },
            items: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return assignments.map(a => ({
      id: a.id,
      orderId: a.orderId,
      status: a.status,
      assignedAt: a.assignedAt,
      deliveredAt: a.deliveredAt,
      deliveryFee: a.deliveryFee,
      orderTotal: a.order?.totalAmount || 0,
      storeName: a.order?.store?.name || 'Merchant',
      storeAddress: a.order?.store?.address || '',
      buyerName: a.order?.buyer?.name || 'Customer',
      deliveryAddress: a.order?.deliveryAddress || '',
      itemsCount: a.order?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0
    }));
  }

  /**
   * For seller: Disconnects / removes an approved partner rider from the store roster.
   */
  static async disconnectStorePartner(sellerUserId: string, storeId: string, deliveryPartnerId: string) {
    const isStaff = await prisma.storeUser.findFirst({
      where: { storeId, userId: sellerUserId }
    });
    if (!isStaff) throw new AppError('Unauthorized: You do not manage this store', 403);

    const deleted = await prisma.storeDeliveryPartner.deleteMany({
      where: { storeId, deliveryPartnerId }
    });

    return { success: true, count: deleted.count };
  }

  /**
   * For seller: Discovers nearby delivery partners for a store.
   * Ranks partners in ascending order of distance from store location.
   * Supports comprehensive search (name, vehicle, phone) and location filter (e.g., 'Lalbandi').
   */
  static async findDeliveryPartnersForStore(
    sellerUserId: string,
    storeId: string,
    query?: {
      search?: string;
      location?: string;
      vehicleType?: string;
      maxRate?: number;
      onlyOnline?: boolean;
    }
  ) {
    const isStaff = await prisma.storeUser.findFirst({
      where: { storeId, userId: sellerUserId }
    });
    if (!isStaff) throw new AppError('Unauthorized: You do not manage this store', 403);

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true, address: true, city: true, state: true, latitude: true, longitude: true }
    });
    if (!store) throw new AppError('Store not found', 404);

    const storeLat = store.latitude;
    const storeLng = store.longitude;

    // Fetch existing store partnerships to map statuses (ACCEPTED, PENDING, NOT_REQUESTED)
    const existingPartnerships = await prisma.storeDeliveryPartner.findMany({
      where: { storeId },
      select: { id: true, deliveryPartnerId: true, status: true, notes: true }
    });
    const partnershipMap = new Map(existingPartnerships.map(p => [p.deliveryPartnerId, p]));

    // Query active/approved delivery partners
    const partners = await prisma.deliveryPartner.findMany({
      where: {
        status: DeliveryPartnerStatus.APPROVED,
        ...(query?.onlyOnline ? { isOnline: true } : {}),
        ...(query?.vehicleType ? { vehicleType: query.vehicleType as any } : {}),
        ...(query?.maxRate ? { perKmRate: { lte: Number(query.maxRate) } } : {})
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
            email: true,
            locationArea: true,
            city: true,
            state: true
          }
        }
      }
    });

    // Compute distance and build rich partner objects
    const results = partners.map((partner: any) => {
      const pLat = partner.currentLatitude;
      const pLng = partner.currentLongitude;

      let distanceKm: number | null = null;
      if (storeLat != null && storeLng != null && pLat != null && pLng != null) {
        distanceKm = ParcelAssignmentService.calculateDistanceKm(
          { latitude: storeLat, longitude: storeLng },
          { latitude: pLat, longitude: pLng }
        );
      }

      const existingRel = partnershipMap.get(partner.id);
      const partnershipStatus = existingRel ? existingRel.status : 'NOT_REQUESTED';
      const requestId = existingRel ? existingRel.id : null;

      // Extract unified location text for robust searching
      const locationText = [
        partner.locationArea,
        partner.user?.locationArea,
        partner.user?.city,
        partner.user?.state,
        partner.operatingCountry
      ]
        .filter(Boolean)
        .join(' ');

      return {
        id: partner.id,
        userId: partner.userId,
        name: partner.user?.name || 'Rider',
        phone: partner.user?.phone || null,
        avatarUrl: partner.user?.avatarUrl || null,
        selfieUrl: partner.selfieUrl,
        vehicleType: partner.vehicleType,
        vehicleNumber: partner.vehicleNumber,
        isOnline: partner.isOnline,
        isBusy: partner.isBusy,
        rating: partner.rating || 5.0,
        totalDeliveries: partner.totalDeliveries || 0,
        perKmRate: partner.perKmRate,
        baseFare: partner.baseFare,
        locationArea: partner.locationArea || [partner.user?.city, partner.user?.state].filter(Boolean).join(', ') || 'Service Zone',
        distanceKm,
        partnershipStatus,
        requestId,
        _locationSearchText: locationText.toLowerCase(),
        _generalSearchText: `${partner.user?.name || ''} ${partner.user?.phone || ''} ${partner.vehicleNumber || ''} ${partner.vehicleType} ${locationText}`.toLowerCase()
      };
    });

    // Apply location filtering (e.g. "Lalbandi")
    let filtered = results;
    if (query?.location && query.location.trim().length > 0) {
      const locQ = query.location.trim().toLowerCase();
      filtered = filtered.filter(p => p._locationSearchText.includes(locQ));
    }

    // Apply keyword search (name, vehicle, phone, location)
    if (query?.search && query.search.trim().length > 0) {
      const searchQ = query.search.trim().toLowerCase();
      filtered = filtered.filter(p => p._generalSearchText.includes(searchQ));
    }

    // Sort in ascending order of nearest distance to the seller's store!
    // Partners with known distance come first, sorted smallest to largest.
    filtered.sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) {
        return a.distanceKm - b.distanceKm;
      }
      if (a.distanceKm != null && b.distanceKm == null) return -1;
      if (a.distanceKm == null && b.distanceKm != null) return 1;
      // Secondary sort: online riders first
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return (b.rating || 5) - (a.rating || 5);
    });

    // Strip internal search fields before returning
    return filtered.map(({ _locationSearchText, _generalSearchText, ...rest }) => rest);
  }

  /**
   * For seller: Sends a partnership connection request to a delivery partner.
   */
  static async sellerInviteDeliveryPartner(
    sellerUserId: string,
    storeId: string,
    deliveryPartnerId: string,
    notes?: string
  ) {
    const isStaff = await prisma.storeUser.findFirst({
      where: { storeId, userId: sellerUserId }
    });
    if (!isStaff) throw new AppError('Unauthorized: You do not manage this store', 403);

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true, logoUrl: true, address: true, city: true }
    });
    if (!store) throw new AppError('Store not found', 404);

    const partner = await prisma.deliveryPartner.findUnique({
      where: { id: deliveryPartnerId },
      include: { user: true }
    });
    if (!partner) throw new AppError('Delivery partner not found', 404);

    const partnerRequest = await prisma.storeDeliveryPartner.upsert({
      where: {
        storeId_deliveryPartnerId: {
          storeId,
          deliveryPartnerId: partner.id
        }
      },
      create: {
        storeId,
        deliveryPartnerId: partner.id,
        status: PartnerRequestStatus.PENDING,
        initiatedBy: 'STORE',
        notes: notes || `Partnership invite from ${store.name}`
      },
      update: {
        status: PartnerRequestStatus.PENDING,
        initiatedBy: 'STORE',
        notes: notes || `Partnership invite from ${store.name}`
      },
      include: {
        deliveryPartner: {
          include: {
            user: {
              select: { id: true, name: true, phone: true, avatarUrl: true }
            }
          }
        },
        store: true
      }
    });

    // Notify delivery partner via user notification
    try {
      await prisma.notification.create({
        data: {
          userId: partner.userId,
          type: 'SYSTEM',
          title: 'Store Partner Added You!',
          body: `${store.name} added you as their delivery partner. You can now deliver store orders!`,
          deepLink: '/delivery'
        }
      });
    } catch (e) {}

    return partnerRequest;
  }

  /**
   * Updates custom perKmRate and baseFare for a delivery partner with floor checks.
   */
  static async updatePartnerPricing(userId: string, data: { perKmRate?: number; baseFare?: number; isCustomPricingEnabled?: boolean }) {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId }
    });
    if (!partner) {
      throw new AppError('Delivery partner profile not found', 404);
    }

    const countryCode = (partner as any).operatingCountry || 'IN';
    const benchmark = await FuelRateService.getFuelBenchmark(countryCode);
    const minFloor = FuelRateService.calculateMinimumRateFloor(partner.vehicleType, benchmark);

    const updateData: any = {};
    if (data.isCustomPricingEnabled !== undefined) {
      updateData.isCustomPricingEnabled = Boolean(data.isCustomPricingEnabled);
    }
    if (data.perKmRate !== undefined) {
      const requestedRate = Number(data.perKmRate);
      if (requestedRate < minFloor) {
        throw new AppError(
          `Your rate cannot be lower than the live fuel minimum floor of ${benchmark.currencySymbol}${minFloor}/km for your vehicle.`,
          400
        );
      }
      updateData.perKmRate = requestedRate;
    }
    if (data.baseFare !== undefined) {
      updateData.baseFare = Math.max(10, Number(data.baseFare));
    }

    const updated = await (prisma.deliveryPartner as any).update({
      where: { id: partner.id },
      data: updateData
    });

    return {
      success: true,
      partner: {
        id: updated.id,
        perKmRate: updated.perKmRate,
        baseFare: updated.baseFare,
        isCustomPricingEnabled: updated.isCustomPricingEnabled,
        minFloor,
        currencySymbol: benchmark.currencySymbol
      }
    };
  }

  /**
   * Retrieves live country fuel rates, mileage statistics, and dynamic price floors.
   */
  static async getPricingBenchmarks(userId?: string, latitude?: number, longitude?: number) {
    let countryCode = 'IN';
    if (latitude && longitude) {
      countryCode = FuelRateService.detectCountry(latitude, longitude);
    } else if (userId) {
      const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
      if (partner) {
        countryCode = (partner as any).operatingCountry || FuelRateService.detectCountry(partner.currentLatitude || undefined, partner.currentLongitude || undefined);
      }
    }

    const benchmark = await FuelRateService.getFuelBenchmark(countryCode);
    const baseFuelCost = FuelRateService.calculateBaseFuelCostPerKm('MOTORCYCLE', benchmark);
    const minFloor = FuelRateService.calculateMinimumRateFloor('MOTORCYCLE', benchmark);
    const suggestedRate = FuelRateService.calculateSuggestedRate('MOTORCYCLE', benchmark);

    return {
      benchmark,
      baseFuelCost,
      minFloor,
      suggestedRate,
      floors: {
        MOTORCYCLE: FuelRateService.calculateMinimumRateFloor('MOTORCYCLE', benchmark),
        SCOOTER: FuelRateService.calculateMinimumRateFloor('SCOOTER', benchmark),
        BICYCLE: FuelRateService.calculateMinimumRateFloor('BICYCLE', benchmark),
        WALKER: FuelRateService.calculateMinimumRateFloor('WALKER', benchmark)
      },
      suggestedRates: {
        MOTORCYCLE: FuelRateService.calculateSuggestedRate('MOTORCYCLE', benchmark),
        SCOOTER: FuelRateService.calculateSuggestedRate('SCOOTER', benchmark),
        BICYCLE: FuelRateService.calculateSuggestedRate('BICYCLE', benchmark),
        WALKER: FuelRateService.calculateSuggestedRate('WALKER', benchmark)
      },
      mileage: {
        MOTORCYCLE: benchmark.standardBikeMileage,
        SCOOTER: benchmark.standardScooterMileage,
        BICYCLE: '50 km/L (Standard Equivalent)',
        WALKER: '50 km/L (Standard Equivalent)'
      }
    };
  }
}


