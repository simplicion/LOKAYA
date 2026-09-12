import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ContentService } from '../application/content.service';
import { StoryService } from '../application/story.service';
import { HighlightService } from '../application/highlight.service';
import { StoryRetentionService } from '../../../worker/cron/story-retention.cron';
import { validateRequest } from '../../../shared/middleware/validate';
import { requireAuth } from '../../../shared/middleware/auth';
import { 
  getPresignedUrlSchema, 
  createPostSchema, 
  createReelSchema,
  createStorySchema
} from '../domain/schemas';

const router: Router = Router();

// Helper to extract userId if authenticated (without blocking unauthenticated guests)
const getOptionalUserId = (req: Request): string | undefined => {
  try {
    let token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : req.cookies?.access_token;
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      return payload.id || payload.userId;
    }
  } catch {}
  return undefined;
};

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
// Stories
// ==========================================

// Create story (sellers only)
router.post('/stories', requireAuth, validateRequest(createStorySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const story = await StoryService.createStory((req as any).user.id, req.body);
    res.status(201).json(story);
  } catch (error) {
    next(error);
  }
});

// Get active stories feed grouped by store (for Home tray)
router.get('/stories/feed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const viewerId = getOptionalUserId(req);
    const feed = await StoryService.getStoriesFeed(viewerId);
    res.status(200).json(feed);
  } catch (error) {
    next(error);
  }
});

// Get active stories for a specific store
router.get('/stories/store/:storeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const viewerId = getOptionalUserId(req);
    const stories = await StoryService.getStoreStories(req.params.storeId, viewerId);
    res.status(200).json(stories);
  } catch (error) {
    next(error);
  }
});

// Record a view on a story
router.post('/stories/:storyId/view', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const viewerId = getOptionalUserId(req);
    if (!viewerId) {
      return res.status(200).json({ success: true, viewsCount: 0 });
    }
    const result = await StoryService.viewStory(req.params.storyId, viewerId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Toggle like on a story
router.post('/stories/:storyId/like', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await StoryService.toggleLikeStory(req.params.storyId, (req as any).user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Get seller's story archive (30-day window)
router.get('/stories/archive', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const archive = await StoryService.getStoreArchive((req as any).user.id);
    res.status(200).json(archive);
  } catch (error) {
    next(error);
  }
});

// Delete a story
router.delete('/stories/:storyId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await StoryService.deleteStory((req as any).user.id, req.params.storyId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Manually trigger 30-day retention purge (Admin / Test)
router.post('/stories/cron/purge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await StoryRetentionService.purgeExpiredStories();
    res.status(200).json({ message: 'Retention purge executed', result });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Highlights
// ==========================================

// Create a new highlight from archived/active stories
router.post('/highlights', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const highlight = await HighlightService.createHighlight((req as any).user.id, req.body);
    res.status(201).json(highlight);
  } catch (error) {
    next(error);
  }
});

// Get highlights for a store
router.get('/highlights/store/:storeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const highlights = await HighlightService.getStoreHighlights(req.params.storeId);
    res.status(200).json(highlights);
  } catch (error) {
    next(error);
  }
});

// Get specific highlight and its stories
router.get('/highlights/:highlightId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const highlight = await HighlightService.getHighlightDetails(req.params.highlightId);
    res.status(200).json(highlight);
  } catch (error) {
    next(error);
  }
});

// Delete a highlight
router.delete('/highlights/:highlightId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await HighlightService.deleteHighlight((req as any).user.id, req.params.highlightId);
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
    const viewerId = getOptionalUserId(req);
    const posts = await ContentService.getPosts(page, limit, viewerId);
    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
});

router.get('/posts/store/:storeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const posts = await ContentService.getStorePosts(req.params.storeId);
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
    const viewerId = getOptionalUserId(req);
    const reels = await ContentService.getReels(page, limit, viewerId);
    res.status(200).json(reels);
  } catch (error) {
    next(error);
  }
});

router.get('/reels/store/:storeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reels = await ContentService.getStoreReels(req.params.storeId);
    res.status(200).json(reels);
  } catch (error) {
    next(error);
  }
});

export const contentRoutes = router;
