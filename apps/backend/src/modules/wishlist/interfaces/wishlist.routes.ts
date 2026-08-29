import { Router } from 'express';
import { WishlistController } from './wishlist.controller';
import { requireAuth } from '../../../shared/middleware/auth';

const router = Router();
const controller = new WishlistController();

router.use(requireAuth);
router.post('/toggle', controller.toggleWishlist);
router.get('/', controller.getWishlist);

export { router as wishlistRoutes };
