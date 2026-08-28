import { Router, Request, Response, NextFunction } from 'express';
import { ContentService } from '../application/content.service';
import { validateRequest } from '../../../shared/middleware/validate';
import { requireAuth } from '../../../shared/middleware/auth';
import { 
  getPresignedUrlSchema, 
  createPostSchema, 
  createReelSchema 
} from '../domain/schemas';

const router: Router = Router();

// ==========================================
// Media Upload
// ==========================================

router.post('/upload/presigned-url', requireAuth, validateRequest(getPresignedUrlSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename, contentType } = req.body;
    const result = await ContentService.getPresignedUrl(filename, contentType);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Posts
// ==========================================

router.post('/posts', requireAuth, validateRequest(createPostSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await ContentService.createPost((req as any).user.id, req.body);
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

router.get('/posts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const posts = await ContentService.getPosts(page, limit);
    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Reels
// ==========================================

router.post('/reels', requireAuth, validateRequest(createReelSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reel = await ContentService.createReel((req as any).user.id, req.body);
    res.status(201).json(reel);
  } catch (error) {
    next(error);
  }
});

router.get('/reels', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const reels = await ContentService.getReels(page, limit);
    res.status(200).json(reels);
  } catch (error) {
    next(error);
  }
});

export const contentRoutes = router;
