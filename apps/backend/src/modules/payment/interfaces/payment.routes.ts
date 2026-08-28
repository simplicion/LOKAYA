import { Router, Request, Response, NextFunction } from 'express';
import { PaymentService } from '../application/payment.service';
import { validateRequest } from '../../../shared/middleware/validate';
import { requireAuth } from '../../../shared/middleware/auth';
import { createRazorpayOrderSchema, verifyPaymentSchema } from '../domain/schemas';

const router: Router = Router();

router.use(requireAuth); // All payment routes require auth

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
