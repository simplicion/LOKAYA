import { Router, Request, Response, NextFunction } from 'express';
import { PaymentService } from '../application/payment.service';
import { RazorpayWebhookHandler } from './razorpay.webhook';
import { OneEightyWebhookHandler } from './one-eighty.webhook';
import { validateRequest } from '../../../shared/middleware/validate';
import { requireAuth } from '../../../shared/middleware/auth';
import { createRazorpayOrderSchema, verifyPaymentSchema } from '../domain/schemas';

const router: Router = Router();

/**
 * PUBLIC / UNAUTHENTICATED WEBHOOK ENDPOINTS
 */
router.post('/webhook', (req: Request, res: Response) => {
  return RazorpayWebhookHandler.handleWebhook(req, res);
});

router.post('/180/webhook', (req: Request, res: Response) => {
  return OneEightyWebhookHandler.handleWebhook(req, res);
});

router.use(requireAuth); // Subsequent payment routes require user auth

router.post('/180/create-session', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, amount, currency } = req.body;
    if (!orderId || !amount) {
      return res.status(400).json({ error: 'orderId and amount are required' });
    }
    const result = await PaymentService.create180PaymentSession(
      (req as any).user.id,
      orderId,
      amount,
      currency || 'NPR'
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/180/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, transactionId, orderId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    const result = await PaymentService.fulfill180Payment(sessionId, transactionId, orderId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/create-session', validateRequest(createRazorpayOrderSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, amount } = req.body;
    const result = await PaymentService.createPaymentSession(
      (req as any).user.id,
      orderId,
      amount
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/create-order', validateRequest(createRazorpayOrderSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, amount } = req.body;
    const result = await PaymentService.createPaymentSession(
      (req as any).user.id,
      orderId,
      amount
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/verify', validateRequest(verifyPaymentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, system_order_id } = req.body;
    const result = await PaymentService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      system_order_id,
      (req as any).user.id
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export const paymentRoutes = router;
