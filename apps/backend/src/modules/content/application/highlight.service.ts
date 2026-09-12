import { prisma } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';

export class HighlightService {
  /**
   * Create a new Highlight on the seller's profile.
   */
  static async createHighlight(userId: string, data: {
    storeId?: string;
    title: string;
    coverUrl?: string;
    storyIds: string[];
  }) {
    if (!data.title || !data.title.trim()) {
      throw new AppError('Highlight title is required', 400);
    }
    if (!data.storyIds || data.storyIds.length === 0) {
      throw new AppError('At least one story must be selected for the highlight', 400);
    }

    // Resolve store
    let storeId = data.storeId;
    if (!storeId) {
      const storeUser = await prisma.storeUser.findFirst({
        where: { userId },
        include: { store: true }
      });
      if (!storeUser || !storeUser.store) {
        throw new AppError('Seller store not found. Only sellers can create highlights.', 403);
      }
      storeId = storeUser.storeId;
    } else {
      const storeUser = await prisma.storeUser.findFirst({
        where: { userId, storeId }
      });
      if (!storeUser) {
        throw new AppError('Unauthorized: You do not own this store.', 403);
      }
    }

    // If coverUrl is not provided, pick the first story's mediaUrl
    let coverUrl = data.coverUrl;
    if (!coverUrl) {
      const firstStory = await prisma.story.findUnique({
        where: { id: data.storyIds[0] }
      });
      coverUrl = firstStory?.mediaUrl || '';
    }

    return await prisma.$transaction(async (tx) => {
      const highlight = await tx.highlight.create({
        data: {
          storeId: storeId!,
          title: data.title.trim(),
          coverUrl,
        }
      });

      // Create items
      await tx.highlightItem.createMany({
        data: data.storyIds.map((storyId, idx) => ({
          highlightId: highlight.id,
          storyId,
          displayOrder: idx
        }))
      });

      return await tx.highlight.findUnique({
        where: { id: highlight.id },
        include: {
          items: {
            include: {
              story: {
                include: {
                  product: {
                    select: { id: true, name: true, imageUrl: true, sellingPrice: true }
                  }
                }
              }
            },
            orderBy: { displayOrder: 'asc' }
          }
        }
      });
    });
  }

  /**
   * Get all highlights for a store.
   */
  static async getStoreHighlights(storeId: string) {
    const highlights = await prisma.highlight.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            story: {
              include: {
                product: {
                  select: { id: true, name: true, imageUrl: true, sellingPrice: true }
                }
              }
            }
          },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    return highlights.map(h => ({
      id: h.id,
      storeId: h.storeId,
      title: h.title,
      coverUrl: h.coverUrl || (h.items[0]?.story?.mediaUrl || ''),
      storyCount: h.items.length,
      stories: h.items.map(item => ({
        id: item.story.id,
        mediaUrl: item.story.mediaUrl,
        mediaType: item.story.mediaType,
        caption: item.story.caption,
        product: item.story.product,
        createdAt: item.story.createdAt,
      }))
    }));
  }

  /**
   * Get single highlight with all stories for the viewer.
   */
  static async getHighlightDetails(highlightId: string) {
    const highlight = await prisma.highlight.findUnique({
      where: { id: highlightId },
      include: {
        store: {
          select: { id: true, name: true, logoUrl: true, status: true }
        },
        items: {
          include: {
            story: {
              include: {
                product: {
                  select: { id: true, name: true, imageUrl: true, sellingPrice: true, mrp: true }
                },
                _count: {
                  select: { views: true, likes: true }
                }
              }
            }
          },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!highlight) {
      throw new AppError('Highlight not found', 404);
    }

    return {
      id: highlight.id,
      storeId: highlight.storeId,
      storeName: highlight.store.name,
      storeAvatar: highlight.store.logoUrl || '',
      isVerified: highlight.store.status === 'VERIFIED',
      title: highlight.title,
      coverUrl: highlight.coverUrl,
      stories: highlight.items.map(item => ({
        id: item.story.id,
        storeId: highlight.storeId,
        storeName: highlight.store.name,
        storeAvatar: highlight.store.logoUrl || '',
        mediaUrl: item.story.mediaUrl,
        mediaType: item.story.mediaType,
        caption: item.story.caption,
        product: item.story.product ? {
          id: item.story.product.id,
          name: item.story.product.name,
          image: item.story.product.imageUrl || '',
          price: `₹${item.story.product.sellingPrice}`,
          originalPrice: item.story.product.mrp && item.story.product.mrp > item.story.product.sellingPrice ? `₹${item.story.product.mrp}` : undefined,
        } : null,
        createdAt: item.story.createdAt,
        viewsCount: item.story._count.views,
        likesCount: item.story._count.likes,
      }))
    };
  }

  /**
   * Delete a highlight.
   */
  static async deleteHighlight(userId: string, highlightId: string) {
    const highlight = await prisma.highlight.findUnique({
      where: { id: highlightId },
      include: { store: { include: { users: true } } }
    });

    if (!highlight) {
      throw new AppError('Highlight not found', 404);
    }

    const isOwner = highlight.store.users.some(u => u.userId === userId);
    if (!isOwner) {
      throw new AppError('Unauthorized: You do not own this highlight', 403);
    }

    await prisma.highlight.delete({
      where: { id: highlightId }
    });

    return { success: true };
  }
}
