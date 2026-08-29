import { Request, Response } from 'express';
import { WishlistService } from '../application/wishlist.service';
import { AppError } from '../../../shared/errors/AppError';
import { AuthRequest } from '../../../shared/middleware/auth';

export class WishlistController {
  private wishlistService: WishlistService;

  constructor() {
    this.wishlistService = new WishlistService();
  }

  toggleWishlist = async (req: AuthRequest, res: Response) => {
    try {
      const { productId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!productId) {
        return res.status(400).json({ success: false, message: 'Product ID is required' });
      }

      const result = await this.wishlistService.toggleWishlist(userId, productId);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Toggle wishlist error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  getWishlist = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const wishlist = await this.wishlistService.getWishlist(userId);
      res.json({ success: true, data: wishlist });
    } catch (error) {
      console.error('Get wishlist error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
}
