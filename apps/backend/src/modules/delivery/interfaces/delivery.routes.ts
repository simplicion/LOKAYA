import { Router, Request, Response, NextFunction } from 'express';
import { DeliveryService } from '../application/delivery.service';
import { ParcelAssignmentService } from '../application/parcel-assignment.service';
import { requireAuth } from '../../../shared/middleware/auth';
import { validateRequest } from '../../../shared/middleware/validate';
import {
  registerDeliveryPartnerSchema,
  updateDeliveryLocationSchema,
  toggleDeliveryOnlineSchema,
  sendStorePartnerRequestSchema,
  respondStorePartnerRequestSchema,
  dispatchOrderFulfillmentSchema,
  verifyDeliveryOtpSchema,
  updateAssignmentStatusSchema
} from '../domain/schemas';

const router: Router = Router();

router.use(requireAuth);

// --- Delivery Partner Endpoints ---

router.post('/register', validateRequest(registerDeliveryPartnerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partner = await DeliveryService.onboardDeliveryPartner((req as any).user.id, req.body);
    res.status(201).json(partner);
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await DeliveryService.getMyDeliveryProfile((req as any).user.id);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
});

router.post('/toggle-online', validateRequest(toggleDeliveryOnlineSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await DeliveryService.toggleOnline((req as any).user.id, req.body.isOnline);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

router.put('/pricing', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await DeliveryService.updatePartnerPricing((req as any).user.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/pricing/benchmarks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = req.query.lat ? Number(req.query.lat) : undefined;
    const lng = req.query.lng ? Number(req.query.lng) : undefined;
    const result = await DeliveryService.getPricingBenchmarks((req as any).user?.id, lat, lng);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/orders/:orderId/economics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ParcelAssignmentService.getOrderDeliveryEconomics(req.params.orderId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/location', validateRequest(updateDeliveryLocationSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await DeliveryService.updateLocation(
      (req as any).user.id,
      req.body.latitude,
      req.body.longitude,
      req.body.locationArea
    );
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

router.get('/tasks/incoming', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await DeliveryService.getIncomingTasks((req as any).user.id);
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
});

router.get('/active-task', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await DeliveryService.getActiveTask((req as any).user.id);
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
});

router.post('/tasks/:assignmentId/accept', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await DeliveryService.acceptAssignment(req.params.assignmentId, (req as any).user.id);
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
});

router.post('/tasks/:assignmentId/status', validateRequest(updateAssignmentStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await DeliveryService.updateTaskStatus(
      req.params.assignmentId,
      (req as any).user.id,
      req.body.status
    );
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
});

router.post('/orders/:orderId/verify-store-pickup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await DeliveryService.verifyStorePickup(
      req.params.orderId,
      (req as any).user.id,
      req.body.otp
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/orders/:orderId/verify-otp', validateRequest(verifyDeliveryOtpSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await DeliveryService.verifyDeliveryOtp(
      req.params.orderId,
      (req as any).user.id,
      req.body.otp
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await DeliveryService.getDeliveryHistory((req as any).user.id);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
});

router.get('/tasks/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await DeliveryService.getDeliveryHistory((req as any).user.id);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
});

router.get('/partner-stores', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stores = await DeliveryService.getNearbyStoresForPartner((req as any).user.id);
    res.status(200).json(stores);
  } catch (error) {
    next(error);
  }
});

router.post('/partner-stores/request', validateRequest(sendStorePartnerRequestSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await DeliveryService.sendStorePartnerRequest(
      (req as any).user.id,
      req.body.storeId,
      req.body.notes
    );
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
});

// --- Seller Workspace Endpoints for Delivery Management ---

router.get('/store/:storeId/partner-requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await DeliveryService.getStorePartnerRequests(req.params.storeId, (req as any).user.id);
    res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
});

router.post('/store/partner-requests/respond', validateRequest(respondStorePartnerRequestSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await DeliveryService.respondToStorePartnerRequest(
      (req as any).user.id,
      req.body.requestId,
      req.body.status
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/store/:storeId/connected-partners', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partners = await DeliveryService.getStoreConnectedPartners(req.params.storeId);
    res.status(200).json(partners);
  } catch (error) {
    next(error);
  }
});

router.delete('/store/:storeId/partners/:deliveryPartnerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await DeliveryService.disconnectStorePartner(
      (req as any).user.id,
      req.params.storeId,
      req.params.deliveryPartnerId
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/store/:storeId/find-partners', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, location, vehicleType, maxRate, onlyOnline } = req.query;
    const partners = await DeliveryService.findDeliveryPartnersForStore(
      (req as any).user.id,
      req.params.storeId,
      {
        search: typeof search === 'string' ? search : undefined,
        location: typeof location === 'string' ? location : undefined,
        vehicleType: typeof vehicleType === 'string' ? vehicleType : undefined,
        maxRate: maxRate ? Number(maxRate) : undefined,
        onlyOnline: onlyOnline === 'true'
      }
    );
    res.status(200).json(partners);
  } catch (error) {
    next(error);
  }
});

router.post('/store/:storeId/invite-partner', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deliveryPartnerId, notes } = req.body;
    if (!deliveryPartnerId) {
      return res.status(400).json({ error: 'deliveryPartnerId is required' });
    }
    const result = await DeliveryService.sellerInviteDeliveryPartner(
      (req as any).user.id,
      req.params.storeId,
      deliveryPartnerId,
      notes
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/store/orders/:orderId/dispatch-fulfillment', validateRequest(dispatchOrderFulfillmentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const { fulfillmentType, deliveryPartnerId } = req.body;
    const { prisma, OrderStatus } = require('@workspace/db');

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (fulfillmentType === 'LOKAYA_AUTO') {
      const result = await ParcelAssignmentService.autoAssignOrder(orderId, order.storeId);
      return res.status(200).json(result);
    } else if (fulfillmentType === 'LOKAYA_PARTNER') {
      if (!deliveryPartnerId) {
        return res.status(400).json({ message: 'Please select a partnered delivery rider' });
      }
      const result = await ParcelAssignmentService.assignToPartnerRider(orderId, order.storeId, deliveryPartnerId);
      return res.status(200).json(result);
    } else {
      // SELF_DELIVERY
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          fulfillmentType: 'SELF_DELIVERY',
          status: OrderStatus.OUT_FOR_DELIVERY,
          outForDeliveryAt: new Date()
        }
      });
      return res.status(200).json({ assigned: true, fulfillmentType: 'SELF_DELIVERY', order: updated });
    }
  } catch (error) {
    next(error);
  }
});

// --- Bulk Cluster Batch Dispatch Routes ---

router.get('/store/:storeId/ready-orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { BatchDispatchService } = require('../application/batch-dispatch.service');
    const result = await BatchDispatchService.getStoreReadyOrdersForDispatch(req.params.storeId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/store/:storeId/batches/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { BatchDispatchService } = require('../application/batch-dispatch.service');
    const result = await BatchDispatchService.calculateBatchEconomics(req.params.storeId, req.body.orderIds);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/store/:storeId/batches/dispatch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { BatchDispatchService } = require('../application/batch-dispatch.service');
    const result = await BatchDispatchService.createBatchDispatch(
      req.params.storeId,
      req.body.orderIds,
      req.body.fulfillmentType,
      req.body.deliveryPartnerId
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/active-batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { BatchDispatchService } = require('../application/batch-dispatch.service');
    const result = await BatchDispatchService.getActiveBatchForPartner((req as any).user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/batches/:batchId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { BatchDispatchService } = require('../application/batch-dispatch.service');
    const result = await BatchDispatchService.updateBatchStatus(
      req.params.batchId,
      req.body.status,
      (req as any).user.id
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/batches/:batchId/verify-drop', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { BatchDispatchService } = require('../application/batch-dispatch.service');
    const result = await BatchDispatchService.verifyBatchDropOtp(
      req.params.batchId,
      req.body.orderId,
      req.body.otp,
      (req as any).user.id
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/pricing/multi-store-blended', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { FuelRateService } = require('../application/fuel-rate.service');
    const countryCode = req.body.countryCode || 'IN';
    const benchmark = await FuelRateService.getFuelBenchmark(countryCode);
    const result = FuelRateService.calculateMultiStoreBlendedFee(req.body.storeDistances || [], benchmark);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/fuel-rates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { FuelRateService } = require('../application/fuel-rate.service');
    const search = req.query.search as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 200;
    const result = await FuelRateService.getAllCountryRates(search, page, limit);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/fuel-rates/:countryCode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { FuelRateService } = require('../application/fuel-rate.service');
    const countryCode = req.params.countryCode;
    const rate = await FuelRateService.getCountryFuelRate(countryCode);
    const benchmark = await FuelRateService.getFuelBenchmark(countryCode);
    res.status(200).json({ rate, benchmark });
  } catch (error) {
    next(error);
  }
});

export const deliveryRouter = router;


