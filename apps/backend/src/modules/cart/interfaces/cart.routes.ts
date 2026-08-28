import { Router, Request, Response, NextFunction } from 'express';
import { CartService } from '../application/cart.service';
import { validateRequest } from '../../../shared/middleware/validate';
import { requireAuth } from '../../../shared/middleware/auth';
import { addToCartSchema, updateCartItemSchema } from '../domain/schemas';

const router: Router = Router();

router.use(requireAuth); // All cart routes require auth

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = await CartService.getCart((req as any).user.id);
    res.status(200).json(cart);
  } catch (error) {
    next(error);
  }
});

router.post('/items', validateRequest(addToCartSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const item = await CartService.addItemToCart((req as any).user.id, productId, variantId, quantity);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/items/:itemId', validateRequest(updateCartItemSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await CartService.updateItemQuantity((req as any).user.id, req.params.itemId, req.body.quantity);
    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
});

router.delete('/items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await CartService.removeItemFromCart((req as any).user.id, req.params.itemId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await CartService.clearCart((req as any).user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export const cartRoutes = router;
