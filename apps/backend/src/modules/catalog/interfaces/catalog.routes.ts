import { Router, Request, Response, NextFunction } from 'express';
import { CatalogService } from '../application/catalog.service';
import { validateRequest } from '../../../shared/middleware/validate';
import { requireAuth } from '../../../shared/middleware/auth';
import { 
  createProductSchema, 
  updateProductSchema, 
  createCategorySchema, 
  updateCategorySchema 
} from '../domain/schemas';

const router: Router = Router();

// ==========================================
// Category Routes
// ==========================================

// Create Category
router.post('/store/:storeId/categories', requireAuth, validateRequest(createCategorySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId || req.body?.storeId;
    if (!storeId) {
      return res.status(400).json({ message: 'Store ID is required' });
    }
    const data = { 
      ...req.body, 
      storeId,
      imageUrl: req.body.imageUrl || null 
    };
    const category = await CatalogService.createCategory(data);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

// Get Categories for a Store
router.get('/store/:storeId/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await CatalogService.getCategoriesByStore(req.params.storeId);
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
});

// Update Category
router.put('/categories/:categoryId', requireAuth, validateRequest(updateCategorySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoryId = req.params.categoryId || req.params.id;
    const data = {
      ...req.body,
      imageUrl: req.body.imageUrl !== undefined ? (req.body.imageUrl || null) : undefined
    };
    const category = await CatalogService.updateCategory(categoryId, data);
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
});

// Delete Category
router.delete('/categories/:categoryId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await CatalogService.deleteCategory(req.params.categoryId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Product Routes
// ==========================================

// Create Product
router.post('/store/:storeId/products', requireAuth, validateRequest(createProductSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = { ...req.body, storeId: req.params.storeId };
    const product = await CatalogService.createProduct(data);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

// Get Public Products (Explore / Marketplace)
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search, sort, limit } = req.query;
    const products = await CatalogService.getAllProducts({
      category: category as string,
      search: search as string,
      sort: sort as string,
      limit: limit ? parseInt(limit as string) : 50
    });
    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=120, stale-while-revalidate=300');
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
});

// Get Products for a Store
router.get('/store/:storeId/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isOwner = req.query.isOwner === 'true';
    const products = await CatalogService.getProductsByStore(req.params.storeId, isOwner);
    if (!isOwner) {
      res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=120, stale-while-revalidate=300');
    }
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
});

// Update Product
router.put('/products/:productId', requireAuth, validateRequest(updateProductSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await CatalogService.updateProduct(req.params.productId, req.body);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
});

// Batch Get Products by IDs (e.g. for Recently Viewed)
router.post('/products/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const products = await CatalogService.getProductsByIds(ids);
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
});

router.get('/products/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawIds = req.query.ids;
    const ids = typeof rawIds === 'string' ? rawIds.split(',') : (Array.isArray(rawIds) ? rawIds as string[] : []);
    const products = await CatalogService.getProductsByIds(ids);
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
});

// Get Single Product by ID
router.get('/products/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await CatalogService.getProductById(req.params.productId);
    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=120, stale-while-revalidate=300');
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
});

// Delete Product
router.delete('/products/:productId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await CatalogService.deleteProduct(req.params.productId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Resolve Product via QR
router.get('/qr/:qrUuid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await CatalogService.getProductByQr(req.params.qrUuid);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Customer Product Reviews
// ==========================================

// Create or update a review
router.post('/reviews', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const review = await CatalogService.createProductReview(userId, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

// Get user's own reviews
router.get('/reviews/my', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const reviews = await CatalogService.getUserReviews(userId);
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
});

// Delete user's own review
router.delete('/reviews/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const result = await CatalogService.deleteUserReview(userId, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export const catalogRoutes = router;

