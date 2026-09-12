import { prisma } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';
import { S3Service } from '../infrastructure/s3.service';

export class ContentService {
  
  static async getPresignedUrl(filename: string, contentType: string) {
    return await S3Service.generatePresignedUrl(filename, contentType);
  }

  static async createPost(authorId: string, data: any) {
    return await prisma.$transaction(async (tx) => {
      // Create post
      const post = await tx.post.create({
        data: {
          authorId,
          caption: data.caption
        }
      });

      // Attach media
      if (data.media && data.media.length > 0) {
        await tx.mediaAsset.createMany({
          data: data.media.map((m: any) => ({
            url: m.url,
            type: m.type,
            postId: post.id,
            status: 'READY'
          }))
        });
      }
      if (data.mediaIds && data.mediaIds.length > 0) {
        await tx.mediaAsset.updateMany({
          where: { id: { in: data.mediaIds } },
          data: { postId: post.id }
        });
      }

      // Attach product links
      if (data.productIds && data.productIds.length > 0) {
        await tx.productLink.createMany({
          data: data.productIds.map((productId: string) => ({
            productId,
            postId: post.id
          }))
        });
      }

      return await tx.post.findUnique({
        where: { id: post.id },
        include: {
          media: true,
          productLinks: {
            include: { product: true }
          },
          author: {
            select: { id: true, name: true }
          }
        }
      });
    });
  }

  static async createReel(authorId: string, data: any) {
    return await prisma.$transaction(async (tx) => {
      // Create reel
      const reel = await tx.reel.create({
        data: {
          authorId,
          caption: data.caption
        }
      });

      // Attach media
      if (data.media && data.media.length > 0) {
        await tx.mediaAsset.createMany({
          data: data.media.map((m: any) => ({
            url: m.url,
            type: m.type,
            reelId: reel.id,
            status: 'READY'
          }))
        });
      }
      if (data.mediaIds && data.mediaIds.length > 0) {
        await tx.mediaAsset.updateMany({
          where: { id: { in: data.mediaIds } },
          data: { reelId: reel.id }
        });
      }

      // Attach product links
      if (data.productIds && data.productIds.length > 0) {
        await tx.productLink.createMany({
          data: data.productIds.map((productId: string) => ({
            productId,
            reelId: reel.id
          }))
        });
      }

      return await tx.reel.findUnique({
        where: { id: reel.id },
        include: {
          media: true,
          productLinks: {
            include: { product: true }
          },
          author: {
            select: { id: true, name: true }
          }
        }
      });
    });
  }

  static async getPosts(page = 1, limit = 10, viewerId?: string) {
    const skip = (page - 1) * limit;
    
    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        media: true,
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            stores: {
              include: {
                store: {
                  select: { id: true, name: true, logoUrl: true, status: true }
                }
              }
            }
          }
        },
        productLinks: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true, sellingPrice: true, mrp: true }
            }
          }
        },
        likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
        savedPosts: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
        _count: {
          select: { likes: true, comments: true }
        }
      }
    });

    return posts.map(post => {
      const store = post.author.stores?.[0]?.store;
      const primaryProduct = post.productLinks?.[0]?.product;
      const mrp = primaryProduct?.mrp;
      const price = primaryProduct?.sellingPrice;

      return {
        id: post.id,
        caption: post.caption,
        createdAt: post.createdAt,
        storeId: store?.id || '',
        storeName: store?.name || post.author.name,
        storeAvatar: store?.logoUrl || post.author.avatarUrl || 'https://i.pravatar.cc/150?img=1',
        isVerified: store?.status === 'VERIFIED',
        media: post.media.map(m => ({
          id: m.id,
          type: (m.type?.toLowerCase() || 'image') as 'image' | 'video',
          url: m.url,
          duration: m.duration ? `${Math.floor(m.duration / 60)}:${(m.duration % 60).toString().padStart(2, '0')}` : undefined,
        })),
        likes: post._count.likes.toLocaleString(),
        likesCount: post._count.likes,
        comments: post._count.comments.toString(),
        commentsCount: post._count.comments,
        shares: '0',
        isLikedByMe: viewerId ? (post.likes?.length || 0) > 0 : false,
        isSavedByMe: viewerId ? (post.savedPosts?.length || 0) > 0 : false,
        hashtags: [],
        product: primaryProduct ? {
          id: primaryProduct.id,
          name: primaryProduct.name,
          image: primaryProduct.imageUrl || '',
          price: `₹${price}`,
          originalPrice: mrp && mrp > price! ? `₹${mrp}` : undefined,
          discount: mrp && mrp > price! ? `${Math.round(((mrp - price!) / mrp) * 100)}% OFF` : undefined,
        } : undefined,
      };
    });
  }

  static async getReels(page = 1, limit = 10, viewerId?: string) {
    const skip = (page - 1) * limit;
    
    const reels = await prisma.reel.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        media: true,
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            stores: {
              include: {
                store: {
                  select: { id: true, name: true, logoUrl: true, status: true }
                }
              }
            }
          }
        },
        productLinks: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true, sellingPrice: true, mrp: true }
            }
          }
        },
        likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
        savedPosts: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
        _count: {
          select: { likes: true, comments: true }
        }
      }
    });

    return reels.map(reel => {
      const store = reel.author.stores?.[0]?.store;
      const primaryProduct = reel.productLinks?.[0]?.product;
      const mrp = primaryProduct?.mrp;
      const price = primaryProduct?.sellingPrice;

      return {
        id: reel.id,
        authorId: reel.author.id,
        caption: reel.caption,
        createdAt: reel.createdAt,
        storeId: store?.id || '',
        storeName: store?.name || reel.author.name,
        storeAvatar: store?.logoUrl || reel.author.avatarUrl || 'https://i.pravatar.cc/150?img=21',
        isVerified: store?.status === 'VERIFIED',
        videoUrl: reel.media?.[0]?.url || '',
        likes: reel._count.likes.toLocaleString(),
        likesCount: reel._count.likes,
        comments: reel._count.comments.toString(),
        commentsCount: reel._count.comments,
        shares: '0',
        isLikedByMe: viewerId ? (reel.likes?.length || 0) > 0 : false,
        isSavedByMe: viewerId ? (reel.savedPosts?.length || 0) > 0 : false,
        hashtags: [],
        product: primaryProduct ? {
          id: primaryProduct.id,
          name: primaryProduct.name,
          image: primaryProduct.imageUrl || '',
          price: `₹${price}`,
          originalPrice: mrp && mrp > price! ? `₹${mrp}` : undefined,
          discount: mrp && mrp > price! ? `${Math.round(((mrp - price!) / mrp) * 100)}% OFF` : undefined,
        } : undefined,
        duration: '0:15',
        currentTime: '0:00',
        progressPercent: 0
      };
    });
  }

  static async getStorePosts(storeId: string) {
    const storeUsers = await prisma.storeUser.findMany({
      where: { storeId },
      select: { userId: true }
    });
    const userIds = storeUsers.map(su => su.userId);

    const posts = await prisma.post.findMany({
      where: { authorId: { in: userIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        media: true,
        productLinks: {
          include: { product: true }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      }
    });

    return posts.map(p => ({
      id: p.id,
      caption: p.caption,
      media: p.media,
      url: p.media?.[0]?.url || '',
      type: p.media?.[0]?.type?.toLowerCase() || 'image',
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
      createdAt: p.createdAt,
    }));
  }

  static async getStoreReels(storeId: string) {
    const storeUsers = await prisma.storeUser.findMany({
      where: { storeId },
      select: { userId: true }
    });
    const userIds = storeUsers.map(su => su.userId);

    const reels = await prisma.reel.findMany({
      where: { authorId: { in: userIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        media: true,
        productLinks: {
          include: { product: true }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      }
    });

    return reels.map(r => ({
      id: r.id,
      caption: r.caption,
      videoUrl: r.media?.[0]?.url || '',
      url: r.media?.[0]?.url || '',
      type: 'video',
      likesCount: r._count.likes,
      commentsCount: r._count.comments,
      createdAt: r.createdAt,
    }));
  }
}
