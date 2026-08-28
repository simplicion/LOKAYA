import { Router, Request, Response, NextFunction } from 'express';
import { InventoryService } from '../application/inventory.service';
import { validateRequest } from '../../../shared/middleware/validate';
import { requireAuth } from '../../../shared/middleware/auth';
import { adjustInventorySchema } from '../domain/schemas';

const router: Router = Router();

// Adjust Inventory
router.post('/adjust', requireAuth, validateRequest(adjustInventorySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Verify if req.user is an owner/manager of the store that owns this product
    const result = await InventoryService.adjustStock(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export const inventoryRoutes = router;
