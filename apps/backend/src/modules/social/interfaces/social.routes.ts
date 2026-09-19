import { Router, Request, Response, NextFunction } from 'express';
import { SocialService } from '../application/social.service';
import { validateRequest } from '../../../shared/middleware/validate';
import { requireAuth, optionalAuth, AuthRequest } from '../../../shared/middleware/auth';
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

router.post('/store/:storeId/follow', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await SocialService.toggleFollowStore((req as any).user.id, req.params.storeId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/store/:storeId/follow-status', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const result = await SocialService.getStoreFollowStatus(userId, req.params.storeId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/followed-stores', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await SocialService.getFollowedStores((req as any).user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Sharing & Quick Send
// ==========================================

router.get('/share/recipients', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const recipients = await SocialService.getShareRecipients(userId);
    res.status(200).json(recipients);
  } catch (error) {
    next(error);
  }
});

router.post('/share/send', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const senderId = (req as any).user.id;
    const { recipientId, shareUrl, message } = req.body;
    if (!recipientId || !shareUrl) {
      return res.status(400).json({ error: 'recipientId and shareUrl are required' });
    }
    const result = await SocialService.sendDirectShare(senderId, recipientId, shareUrl, message);
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
// Saves / Bookmarks
// ==========================================

router.post('/save/post/:postId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await SocialService.toggleSavePost((req as any).user.id, req.params.postId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/save/reel/:reelId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await SocialService.toggleSaveReel((req as any).user.id, req.params.reelId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// ==========================================

router.get('/like/post/:postId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const likes = await SocialService.getPostLikes(req.params.postId);
    res.status(200).json(likes);
  } catch (error) {
    next(error);
  }
});

router.get('/like/reel/:reelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const likes = await SocialService.getReelLikes(req.params.reelId);
    res.status(200).json(likes);
  } catch (error) {
    next(error);
  }
});

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


// ==========================================
// Reporting
// ==========================================

router.post('/report', requireAuth, validateRequest(require('../domain/schemas').reportSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetId, targetType, reason } = req.body;
    const result = await SocialService.reportContent((req as any).user.id, targetId, targetType, reason);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// User Profile (Public)
// ==========================================

router.get('/user/:userId', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?.id;
    const profile = await SocialService.getUserProfile(req.params.userId, currentUserId);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
});

export const socialRoutes = router;
