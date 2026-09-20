import { prisma } from '@workspace/db';
import { AppError } from '../../../shared/errors/AppError';
import { S3Service } from '../infrastructure/s3.service';
import { processMediaJob } from '../../media/application/media-worker.service';
import { redisClient } from '../../../shared/services/redis.service';
import { MemoryCacheService } from '../../../shared/services/memory-cache.service';

export class ContentService {
  
  static async getPresignedUrl(filename: string, contentType: string, userId?: string) {
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) {
        throw new AppError('User not found', 404);
      }
    }
    return await S3Service.generatePresignedUrl(filename, contentType);
  }

  static extractFileKeyFromUrl(url: string): string {
    if (!url) return '';
    // 1. Handle query param keys (/media/view?key=...)
    if (url.includes('key=')) {
      const match = url.match(/key=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
    // 2. Handle stream proxy paths (/api/v1/media/stream/...)
    if (url.includes('/media/stream/')) {
      const idx = url.indexOf('/media/stream/');
      return url.substring(idx + '/media/stream/'.length).replace(/^\/+/, '');
    }
    // 3. Handle R2 dev domains (*.r2.dev/...)
    if (url.includes('.r2.dev/')) {
      const idx = url.indexOf('.r2.dev/');
      return url.substring(idx + '.r2.dev/'.length).replace(/^\/+/, '');
    }
    // 4. Handle standard prefix paths
    if (url.includes('uploads/')) {
      const idx = url.indexOf('uploads/');
      return url.substring(idx);
    }
    if (url.includes('processed/')) {
      const idx = url.indexOf('processed/');
      return url.substring(idx);
    }
    return url.replace(/^\/+/, '');
  }

  static async invalidateFeedCaches(prefix: string) {
    try {
      MemoryCacheService.invalidatePrefix('posts:');
      MemoryCacheService.invalidatePrefix('reels:');
      MemoryCacheService.invalidatePrefix('stories:');
      const keys = await redisClient.keys(prefix);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch {}
  }

  static async createPost(authorId: string, data: any) {
    // 1. Verify author exists
    const user = await prisma.user.findUnique({ where: { id: authorId }, select: { id: true } });
    if (!user) throw new AppError('Author user not found', 404);

    // 2. Check if author is associated with a store (for optional product tagging)
    const storeUser = await prisma.storeUser.findFirst({
      where: { userId: authorId },
      include: { store: true }
    });

    // 3. Create post
    const post = await prisma.post.create({
      data: {
        authorId,
        caption: data.caption || null
      }
    });

    // 3. Attach media
    const createdMediaAssets: any[] = [];
    if (data.media && data.media.length > 0) {
      for (const m of data.media) {
        const isVideo = m.type?.toUpperCase() === 'VIDEO';
        const asset = await prisma.mediaAsset.create({
          data: {
            url: m.url,
            originalUrl: isVideo ? m.url : undefined,
            posterUrl: m.posterUrl || null,
            type: isVideo ? 'VIDEO' : 'IMAGE',
            postId: post.id,
            status: isVideo ? (m.status || 'PROCESSING') : 'READY'
          }
        });
        createdMediaAssets.push(asset);

        // Trigger background optimization for video
        if (isVideo) {
          const fileKey = this.extractFileKeyFromUrl(m.url);
          if (fileKey) {
            processMediaJob({
              mediaId: asset.id,
              fileKey,
              type: 'VIDEO',
              rawUrl: m.url
            }).catch(err => console.warn('[ContentService] Background video job error:', err));
          }
        }
      }
    }
    if (data.mediaIds && data.mediaIds.length > 0) {
      await prisma.mediaAsset.updateMany({
        where: { id: { in: data.mediaIds } },
        data: { postId: post.id }
      });
    }

    // 4. Attach valid product links safely
    if (data.productIds && data.productIds.length > 0) {
      const validProducts = await prisma.product.findMany({
        where: { id: { in: data.productIds } },
        select: { id: true }
      });
      if (validProducts.length > 0) {
        await prisma.productLink.createMany({
          data: validProducts.map((p) => ({
            productId: p.id,
            postId: post.id
          }))
        });
      }
    }

    const createdPost = await prisma.post.findUnique({
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

    // Invalidate cached post feeds
    await ContentService.invalidateFeedCaches('cache:posts:*');

    return createdPost;
  }

  static async createReel(authorId: string, data: any) {
    // 1. Verify author exists
    const user = await prisma.user.findUnique({ where: { id: authorId }, select: { id: true } });
    if (!user) throw new AppError('Author user not found', 404);

    // 2. Check if author is associated with a store (for optional product tagging)
    const storeUser = await prisma.storeUser.findFirst({
      where: { userId: authorId },
      include: { store: true }
    });

    // 3. Create reel
    const reel = await prisma.reel.create({
      data: {
        authorId,
        caption: data.caption || null
      }
    });

    // 3. Attach media
    const createdMediaAssets: any[] = [];
    if (data.media && data.media.length > 0) {
      for (const m of data.media) {
        const isVideo = m.type?.toUpperCase() === 'VIDEO' || true;
        const asset = await prisma.mediaAsset.create({
          data: {
            url: m.url,
            originalUrl: m.url,
            posterUrl: m.posterUrl || null,
            type: 'VIDEO',
            reelId: reel.id,
            status: m.status || 'PROCESSING'
          }
        });
        createdMediaAssets.push(asset);

        // Trigger background optimization for video
        const fileKey = this.extractFileKeyFromUrl(m.url);
        if (fileKey) {
          processMediaJob({
            mediaId: asset.id,
            fileKey,
            type: 'VIDEO',
            rawUrl: m.url
          }).catch(err => console.warn('[ContentService] Background reel job error:', err));
        }
      }
    }
    if (data.mediaIds && data.mediaIds.length > 0) {
      await prisma.mediaAsset.updateMany({
        where: { id: { in: data.mediaIds } },
        data: { reelId: reel.id }
      });
    }

    // 4. Attach valid product links safely
    if (data.productIds && data.productIds.length > 0) {
      const validProducts = await prisma.product.findMany({
        where: { id: { in: data.productIds } },
        select: { id: true }
      });
      if (validProducts.length > 0) {
        await prisma.productLink.createMany({
          data: validProducts.map((p) => ({
            productId: p.id,
            reelId: reel.id
          }))
        });
      }
    }

    const createdReel = await prisma.reel.findUnique({
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

    // Invalidate cached reel feeds
    await ContentService.invalidateFeedCaches('cache:reels:*');

    return createdReel;
  }

  static async getPosts(page = 1, limit = 10, viewerId?: string) {
    if (!viewerId) {
      return await MemoryCacheService.getOrSet(`posts:page:${page}:limit:${limit}`, async () => {
        return await this.fetchPosts(page, limit);
      }, 60);
    }
    return await this.fetchPosts(page, limit, viewerId);
  }

  private static async fetchPosts(page = 1, limit = 10, viewerId?: string) {
    const cacheKey = !viewerId ? `cache:posts:page:${page}:limit:${limit}` : null;
    if (cacheKey) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch {}
    }

    const skip = (page - 1) * limit;
    
    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      where: viewerId ? {
        reports: {
          none: {
            userId: viewerId
          }
        }
      } : undefined,
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
                  select: { id: true, name: true, logoUrl: true, status: true, isVerified: true, verificationStatus: true }
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

    const formattedPosts = posts.map(post => {
      const store = post.author.stores?.[0]?.store;
      const primaryProduct = post.productLinks?.[0]?.product;
      const mrp = primaryProduct?.mrp;
      const price = primaryProduct?.sellingPrice;

      return {
        id: post.id,
        authorId: post.author.id,
        caption: post.caption,
        createdAt: post.createdAt,
        storeId: store?.id || '',
        storeName: store?.name || post.author.name,
        storeAvatar: store?.logoUrl || post.author.avatarUrl || '',
        isVerified: Boolean(store?.isVerified || store?.status === 'VERIFIED' || store?.verificationStatus === 'APPROVED'),
        media: post.media.map(m => ({
          id: m.id,
          type: (m.type?.toLowerCase() || 'image') as 'image' | 'video',
          url: m.url,
          posterUrl: m.posterUrl || undefined,
          status: m.status,
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
          price: price !== undefined && price !== null ? String(price) : '',
          originalPrice: mrp && mrp > price! ? String(mrp) : undefined,
          discount: mrp && mrp > price! ? `${Math.round(((mrp - price!) / mrp) * 100)}% OFF` : undefined,
        } : undefined,
      };
    });

    // Store in Redis with 30s TTL
    if (cacheKey && formattedPosts.length > 0) {
      const k: string = cacheKey;
      try {
        await redisClient.setex(k, 30, JSON.stringify(formattedPosts));
      } catch {}
    }

    return formattedPosts;
  }

  static async getPostById(postId: string, viewerId?: string) {
    // 1. Try finding in Post table
    const post = await prisma.post.findUnique({
      where: { id: postId },
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
                  select: { id: true, name: true, logoUrl: true, status: true, isVerified: true, verificationStatus: true }
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

    if (post) {
      const store = post.author.stores?.[0]?.store;
      const primaryProduct = post.productLinks?.[0]?.product;
      const mrp = primaryProduct?.mrp;
      const price = primaryProduct?.sellingPrice;

      return {
        id: post.id,
        authorId: post.author.id,
        caption: post.caption,
        createdAt: post.createdAt,
        storeId: store?.id || '',
        storeName: store?.name || post.author.name,
        storeAvatar: store?.logoUrl || post.author.avatarUrl || '',
        isVerified: Boolean(store?.isVerified || store?.status === 'VERIFIED' || store?.verificationStatus === 'APPROVED'),
        media: post.media.map(m => ({
          id: m.id,
          type: (m.type?.toLowerCase() || 'image') as 'image' | 'video',
          url: m.url,
          posterUrl: m.posterUrl || undefined,
          status: m.status,
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
          price: price !== undefined && price !== null ? String(price) : '',
          originalPrice: mrp && mrp > price! ? String(mrp) : undefined,
          discount: mrp && mrp > price! ? `${Math.round(((mrp - price!) / mrp) * 100)}% OFF` : undefined,
        } : undefined,
      };
    }

    // 2. Fallback: if not in Post table, check Reel table
    const reel = await prisma.reel.findUnique({
      where: { id: postId },
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
                  select: { id: true, name: true, logoUrl: true, status: true, isVerified: true, verificationStatus: true }
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

    if (reel) {
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
        storeAvatar: store?.logoUrl || reel.author.avatarUrl || '',
        isVerified: Boolean(store?.isVerified || store?.status === 'VERIFIED' || store?.verificationStatus === 'APPROVED'),
        media: reel.media.map(m => ({
          id: m.id,
          type: 'video' as const,
          url: m.url,
          posterUrl: m.posterUrl || undefined,
          status: m.status,
          duration: m.duration ? `${Math.floor(m.duration / 60)}:${(m.duration % 60).toString().padStart(2, '0')}` : undefined,
        })),
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
          price: price !== undefined && price !== null ? String(price) : '',
          originalPrice: mrp && mrp > price! ? String(mrp) : undefined,
          discount: mrp && mrp > price! ? `${Math.round(((mrp - price!) / mrp) * 100)}% OFF` : undefined,
        } : undefined,
      };
    }

    throw new AppError('Post not found', 404);
  }

  static async getReels(page = 1, limit = 10, viewerId?: string) {
    if (!viewerId) {
      return await MemoryCacheService.getOrSet(`reels:page:${page}:limit:${limit}`, async () => {
        return await this.fetchReels(page, limit);
      }, 60);
    }
    return await this.fetchReels(page, limit, viewerId);
  }

  private static async fetchReels(page = 1, limit = 10, viewerId?: string) {
    const cacheKey = !viewerId ? `cache:reels:page:${page}:limit:${limit}` : null;
    if (cacheKey) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch {}
    }

    const skip = (page - 1) * limit;
    
    const reels = await prisma.reel.findMany({
      take: limit * 2,
      where: viewerId ? {
        reports: {
          none: {
            userId: viewerId
          }
        }
      } : undefined,
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
                  select: { id: true, name: true, logoUrl: true, status: true, isVerified: true, verificationStatus: true }
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

    // Also fetch video posts from Post table so video posts open seamlessly in reel format
    const videoPosts = await prisma.post.findMany({
      take: limit * 2,
      where: {
        media: {
          some: {
            type: 'VIDEO'
          }
        },
        ...(viewerId ? {
          reports: {
            none: {
              userId: viewerId
            }
          }
        } : {})
      },
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
                  select: { id: true, name: true, logoUrl: true, status: true, isVerified: true, verificationStatus: true }
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

    // Merge and sort by newest first
    const merged = [...reels, ...videoPosts].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(skip, skip + limit);

    const formattedReels = merged.map(item => {
      const store = item.author.stores?.[0]?.store;
      const primaryProduct = item.productLinks?.[0]?.product;
      const mrp = primaryProduct?.mrp;
      const price = primaryProduct?.sellingPrice;

      const videoMedia = item.media.find(m => m.type === 'VIDEO') || item.media[0];
      const videoStatus = videoMedia?.status || 'READY';

      return {
        id: item.id,
        authorId: item.author.id,
        caption: item.caption,
        createdAt: item.createdAt,
        storeId: store?.id || '',
        storeName: store?.name || item.author.name,
        storeAvatar: store?.logoUrl || item.author.avatarUrl || '',
        isVerified: Boolean(store?.isVerified || store?.status === 'VERIFIED' || store?.verificationStatus === 'APPROVED'),
        videoUrl: videoMedia?.url || '',
        posterUrl: videoMedia?.posterUrl || '',
        status: videoStatus,
        isOptimizing: videoStatus !== 'READY',
        media: item.media,
        likes: item._count.likes.toLocaleString(),
        likesCount: item._count.likes,
        comments: item._count.comments.toString(),
        commentsCount: item._count.comments,
        shares: '0',
        isLikedByMe: viewerId ? (item.likes?.length || 0) > 0 : false,
        isSavedByMe: viewerId ? (item.savedPosts?.length || 0) > 0 : false,
        hashtags: [],
        product: primaryProduct ? {
          id: primaryProduct.id,
          name: primaryProduct.name,
          image: primaryProduct.imageUrl || '',
          price: price !== undefined && price !== null ? String(price) : '',
          originalPrice: mrp && mrp > price! ? String(mrp) : undefined,
          discount: mrp && mrp > price! ? `${Math.round(((mrp - price!) / mrp) * 100)}% OFF` : undefined,
        } : undefined,
        duration: videoMedia?.duration ? `${Math.floor(videoMedia.duration / 60)}:${(videoMedia.duration % 60).toString().padStart(2, '0')}` : '0:15',
        currentTime: '0:00',
        progressPercent: 0
      };
    });

    // Store in Redis with 30s TTL
    if (cacheKey && formattedReels.length > 0) {
      const k: string = cacheKey;
      try {
        await redisClient.setex(k, 30, JSON.stringify(formattedReels));
      } catch {}
    }

    return formattedReels;
  }

  static async getReelById(reelId: string, viewerId?: string) {
    // 1. Check Reel table
    const reel = await prisma.reel.findUnique({
      where: { id: reelId },
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

    if (reel) {
      const store = reel.author.stores?.[0]?.store;
      const primaryProduct = reel.productLinks?.[0]?.product;
      const mrp = primaryProduct?.mrp;
      const price = primaryProduct?.sellingPrice;
      const videoMedia = reel.media.find(m => m.type === 'VIDEO') || reel.media[0];
      const videoStatus = videoMedia?.status || 'READY';

      return {
        id: reel.id,
        authorId: reel.author.id,
        caption: reel.caption,
        createdAt: reel.createdAt,
        storeId: store?.id || '',
        storeName: store?.name || reel.author.name,
        storeAvatar: store?.logoUrl || reel.author.avatarUrl || '',
        isVerified: store?.status === 'VERIFIED',
        videoUrl: videoMedia?.url || '',
        posterUrl: videoMedia?.posterUrl || '',
        status: videoStatus,
        isOptimizing: videoStatus !== 'READY',
        media: reel.media,
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
          price: price !== undefined && price !== null ? String(price) : '',
          originalPrice: mrp && mrp > price! ? String(mrp) : undefined,
          discount: mrp && mrp > price! ? `${Math.round(((mrp - price!) / mrp) * 100)}% OFF` : undefined,
        } : undefined,
        duration: videoMedia?.duration ? `${Math.floor(videoMedia.duration / 60)}:${(videoMedia.duration % 60).toString().padStart(2, '0')}` : '0:15',
        currentTime: '0:00',
        progressPercent: 0
      };
    }

    // 2. Fallback: check Post table for video posts
    const post = await prisma.post.findUnique({
      where: { id: reelId },
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

    if (post) {
      const store = post.author.stores?.[0]?.store;
      const primaryProduct = post.productLinks?.[0]?.product;
      const mrp = primaryProduct?.mrp;
      const price = primaryProduct?.sellingPrice;
      const videoMedia = post.media.find(m => m.type === 'VIDEO') || post.media[0];
      const videoStatus = videoMedia?.status || 'READY';

      return {
        id: post.id,
        authorId: post.author.id,
        caption: post.caption,
        createdAt: post.createdAt,
        storeId: store?.id || '',
        storeName: store?.name || post.author.name,
        storeAvatar: store?.logoUrl || post.author.avatarUrl || '',
        isVerified: store?.status === 'VERIFIED',
        videoUrl: videoMedia?.url || '',
        posterUrl: videoMedia?.posterUrl || '',
        status: videoStatus,
        isOptimizing: videoStatus !== 'READY',
        media: post.media,
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
          price: price !== undefined && price !== null ? String(price) : '',
          originalPrice: mrp && mrp > price! ? String(mrp) : undefined,
          discount: mrp && mrp > price! ? `${Math.round(((mrp - price!) / mrp) * 100)}% OFF` : undefined,
        } : undefined,
        duration: videoMedia?.duration ? `${Math.floor(videoMedia.duration / 60)}:${(videoMedia.duration % 60).toString().padStart(2, '0')}` : '0:15',
        currentTime: '0:00',
        progressPercent: 0
      };
    }

    throw new AppError('Reel not found', 404);
  }

  static async getStorePosts(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { users: true }
    });
    const userIds = store ? store.users.map(u => u.userId) : [];

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          ...(userIds.length > 0 ? [{ authorId: { in: userIds } }] : []),
          { productLinks: { some: { product: { storeId } } } }
        ]
      },
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
      authorId: p.authorId,
      caption: p.caption,
      media: p.media,
      url: p.media?.[0]?.url || '',
      posterUrl: p.media?.[0]?.posterUrl || '',
      status: p.media?.[0]?.status || 'READY',
      type: p.media?.[0]?.type?.toLowerCase() || 'image',
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
      createdAt: p.createdAt,
    }));
  }

  static async getStoreReels(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { users: true }
    });
    const userIds = store ? store.users.map(u => u.userId) : [];

    const storeFilter = {
      OR: [
        ...(userIds.length > 0 ? [{ authorId: { in: userIds } }] : []),
        { productLinks: { some: { product: { storeId } } } }
      ]
    };

    // 1. Fetch from Reel table
    const reels = await prisma.reel.findMany({
      where: storeFilter,
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

    // 2. Fetch video posts from Post table so all videos published by the store appear under Reels
    const videoPosts = await prisma.post.findMany({
      where: {
        ...storeFilter,
        media: {
          some: {
            type: 'VIDEO'
          }
        }
      },
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

    const formattedReels = reels
      .filter(r => !(r.media?.length === 0 && !r.caption))
      .map(r => {
        const primaryMedia = r.media?.[0];
        return {
          id: r.id,
          authorId: r.authorId,
          caption: r.caption,
          videoUrl: primaryMedia?.url || '',
          url: primaryMedia?.url || '',
          posterUrl: primaryMedia?.posterUrl || '',
          status: primaryMedia?.status || 'READY',
          isOptimizing: primaryMedia?.status === 'PROCESSING' || primaryMedia?.status === 'PENDING',
          media: r.media,
          type: 'video',
          likesCount: r._count.likes,
          commentsCount: r._count.comments,
          createdAt: r.createdAt,
        };
      });

    const formattedVideoPosts = videoPosts.map(p => {
      const vidMedia = p.media?.find(m => m.type === 'VIDEO') || p.media?.[0];
      return {
        id: p.id,
        authorId: p.authorId,
        caption: p.caption,
        videoUrl: vidMedia?.url || '',
        url: vidMedia?.url || '',
        posterUrl: vidMedia?.posterUrl || '',
        status: vidMedia?.status || 'READY',
        isOptimizing: vidMedia?.status === 'PROCESSING' || vidMedia?.status === 'PENDING',
        media: p.media,
        type: 'video',
        likesCount: p._count.likes,
        commentsCount: p._count.comments,
        createdAt: p.createdAt,
      };
    });

    // Merge and filter out any items with no media and failed status
    const combined = [...formattedReels, ...formattedVideoPosts]
      .filter(item => !(item.status === 'FAILED' && !item.videoUrl && !item.url))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return combined;
  }

  static async deletePost(userId: string, postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          include: {
            stores: true
          }
        }
      }
    });

    if (!post) throw new AppError('Post not found', 404);

    const isAuthor = post.authorId === userId;
    const isStoreOwner = post.author.stores.some(s => s.userId === userId);

    if (!isAuthor && !isStoreOwner) {
      throw new AppError('Unauthorized to delete this post', 403);
    }

    await prisma.$transaction([
      prisma.like.deleteMany({ where: { postId } }),
      prisma.comment.deleteMany({ where: { postId } }),
      prisma.report.deleteMany({ where: { postId } }),
      prisma.savedPost.deleteMany({ where: { postId } }),
      prisma.productLink.deleteMany({ where: { postId } }),
      prisma.mediaAsset.deleteMany({ where: { postId } }),
      prisma.post.delete({ where: { id: postId } })
    ]);

    await ContentService.invalidateFeedCaches('cache:posts:*');

    return { success: true, message: 'Post deleted successfully' };
  }

  static async deleteReel(userId: string, reelId: string) {
    const reel = await prisma.reel.findUnique({
      where: { id: reelId },
      include: {
        author: {
          include: {
            stores: true
          }
        }
      }
    });

    if (!reel) throw new AppError('Reel not found', 404);

    const isAuthor = reel.authorId === userId;
    const isStoreOwner = reel.author.stores.some(s => s.userId === userId);

    if (!isAuthor && !isStoreOwner) {
      throw new AppError('Unauthorized to delete this reel', 403);
    }

    await prisma.$transaction([
      prisma.like.deleteMany({ where: { reelId } }),
      prisma.comment.deleteMany({ where: { reelId } }),
      prisma.report.deleteMany({ where: { reelId } }),
      prisma.savedPost.deleteMany({ where: { reelId } }),
      prisma.productLink.deleteMany({ where: { reelId } }),
      prisma.mediaAsset.deleteMany({ where: { reelId } }),
      prisma.reel.delete({ where: { id: reelId } })
    ]);

    await ContentService.invalidateFeedCaches('cache:reels:*');

    return { success: true, message: 'Reel deleted successfully' };
  }
}
