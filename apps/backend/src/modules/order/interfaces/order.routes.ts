import { Router, Request, Response, NextFunction } from 'express';
import { OrderService } from '../application/order.service';
import { validateRequest } from '../../../shared/middleware/validate';
import { requireAuth } from '../../../shared/middleware/auth';
import { createOrderSchema, createManualOrderSchema, updateOrderStatusSchema } from '../domain/schemas';
import { handleShiprocketWebhook } from './shiprocket.webhook';

const router: Router = Router();

// Shiprocket live courier tracking webhook (unauthenticated callback)
router.post('/webhook/shiprocket', handleShiprocketWebhook);

router.use(requireAuth); // Remaining order routes require auth

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await OrderService.getUserOrders((req as any).user.id);
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
});

router.post('/manual', validateRequest(createManualOrderSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await OrderService.createManualOrder(
      (req as any).user.id,
      req.body
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/', validateRequest(createOrderSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await OrderService.createOrder(
      (req as any).user.id,
      req.body.storeId,
      req.body.items,
      {
        deliveryAddress: req.body.deliveryAddress,
        paymentMethod: req.body.paymentMethod,
        shippingFee: req.body.shippingFee
      }
    );
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

router.get('/store/:storeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await OrderService.getStoreOrders(
      req.params.storeId,
      (req as any).user.id,
      req.query as any
    );
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
});

router.get('/:orderId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await OrderService.getOrder(req.params.orderId, (req as any).user.id);
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
});

router.get('/:orderId/invoice', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await OrderService.getOrderInvoice(req.params.orderId, (req as any).user.id);
    res.status(200).json(invoice);
  } catch (error) {
    next(error);
  }
});

router.get('/:orderId/track', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tracking = await OrderService.getOrderTracking(req.params.orderId);
    res.status(200).json(tracking);
  } catch (error) {
    next(error);
  }
});

router.post('/:orderId/dispatch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await OrderService.dispatchShipment(req.params.orderId, (req as any).user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/:orderId/status', validateRequest(updateOrderStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await OrderService.updateOrderStatus(
      req.params.orderId,
      (req as any).user.id,
      req.body.status
    );
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
});

router.post('/:orderId/verify-pickup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { PickupVerificationService } = require('../application/pickup-verification.service');
    const result = await PickupVerificationService.verifyAndFulfillPickup(
      req.params.orderId,
      (req as any).user.id,
      req.body.otp,
      req.body.qrToken
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export const orderRoutes = router;

