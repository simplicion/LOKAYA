import { Router } from 'express';
import { validateRequest } from '../../../shared/middleware/validate';
import { requireAuth, AuthRequest } from '../../../shared/middleware/auth';
import { SellerService } from '../application/seller.service';
import { onboardSellerSchema, updateStoreProfileSchema } from '../domain/schemas';

export const sellerRouter: Router = Router();
const sellerService = new SellerService();

sellerRouter.post('/onboard', requireAuth, validateRequest(onboardSellerSchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const store = await sellerService.onboardStore(userId, req.body);
    res.status(201).json({ store });
  } catch (error) {
    next(error);
  }
});

sellerRouter.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const store = await sellerService.getMyStore(userId);
    res.status(200).json(store);
  } catch (error) {
    next(error);
  }
});

sellerRouter.patch('/:storeId', requireAuth, validateRequest(updateStoreProfileSchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { storeId } = req.params;
    const store = await sellerService.updateStoreProfile(userId, storeId, req.body);
    res.status(200).json({ message: 'Store updated', store });
  } catch (error) {
    next(error);
  }
});
