import { prisma } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';
import { processMediaJob } from '../../media/application/media-worker.service';
import { ContentService } from './content.service';

export class StoryService {
  /**
   * Upload / create a new story.
   * Only accessible to store owners / sellers.
   */
  static async createStory(authorId: string, data: {
    storeId?: string;
    mediaUrl: string;
    fileKey?: string;
    mediaType?: 'IMAGE' | 'VIDEO';
    caption?: string;
    productId?: string;
  }) {
    if (!data.mediaUrl) {
      throw new AppError('Media URL is required', 400);
    }

    // Resolve seller's store
    let storeId = data.storeId;
    if (!storeId) {
      const storeUser = await prisma.storeUser.findFirst({
        where: { userId: authorId },
        include: { store: true }
      });
      if (!storeUser || !storeUser.store) {
        throw new AppError('Only registered sellers with an active store can upload stories.', 403);
      }
      storeId = storeUser.storeId;
    } else {
      const storeUser = await prisma.storeUser.findFirst({
        where: { userId: authorId, storeId }
      });
      if (!storeUser) {
        throw new AppError('Unauthorized: You do not own this store.', 403);
      }
    }

    const now = new Date();
    // Stories expire from public feed after 24 hours
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    // Stories are archived and then permanently purged after 30 days
    const purgeAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const isVideo = data.mediaType === 'VIDEO';

    const story = await prisma.story.create({
      data: {
        storeId,
        authorId,
        mediaUrl: data.mediaUrl,
        fileKey: data.fileKey || null,
        mediaType: data.mediaType || 'IMAGE',
        caption: data.caption || null,
        productId: data.productId || null,
        expiresAt,
        purgeAt,
      },
      include: {
        store: {
          select: { id: true, name: true, logoUrl: true, status: true }
        },
        product: {
          select: { id: true, name: true, imageUrl: true, sellingPrice: true, mrp: true }
        }
      }
    });

    // Trigger zero-latency video transcoding pipeline for story videos
    if (isVideo) {
      const fileKey = data.fileKey || ContentService.extractFileKeyFromUrl(data.mediaUrl);
      if (fileKey) {
        prisma.mediaAsset.create({
          data: {
            url: data.mediaUrl,
            originalUrl: data.mediaUrl,
            type: 'VIDEO',
            status: 'PROCESSING'
          }
        }).then((asset) => {
          processMediaJob({
            mediaId: asset.id,
            fileKey,
            type: 'VIDEO',
            rawUrl: data.mediaUrl
          }).then(async () => {
            const readyAsset = await prisma.mediaAsset.findUnique({ where: { id: asset.id } });
            if (readyAsset?.url) {
              await prisma.story.update({
                where: { id: story.id },
                data: { mediaUrl: readyAsset.url }
              }).catch(() => {});
            }
          }).catch(err => console.warn('[StoryService] Video story processing background error:', err));
        }).catch(err => console.warn('[StoryService] MediaAsset create error:', err));
      }
    }

    return story;
  }

  /**
   * Get active stories grouped by store for the Home feed tray.
   */
  static async getStoriesFeed(viewerId?: string) {
    const now = new Date();

    const activeStories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
        isArchived: false,
        isPurged: false,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        store: {
          select: { id: true, name: true, logoUrl: true, status: true }
        },
        author: {
          select: { id: true, name: true, avatarUrl: true }
        },
        product: {
          select: { id: true, name: true, imageUrl: true, sellingPrice: true, mrp: true }
        },
        views: {
          select: { viewerId: true }
        },
        likes: {
          select: { userId: true }
        },
        _count: {
          select: { views: true, likes: true }
        }
      }
    });

    // Group stories by store
    const storeMap = new Map<string, {
      storeId: string;
      storeName: string;
      storeAvatar: string;
      isVerified: boolean;
      hasUnseen: boolean;
      latestStoryAt: Date;
      stories: any[];
    }>();

    for (const story of activeStories) {
      if (!storeMap.has(story.storeId)) {
        storeMap.set(story.storeId, {
          storeId: story.store.id,
          storeName: story.store.name,
          storeAvatar: story.store.logoUrl || '',
          isVerified: story.store.status === 'VERIFIED',
          hasUnseen: false,
          latestStoryAt: story.createdAt,
          stories: []
        });
      }

      const storeGroup = storeMap.get(story.storeId)!;
      const isViewed = viewerId ? story.views.some(v => v.viewerId === viewerId) : false;
      const isLiked = viewerId ? story.likes.some(l => l.userId === viewerId) : false;

      if (!isViewed) {
        storeGroup.hasUnseen = true;
      }

      storeGroup.stories.push({
        id: story.id,
        storeId: story.storeId,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        caption: story.caption,
        product: story.product ? {
          id: story.product.id,
          name: story.product.name,
          image: story.product.imageUrl || '',
          price: `₹${story.product.sellingPrice}`,
          originalPrice: story.product.mrp && story.product.mrp > story.product.sellingPrice ? `₹${story.product.mrp}` : undefined,
          discount: story.product.mrp && story.product.mrp > story.product.sellingPrice
            ? `${Math.round(((story.product.mrp - story.product.sellingPrice) / story.product.mrp) * 100)}% OFF`
            : undefined,
        } : null,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        viewsCount: story._count.views,
        likesCount: story._count.likes,
        isLikedByMe: isLiked,
        isViewedByMe: isViewed,
      });
    }

    const result = Array.from(storeMap.values());
    // Sort: stores with unseen stories first, then by most recent story
    result.sort((a, b) => {
      if (a.hasUnseen && !b.hasUnseen) return -1;
      if (!a.hasUnseen && b.hasUnseen) return 1;
      return new Date(b.latestStoryAt).getTime() - new Date(a.latestStoryAt).getTime();
    });

    return result;
  }

  /**
   * Get active stories for a specific store.
   */
  static async getStoreStories(storeId: string, viewerId?: string) {
    const now = new Date();

    const stories = await prisma.story.findMany({
      where: {
        storeId,
        expiresAt: { gt: now },
        isArchived: false,
        isPurged: false,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        store: {
          select: { id: true, name: true, logoUrl: true, status: true }
        },
        product: {
          select: { id: true, name: true, imageUrl: true, sellingPrice: true, mrp: true }
        },
        views: {
          select: { viewerId: true }
        },
        likes: {
          select: { userId: true }
        },
        _count: {
          select: { views: true, likes: true }
        }
      }
    });

    return stories.map(s => ({
      id: s.id,
      storeId: s.storeId,
      storeName: s.store.name,
      storeAvatar: s.store.logoUrl || '',
      isVerified: s.store.status === 'VERIFIED',
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      caption: s.caption,
      product: s.product ? {
        id: s.product.id,
        name: s.product.name,
        image: s.product.imageUrl || '',
        price: `₹${s.product.sellingPrice}`,
        originalPrice: s.product.mrp && s.product.mrp > s.product.sellingPrice ? `₹${s.product.mrp}` : undefined,
      } : null,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      viewsCount: s._count.views,
      likesCount: s._count.likes,
      isLikedByMe: viewerId ? s.likes.some(l => l.userId === viewerId) : false,
    }));
  }

  /**
   * Record a unique story view.
   */
  static async viewStory(storyId: string, viewerId: string) {
    if (!storyId || !viewerId) {
      return { success: false, viewsCount: 0 };
    }

    try {
      // 1. Verify story exists
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        select: { id: true }
      });

      if (!story) {
        return { success: false, message: 'Story not found or expired', viewsCount: 0 };
      }

      // 2. Verify viewer user exists
      const viewer = await prisma.user.findUnique({
        where: { id: viewerId },
        select: { id: true }
      });

      if (!viewer) {
        return { success: false, message: 'Viewer not found', viewsCount: 0 };
      }

      // 3. Upsert unique view
      await prisma.storyView.upsert({
        where: {
          storyId_viewerId: { storyId, viewerId }
        },
        create: {
          storyId,
          viewerId,
        },
        update: {}
      });

      const count = await prisma.storyView.count({
        where: { storyId }
      });

      return { success: true, viewsCount: count };
    } catch (err) {
      console.warn('viewStory caught error:', err);
      return { success: false, viewsCount: 0 };
    }
  }

  /**
   * Toggle like on a story.
   */
  static async toggleLikeStory(storyId: string, userId: string) {
    if (!storyId || !userId) {
      return { liked: false, likesCount: 0 };
    }

    try {
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        select: { id: true }
      });

      if (!story) {
        return { liked: false, likesCount: 0 };
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });

      if (!user) {
        return { liked: false, likesCount: 0 };
      }

      const existing = await prisma.storyLike.findUnique({
        where: {
          storyId_userId: { storyId, userId }
        }
      });

      let liked = false;
      if (existing) {
        await prisma.storyLike.delete({
          where: { id: existing.id }
        });
        liked = false;
      } else {
        await prisma.storyLike.create({
          data: { storyId, userId }
        });
        liked = true;
      }

      const likesCount = await prisma.storyLike.count({
        where: { storyId }
      });

      return { liked, likesCount };
    } catch (err) {
      console.warn('toggleLikeStory caught error:', err);
      return { liked: false, likesCount: 0 };
    }
  }

  /**
   * Get story archive for seller.
   * Stories within 30 days retention window.
   */
  static async getStoreArchive(userId: string) {
    const storeUser = await prisma.storeUser.findFirst({
      where: { userId },
      include: { store: true }
    });

    if (!storeUser || !storeUser.store) {
      throw new AppError('Seller store not found.', 404);
    }

    const stories = await prisma.story.findMany({
      where: {
        storeId: storeUser.storeId,
        isPurged: false,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true, imageUrl: true, sellingPrice: true }
        },
        _count: {
          select: { views: true, likes: true }
        }
      }
    });

    const now = Date.now();
    return stories.map(s => {
      const remainingMs = new Date(s.purgeAt).getTime() - now;
      const daysRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
      const isExpired = new Date(s.expiresAt).getTime() <= now;

      return {
        id: s.id,
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType,
        caption: s.caption,
        productId: s.productId,
        product: s.product,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        purgeAt: s.purgeAt,
        daysRemaining,
        isExpired,
        viewsCount: s._count.views,
        likesCount: s._count.likes,
      };
    });
  }

  /**
   * Delete a story manually.
   */
  static async deleteStory(userId: string, storyId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: { store: { include: { users: true } } }
    });

    if (!story) {
      throw new AppError('Story not found', 404);
    }

    const isOwner = story.authorId === userId || story.store.users.some(u => u.userId === userId);
    if (!isOwner) {
      throw new AppError('Unauthorized to delete this story', 403);
    }

    await prisma.story.delete({
      where: { id: storyId }
    });

    return { success: true };
  }
}
