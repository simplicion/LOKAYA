import { Router, Request, Response, NextFunction } from 'express';
import { SocialService } from '../application/social.service';
import { validateRequest } from '../../../shared/middleware/validate';
import { requireAuth } from '../../../shared/middleware/auth';
import { createCommentSchema } from '../domain/schemas';

const router: Router = Router();

// ==========================================
// Follows
// ==========================================

router.post('/follow/:userId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await SocialService.toggleFollow((req as any).user.id, req.params.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Likes
// ==========================================

router.post('/like/post/:postId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await SocialService.toggleLikePost((req as any).user.id, req.params.postId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/like/reel/:reelId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await SocialService.toggleLikeReel((req as any).user.id, req.params.reelId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Comments
// ==========================================

router.post('/comment/post/:postId', requireAuth, validateRequest(createCommentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await SocialService.addCommentToPost((req as any).user.id, req.params.postId, req.body.content);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/comment/post/:postId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comments = await SocialService.getPostComments(req.params.postId);
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
});

router.post('/comment/reel/:reelId', requireAuth, validateRequest(createCommentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await SocialService.addCommentToReel((req as any).user.id, req.params.reelId, req.body.content);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/comment/reel/:reelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comments = await SocialService.getReelComments(req.params.reelId);
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
});

export const socialRoutes = router;
